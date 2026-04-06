import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, Download, Filter } from 'lucide-react';

export default function Attendance() {
  const { attendance } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filtering
  const filteredAttendance = attendance?.filter((record) => {
    const matchesSearch = 
      record.uid.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (record.student_name && record.student_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
    const matchesDate = filterDate ? recordDate === filterDate : true;

    return matchesSearch && matchesDate;
  }) || [];

  // CSV Export
  const exportToCSV = () => {
    if (!filteredAttendance.length) return;
    const headers = ['UID', 'Student Name', 'Device', 'Timestamp', 'Email Sent'];
    const csvContent = [
      headers.join(','),
      ...filteredAttendance.map(r => [
        r.uid,
        r.student_name || 'Unknown',
        r.device_name || r.device_mac,
        new Date(r.timestamp).toISOString(),
        r.email_sent ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Logs</h1>
          <p className="text-base-content/60 mt-1">View and manage all RFID scan records.</p>
        </div>
        
        <button onClick={exportToCSV} className="btn btn-primary shadow-lg shadow-primary/20">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-base-200 flex flex-col sm:flex-row gap-4 justify-between bg-base-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
            <input 
              type="text" 
              placeholder="Search by UID or Name..." 
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <input 
              type="date" 
              className="input input-bordered" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-base-200/50 text-base-content/70 text-sm">
                <th>Student</th>
                <th>UID</th>
                <th>Device</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record, idx) => (
                <tr key={record.id || idx} className="hover:bg-base-200/30 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8">
                          <span className="text-xs">{record.student_name ? record.student_name.charAt(0) : '?'}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-sm">{record.student_name || 'Unknown'}</div>
                        <div className="text-xs opacity-50">{record.class || 'No class'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-base-content/70">
                    {record.uid}
                  </td>
                  <td>
                    <span className="badge badge-ghost badge-sm">{record.device_name || record.device_mac}</span>
                  </td>
                  <td>
                    <div className="text-sm font-medium">
                      {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs text-base-content/50">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2 items-center">
                      <div className={`w-2 h-2 rounded-full ${record.email_sent ? 'bg-success' : 'bg-warning'}`}></div>
                      <span className="text-xs">{record.email_sent ? 'Notified' : 'Pending'}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-base-content/50">
                    <Filter size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No records found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
