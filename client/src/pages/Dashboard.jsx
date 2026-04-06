import { useData } from '../context/DataContext';
import StatCard from '../components/StatCard';
import { Users, Cpu, CalendarCheck, ClipboardCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { stats, attendance, devices } = useData();

  if (!stats) return null;

  // Process data for the chart - group attendance by day
  const dailyDataMap = attendance?.reduce((acc, curr) => {
    const date = new Date(curr.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(dailyDataMap || {})
    .reverse()
    .slice(0, 7) // last 7 days
    .map(date => ({
      date,
      count: dailyDataMap[date]
    }))
    .reverse();

  // Active devices count (seen in last 5 minutes)
  const activeDevices = devices?.filter(d => {
    if (!d.last_seen) return false;
    const diff = new Date() - new Date(d.last_seen);
    return diff < 5 * 60 * 1000;
  }).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-base-content/60 mt-1">Real-time attendance metrics from your ESP32 devices.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Attendance" 
          value={stats.todayAttendance || 0} 
          icon={<CalendarCheck size={24} />} 
          colorClass="bg-primary/20 text-primary"
          subtitle="Total scans today"
        />
        <StatCard 
          title="Total Registered" 
          value={stats.totalStudents || 0} 
          icon={<Users size={24} />} 
          colorClass="bg-info/20 text-info"
          subtitle="Active students in system"
        />
        <StatCard 
          title="Total Scans" 
          value={stats.totalAttendance || 0} 
          icon={<ClipboardCheck size={24} />} 
          colorClass="bg-success/20 text-success"
          subtitle="All time attendance logs"
        />
        <StatCard 
          title="Active Devices" 
          value={`${activeDevices}/${stats.totalDevices || 0}`} 
          icon={<Cpu size={24} />} 
          colorClass="bg-warning/20 text-warning"
          subtitle="Devices online right now"
        />
      </div>

      {/* Chart and Recent List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Attendance Last 7 Days</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.length > 0 ? chartData : [{date:'Mon', count:2}, {date:'Tue', count:5}, {date:'Wed', count:3}]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{stroke: '#667eea', strokeWidth: 1, strokeDasharray: '3 3'}}
                />
                <Area type="monotone" dataKey="count" stroke="#667eea" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-4">Latest Check-ins</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {attendance?.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md">
                  {log.student_name ? log.student_name.charAt(0) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{log.student_name}</p>
                  <p className="text-xs text-base-content/60 truncate">{log.device_name || log.device_mac}</p>
                </div>
                <div className="text-xs font-medium text-base-content/70">
                  {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
            {attendance?.length === 0 && (
              <div className="text-center text-base-content/50 text-sm mt-10">
                No recent scans today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
