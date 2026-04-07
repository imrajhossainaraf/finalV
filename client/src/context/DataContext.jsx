import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [devices, setDevices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [forcedDate, setForcedDate] = useState("");
  const [triggeredIds, setTriggeredIds] = useState(new Set());

  const triggerLocalEmail = useCallback(async (record) => {
    try {
      // Find student info if not already in record
      const student = students.find(s => s.id === record.student_id) || {
        name: record.student_name,
        email: record.email,
        class: record.class,
        roll_number: record.roll_number
      };

      if (!student.email || student.email.includes('pending.com')) {
        console.log('ℹ️ Skipping email for student without valid email:', student.name);
        return;
      }

      await axios.post('http://localhost:5001/api/send-attendance', {
        student,
        device: { name: record.device_name || 'Scanner' },
        timestamp: record.timestamp
      });
      
      console.log('📧 Local email triggered for', student.name);
      
      // Sync status back to main server if possible
      try {
        await axios.patch(`/api/attendance/${record.id}/status`, { email_sent: 1 });
      } catch (syncErr) {
        console.error('Failed to sync status:', syncErr.message);
      }
    } catch (err) {
      console.error('❌ Local email service not reachable or failed:', err.message);
      throw err;
    }
  }, [students]);

  const sendManualNotice = useCallback(async (student, message) => {
    try {
      if (!student.email || student.email.includes('pending.com')) {
        toast.warn(`Cannot send email to ${student.name} (invalid email)`);
        return;
      }

      await axios.post('http://localhost:5001/api/send-manual', {
        student,
        message
      });
      
      toast.success(`Individual manual notice sent to ${student.email}`);
    } catch (err) {
      console.error('❌ Manual notice failed:', err.message);
      toast.error('Local email service is not running!');
    }
  }, []);

  const triggerBulkNotice = useCallback(async (date) => {
    try {
      // 1. Filter attendance for that date (YYYY-MM-DD)
      const attendanceForDate = attendance.filter(r => {
        try {
          return new Date(r.timestamp).toISOString().split('T')[0] === date;
        } catch { return false; }
      });
      
      const attendanceMap = {};
      attendanceForDate.forEach(r => {
        if (r.student_id) attendanceMap[r.student_id] = true;
      });

      // 2. Prepare student status list (Active only)
      const bulkList = students
        .filter(s => s.active === 1 && s.email && !s.email.includes('pending.com'))
        .map(s => ({
          name: s.name,
          email: s.email,
          class: s.class,
          hasAttended: !!attendanceMap[s.id]
        }));

      if (bulkList.length === 0) {
        toast.info("No active students with valid emails found.");
        return { stats: { total: 0, sent: 0, failed: 0 } };
      }

      // 3. Trigger local email service bulk endpoint
      const response = await axios.post('http://localhost:5001/api/send-bulk', {
        students: bulkList,
        date
      });
      
      return response.data;
    } catch (err) {
      console.error('❌ Bulk notice failed:', err.message);
      throw err;
    }
  }, [students, attendance]);

  const fetchAllData = useCallback(
    async (silent = true) => {
      try {
        if (!silent) setLoading(true);
        const testDateQuery = forcedDate ? `?date=${forcedDate}` : "";

        const [statsRes, attendanceRes, devicesRes, studentsRes] =
          await Promise.all([
            axios.get(`/api/stats${testDateQuery}`),
            axios.get(`/api/attendance${testDateQuery}`),
            axios.get("/api/devices"),
            axios.get("/api/students"),
          ]);

        setStats(statsRes.data);
        setAttendance(attendanceRes.data.attendance || []);
        setDevices(devicesRes.data.devices || []);
        setStudents(studentsRes.data.students || []);
        setLastFetch(new Date());
      } catch (err) {
        console.error("Error fetching data:", err);
        if (!silent) {
          toast.error("Failed to connect to Attendly server.");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [forcedDate],
  );

  useEffect(() => {
    // Initial fetch, not silent
    fetchAllData(false);

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAllData, forcedDate]);

  useEffect(() => {
    const processPending = async () => {
      const pending = attendance.filter(r => r.email_sent === 0 && !triggeredIds.has(r.id));
      if (pending.length > 0) {
        const newIds = new Set(triggeredIds);
        for (const record of pending) {
          newIds.add(record.id);
          triggerLocalEmail(record);
        }
        setTriggeredIds(newIds);
      }
    };
    
    if (attendance.length > 0) {
      processPending();
    }
  }, [attendance, triggeredIds, students, triggerLocalEmail]);

  return (
    <DataContext.Provider
      value={{
        stats,
        attendance,
        devices,
        students,
        loading,
        lastFetch,
        refetch: () => fetchAllData(false),
        triggerLocalEmail,
        sendManualNotice,
        triggerBulkNotice,
        forcedDate,
        setForcedDate,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
