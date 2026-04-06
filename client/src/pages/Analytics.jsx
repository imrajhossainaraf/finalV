import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
  const { attendance } = useData();

  if (!attendance?.length) return (
    <div className="flex h-[60vh] items-center justify-center text-base-content/50">
      Loading analytics data...
    </div>
  );

  // Peak Hours Analysis
  const hourlyDataMap = attendance.reduce((acc, curr) => {
    const hour = new Date(curr.timestamp).getHours();
    const label = `${hour}:00`;
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

  const COLORS = ['#667eea', '#764ba2', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-base-content/60 mt-1">Deep dive into check-in patterns and device utilization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <div className="bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Peak Check-in Hours</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#667eea', opacity: 0.1}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="count" fill="url(#colorCountBar)" radius={[6, 6, 0, 0]} barSize={40}>
                  <defs>
                    <linearGradient id="colorCountBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#667eea" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#764ba2" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Contribution Pie Chart */}
        <div className="bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Device Usage Distribution</h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
