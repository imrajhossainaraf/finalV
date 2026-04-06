import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, Download, Filter, CalendarCheck } from 'lucide-react';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--attendly-text-primary) 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Attendance Logs
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--attendly-text-muted)' }}>
            View and manage all RFID scan records.
          </p>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            background: 'var(--attendly-gradient-primary)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 25px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Table Card */}
      <div className="glass-card overflow-hidden animate-fade-in-up stagger-2">
        {/* Toolbar */}
        <div
          className="p-4 flex flex-col sm:flex-row gap-4 justify-between"
          style={{ borderBottom: '1px solid var(--attendly-border)' }}
        >
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--attendly-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by UID or Name..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--attendly-bg-elevated)',
                border: '1px solid var(--attendly-border)',
                color: 'var(--attendly-text-primary)',
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <input 
              type="date" 
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--attendly-bg-elevated)',
                border: '1px solid var(--attendly-border)',
                color: 'var(--attendly-text-secondary)',
              }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>UID</th>
                <th>Device</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record, idx) => (
                <tr key={record.id || idx} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: 'white',
                        }}
                      >
                        {record.student_name ? record.student_name.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--attendly-text-primary)' }}>
                          {record.student_name || 'Unknown'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--attendly-text-muted)' }}>
                          {record.class || 'No class'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="font-mono text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: 'var(--attendly-bg-elevated)',
                        color: 'var(--attendly-text-secondary)',
                      }}
                    >
                      {record.uid}
                    </span>
                  </td>
                  <td>
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{
                        background: 'rgba(99,102,241,0.08)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99,102,241,0.15)',
                      }}
                    >
                      {record.device_name || record.device_mac}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm font-medium" style={{ color: 'var(--attendly-text-primary)' }}>
                      {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--attendly-text-muted)' }}>
                      {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: record.email_sent ? 'var(--attendly-accent-success)' : 'var(--attendly-accent-warning)',
                          boxShadow: record.email_sent
                            ? '0 0 8px rgba(16,185,129,0.4)'
                            : '0 0 8px rgba(245,158,11,0.4)',
                        }}
                      />
                      <span className="text-xs font-medium" style={{ color: record.email_sent ? '#34d399' : '#fbbf24' }}>
                        {record.email_sent ? 'Notified' : 'Pending'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Filter size={40} style={{ color: 'var(--attendly-text-muted)', opacity: 0.2 }} />
                      <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>
                        No records found matching your filters.
                      </p>
                    </div>
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
