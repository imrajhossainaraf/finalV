import { useData } from '../context/DataContext';
import StatCard from '../components/StatCard';
import { Users, Cpu, CalendarCheck, ClipboardCheck, Clock, ArrowUpRight, PlayCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-4 py-3 rounded-xl shadow-2xl"
        style={{
          background: 'var(--attendly-bg-card)',
          border: '1px solid var(--attendly-border-focus)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--attendly-text-muted)' }}>{label}</p>
        <p className="text-lg font-bold" style={{ color: '#818cf8' }}>
          {payload[0].value} <span className="text-xs font-normal" style={{ color: 'var(--attendly-text-muted)' }}>scans</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { stats, attendance, devices, refetch } = useData();

  const handleSimulateScan = async () => {
    try {
      // Mock scan for 'John Doe' (A1B2C3D4) - Hits Render to test full pipeline
      await axios.post('/api/attendance', {
        mac: 'SIMULATOR-001',
        deviceName: 'Demo Simulator',
        uid: 'A1B2C3D4',
        timestamp: new Date().toISOString()
      });
      toast.success('Simulated scan for John Doe!');
      refetch();
    } catch (err) {
      toast.error('Simulation failed');
    }
  };

  if (!stats) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--attendly-accent-primary)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>Loading dashboard…</p>
      </div>
    </div>
  );

  // Process data for the chart - group attendance by day
  const dailyDataMap = attendance?.reduce((acc, curr) => {
    const date = new Date(curr.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(dailyDataMap || {})
    .reverse()
    .slice(0, 7)
    .map(date => ({
      date,
      count: dailyDataMap[date]
    }))
    .reverse();

  // Active devices count
  const activeDevices = devices?.filter(d => {
    if (!d.last_seen) return false;
    const diff = new Date() - new Date(d.last_seen);
    return diff < 5 * 60 * 1000;
  }).length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, var(--attendly-text-primary) 0%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Overview
            </h1>
            <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: 'var(--attendly-glow-primary)', color: '#818cf8' }}>
              Live
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>
            Real-time attendance metrics from your ESP32 devices.
          </p>
        </div>

        <button
          onClick={handleSimulateScan}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            background: 'rgba(129, 140, 248, 0.1)',
            color: '#818cf8',
            border: '1px solid rgba(129, 140, 248, 0.2)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.1)'; }}
        >
          <PlayCircle size={18} />
          Simulate Machine Scan
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Today's Attendance" 
          value={stats.todayAttendance || 0} 
          icon={<CalendarCheck size={22} />} 
          color="#6366f1"
          subtitle="Total scans today"
        />
        <StatCard 
          title="Total Registered" 
          value={stats.totalStudents || 0} 
          icon={<Users size={22} />} 
          color="#06b6d4"
          subtitle="Active students in system"
        />
        <StatCard 
          title="Total Scans" 
          value={stats.totalAttendance || 0} 
          icon={<ClipboardCheck size={22} />} 
          color="#10b981"
          subtitle="All time attendance logs"
        />
        <StatCard 
          title="Active Devices" 
          value={`${activeDevices}/${stats.totalDevices || 0}`} 
          icon={<Cpu size={22} />} 
          color="#f59e0b"
          subtitle="Devices online right now"
        />
      </div>

      {/* Chart and Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
                Attendance Trend
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--attendly-text-muted)' }}>Last 7 days overview</p>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{
                background: 'var(--attendly-glow-primary)',
                color: '#818cf8',
              }}
            >
              <ArrowUpRight size={12} />
              Weekly
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.length > 0 ? chartData : [{date:'Mon', count:2}, {date:'Tue', count:5}, {date:'Wed', count:3}]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99,102,241,0.08)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)"
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                  activeDot={{ 
                    fill: '#818cf8', 
                    stroke: 'rgba(99,102,241,0.3)', 
                    strokeWidth: 8, 
                    r: 6 
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="glass-card p-6 flex flex-col animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
              Latest Check-ins
            </h3>
            <Clock size={16} style={{ color: 'var(--attendly-text-muted)' }} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {attendance?.slice(0, 6).map((log, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group/item"
                style={{
                  background: 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-transform duration-200 group-hover/item:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  }}
                >
                  {log.student_name ? log.student_name.charAt(0) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--attendly-text-primary)' }}>
                    {log.student_name || 'Unknown'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--attendly-text-muted)' }}>
                    {log.device_name || log.device_mac}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold" style={{ color: '#818cf8' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))}
            {attendance?.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <CalendarCheck size={40} style={{ color: 'var(--attendly-text-muted)', opacity: 0.3 }} />
                <p className="text-sm mt-3" style={{ color: 'var(--attendly-text-muted)' }}>No recent scans today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
