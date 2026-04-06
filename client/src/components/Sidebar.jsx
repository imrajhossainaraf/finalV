import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Cpu, BarChart3, Database, Users } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Students', path: '/students', icon: <Users size={20} /> },
    { name: 'Attendance', path: '/attendance', icon: <ClipboardList size={20} /> },
    { name: 'Devices', path: '/devices', icon: <Cpu size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 h-screen hidden md:flex flex-col sticky top-0">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-base-200">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <Database size={24} />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Attendly</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-content font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-base-200">
        <div className="flex items-center gap-3 px-4 py-3 bg-base-200/50 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            AD
          </div>
          <div>
            <p className="text-sm font-medium leading-none">Admin User</p>
            <p className="text-xs text-base-content/60 mt-1">Superadmin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
