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
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem('attendly_stats')) || null);
  const [attendance, setAttendance] = useState(() => JSON.parse(localStorage.getItem('attendly_attendance')) || []);
  const [devices, setDevices] = useState(() => JSON.parse(localStorage.getItem('attendly_devices')) || []);
  const [students, setStudents] = useState(() => JSON.parse(localStorage.getItem('attendly_students')) || []);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [forcedDate, setForcedDateState] = useState(() => sessionStorage.getItem('attendly_forcedDate') || "");
  const [triggeredIds, setTriggeredIds] = useState(new Set());

  // Wrapper for setForcedDate to also update sessionStorage so it persists page reloads
  const setForcedDate = useCallback((date) => {
    setForcedDateState(date);
    sessionStorage.setItem('attendly_forcedDate', date);
  }, []);

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

        const [devicesRes, studentsRes, allScansRes] =
          await Promise.all([
            axios.get("/api/devices"),
            axios.get("/api/students"),
            axios.get("/api/attendance"), // Fetch all scans un-filtered to compute chart data correctly
          ]);

        const rawDevices = devicesRes.data.devices || [];
        const rawStudents = studentsRes.data.students || [];
        let allScans = allScansRes.data.attendance || [];

        // 1. Fix broken ESP32 timestamps by using the accurate SQLite created_at column
        allScans = allScans.map(scan => {
          if (scan.created_at) {
            // Convert 'YYYY-MM-DD HH:MM:SS' to ISO string format 'YYYY-MM-DDTHH:MM:SSZ'
            // This ensures all charts and UI components see the correct time.
            scan.timestamp = scan.created_at.replace(' ', 'T') + 'Z'; 
          }
          return scan;
        });

        // Force sort dynamically just in case database order was based on the broken timestamps
        allScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // 2. Identify target date for stats calculation (either forcedDate or today's true date)
        const targetDate = forcedDate || new Date().toISOString().split('T')[0];

        // 3. Calculate accurate stats based on the corrected timestamps
        const dailyAttendanceMap = {};
        allScans.forEach(scan => {
          const scanDate = scan.timestamp.split('T')[0];
          if (scanDate === targetDate) {
            const key = scan.student_id || scan.uid;
            if (!dailyAttendanceMap[key]) {
              dailyAttendanceMap[key] = scan;
            }
          }
        });

        const computedStats = {
          totalStudents: rawStudents.filter(s => s.active === 1).length,
          totalDevices: rawDevices.length,
          todayAttendance: Object.keys(dailyAttendanceMap).length, // Unique records today
          totalAttendance: allScans.length // All-time scans
        };

        // 4. If a forcedDate is selected, only pass that day's data down so UI updates to that day
        let displayScans = allScans;
        if (forcedDate) {
           displayScans = allScans.filter(scan => scan.timestamp.split('T')[0] === forcedDate);
        }

        setStats(computedStats);
        setAttendance(displayScans);
        setDevices(rawDevices);
        setStudents(rawStudents);
        setLastFetch(new Date());

        // Cache the data locally so it persists when the page is refreshed or goes offline
        localStorage.setItem('attendly_stats', JSON.stringify(computedStats));
        localStorage.setItem('attendly_attendance', JSON.stringify(displayScans));
        localStorage.setItem('attendly_devices', JSON.stringify(rawDevices));
        localStorage.setItem('attendly_students', JSON.stringify(rawStudents));
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

  const resetDemoData = useCallback(async () => {
    try {
      await axios.delete('/api/attendance');
      toast.success('All scans deleted for demo!', { autoClose: 3000 });
      // Wait a moment then fetch fresh data
      setTimeout(() => fetchAllData(false), 500);
    } catch (err) {
      console.error('Reset error:', err.message);
      toast.error('Failed to reset data! Make sure you updated the render server.');
    }
  }, [fetchAllData]);

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
        resetDemoData,
        forcedDate,
        setForcedDate,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
