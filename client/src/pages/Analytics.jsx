import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Clock, Activity } from 'lucide-react';

function ChartTooltip({ active, payload, label }) {
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
        {payload.map((entry, i) => (
          <p key={i} className="text-lg font-bold" style={{ color: entry.color || '#818cf8' }}>
            {entry.value} <span className="text-xs font-normal" style={{ color: 'var(--attendly-text-muted)' }}>scans</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function PieTooltip({ active, payload }) {
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
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--attendly-text-muted)' }}>{payload[0].name}</p>
        <p className="text-lg font-bold" style={{ color: payload[0].payload.fill }}>
          {payload[0].value} <span className="text-xs font-normal" style={{ color: 'var(--attendly-text-muted)' }}>scans</span>
        </p>
      </div>
    );
  }
  return null;
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: entry.color, boxShadow: `0 0 8px ${entry.color}40` }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--attendly-text-secondary)' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { attendance } = useData();

  if (!attendance?.length) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--attendly-accent-primary)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>Loading analytics data…</p>
      </div>
    </div>
  );

  // Peak Hours Analysis
  const hourlyDataMap = attendance.reduce((acc, curr) => {
    const hour = new Date(curr.timestamp).getHours();
    const label = `${hour.toString().padStart(2, '0')}:00`;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const peakHoursData = Object.keys(hourlyDataMap)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(time => ({ time, count: hourlyDataMap[time] }));

  // Device Usage Distribution
  const deviceMap = attendance.reduce((acc, curr) => {
    const dev = curr.device_name || curr.device_mac;
    acc[dev] = (acc[dev] || 0) + 1;
    return acc;
  }, {});
  
  const deviceData = Object.keys(deviceMap).map(name => ({
    name,
    value: deviceMap[name]
  }));

  // Quick stats
  const totalScans = attendance.length;
  const uniqueStudents = new Set(attendance.map(a => a.uid)).size;
  const peakHour = peakHoursData.reduce((max, curr) => curr.count > max.count ? curr : max, { count: 0 });
  const avgScansPerStudent = uniqueStudents > 0 ? (totalScans / uniqueStudents).toFixed(1) : 0;

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--attendly-text-primary) 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Analytics
          </h1>
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
          >
            Insights
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>
          Deep dive into check-in patterns and device utilization.
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        {[
          { label: 'Total Scans', value: totalScans, icon: <Activity size={16} />, color: '#6366f1' },
          { label: 'Unique Students', value: uniqueStudents, icon: <TrendingUp size={16} />, color: '#06b6d4' },
          { label: 'Peak Hour', value: peakHour.time || '-', icon: <Clock size={16} />, color: '#10b981' },
          { label: 'Avg Scans/Student', value: avgScansPerStudent, icon: <PieChartIcon size={16} />, color: '#f59e0b' },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card p-4 flex items-center gap-3 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${stat.color}40`;
              e.currentTarget.style.boxShadow = `0 4px 20px ${stat.color}15`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.transform = '';
            }}
          >
            <div
              className="p-2.5 rounded-xl transition-transform group-hover:scale-110"
              style={{
                background: `${stat.color}15`,
                color: stat.color,
              }}
            >
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
                {stat.value}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--attendly-text-muted)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <div className="glass-card p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
                Peak Check-in Hours
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--attendly-text-muted)' }}>
                Hourly distribution of attendance scans
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{ background: 'var(--attendly-glow-primary)', color: '#818cf8' }}
            >
              <Clock size={12} />
              Hourly
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCountBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99,102,241,0.08)" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }} />
                <Bar
                  dataKey="count"
                  fill="url(#colorCountBar)"
                  radius={[8, 8, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Usage Pie Chart */}
        <div className="glass-card p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
                Device Usage Distribution
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--attendly-text-muted)' }}>
                Share of scans per connected device
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}
            >
              <PieChartIcon size={12} />
              Devices
            </div>
          </div>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="rgba(10,14,26,0.6)"
                  strokeWidth={2}
                >
                  {deviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      style={{ filter: `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]}40)` }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attendance by Day of Week */}
      <div className="glass-card p-6 animate-fade-in-up stagger-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
              Weekly Pattern
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--attendly-text-muted)' }}>
              Attendance distribution across days of the week
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            style={{ background: 'var(--attendly-glow-info)', color: '#22d3ee' }}
          >
            <TrendingUp size={12} />
            Weekly
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {(() => {
            const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
            const dayCounts = attendance.reduce((acc, curr) => {
              const day = new Date(curr.timestamp).getDay();
              acc[day] = (acc[day] || 0) + 1;
              return acc;
            }, {});
            const maxCount = Math.max(...Object.values(dayCounts), 1);

            return Object.entries(dayMap).map(([dayNum, dayName]) => {
              const count = dayCounts[dayNum] || 0;
              const intensity = count / maxCount;
              return (
                <div
                  key={dayNum}
                  className="glass-card p-4 text-center group"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--attendly-text-muted)' }}>
                    {dayName}
                  </div>
                  <div
                    className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-2 transition-transform group-hover:scale-110"
                    style={{
                      background: `rgba(99,102,241,${0.08 + intensity * 0.35})`,
                      color: intensity > 0.5 ? '#a5b4fc' : '#64748b',
                      boxShadow: intensity > 0.5 ? '0 0 15px rgba(99,102,241,0.2)' : 'none',
                    }}
                  >
                    {count}
                  </div>
                  <div
                    className="w-full rounded-full h-1.5 mt-2 overflow-hidden"
                    style={{ background: 'var(--attendly-bg-elevated)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${intensity * 100}%`,
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 0 8px rgba(99,102,241,0.4)',
                      }}
                    />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
