import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [devices, setDevices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAllData = async (silent = true) => {
    try {
      if (!silent) setLoading(true);
      const [statsRes, attendanceRes, devicesRes, studentsRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/attendance'),
        axios.get('/api/devices'),
        axios.get('/api/students')
      ]);

      setStats(statsRes.data);
      setAttendance(attendanceRes.data.attendance || []);
      setDevices(devicesRes.data.devices || []);
      setStudents(studentsRes.data.students || []);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      if (!silent) {
        toast.error('Failed to connect to Attendly server.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch, not silent
    fetchAllData(false);

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DataContext.Provider value={{ stats, attendance, devices, students, loading, lastFetch, refetch: () => fetchAllData(false) }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
