import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Printer, 
  BarChart3, 
  ChevronRight,
  Search,
  School
} from 'lucide-react';

export default function Summary() {
  const { students, attendanceLogs, todayAttendanceMap } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate Metrics
  const activeStudents = useMemo(() => students?.filter(s => s.active) || [], [students]);
  const presentCount = useMemo(() => Object.keys(todayAttendanceMap || {}).length, [todayAttendanceMap]);
  const absentCount = activeStudents.length - presentCount;
  const attendanceRate = activeStudents.length > 0 ? ((presentCount / activeStudents.length) * 100).toFixed(1) : 0;

  // Today's Logs (filtered for "today" in the context of the app's current date)
  // Note: DataContext usually filters logs, but let's ensure we show meaningful data.
  const todayLogs = useMemo(() => {
    // In a real scenario, we'd filter by date. 
    // For this UI demo, we use the logs provided by context which are already relevant.
    return (attendanceLogs || [])
      .filter(log => !searchTerm || log.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [attendanceLogs, searchTerm]);

  const classSummary = useMemo(() => {
    const summary = {};
    activeStudents.forEach(s => {
      const cls = s.class || 'Unassigned';
      if (!summary[cls]) summary[cls] = { total: 0, present: 0 };
      summary[cls].total++;
      if (todayAttendanceMap?.[(s._id || s.id || s.uid)?.toString()]) {
        summary[cls].present++;
      }
    });
    return Object.entries(summary).map(([name, data]) => ({
      name,
      ...data,
      rate: ((data.present / data.total) * 100).toFixed(1)
    })).sort((a, b) => b.rate - a.rate);
  }, [activeStudents, todayAttendanceMap]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
              Daily Report
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--attendly-text-primary)' }}>
            Attendance <span className="text-indigo-500">Summary</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
            <Calendar size={14} className="inline mr-1 mb-0.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/5 hover:bg-white/5" style={{ color: 'var(--attendly-text-secondary)' }}>
            <Printer size={18} />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300" 
            style={{ background: 'var(--attendly-gradient-primary)', color: 'white' }}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Expected', value: activeStudents.length, icon: Users, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.1)' },
          { label: 'Present Now', value: presentCount, icon: CheckCircle2, color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
          { label: 'Absent Today', value: absentCount, icon: XCircle, color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' },
          { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: BarChart3, color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.1)' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full -mr-8 -mt-8 opacity-20 transition-all duration-500 group-hover:scale-150" style={{ background: stat.color }} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--attendly-text-muted)' }}>{stat.label}</p>
                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
              </div>
              <div className="p-3 rounded-2xl border" style={{ color: stat.color, borderColor: 'rgba(255,255,255,0.05)', background: stat.bg }}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold" style={{ color: stat.color }}>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ background: stat.color, width: i === 3 ? `${attendanceRate}%` : '100%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Class Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <School size={20} className="text-indigo-400" />
              Class Breakdown
            </h2>
          </div>
          <div className="glass-card divide-y divide-white/5 overflow-hidden">
            {classSummary.map((cls, i) => (
              <div key={i} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{cls.name}</h4>
                  <p className="text-xs text-slate-500">{cls.present} / {cls.total} Students</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white">{cls.rate}%</span>
                  <div className="w-16 h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${cls.rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {classSummary.length === 0 && (
              <div className="p-8 text-center text-slate-500 italic text-sm">
                No class data available.
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-indigo-400" />
              Scan Activity Log
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search scans..." 
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 w-48 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Class</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todayLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                          {log.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-white">{log.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400">{log.class || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-tighter border border-cyan-500/20">
                        RFID Scan
                      </span>
                    </td>
                  </tr>
                ))}
                {todayLogs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <FileText size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-slate-500 text-sm">No scans recorded for the selected criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
