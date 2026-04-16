import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Cpu, BarChart3, Users, Zap, BookOpenCheck, Megaphone } from 'lucide-react';


export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Summary', path: '/summary', icon: <BarChart3 size={20} /> },
    { name: 'Students', path: '/students', icon: <Users size={20} /> },
    { name: 'Exams', path: '/exams', icon: <BookOpenCheck size={20} /> },
    { name: 'Attendance', path: '/attendance', icon: <ClipboardList size={20} /> },
    { name: 'Devices', path: '/devices', icon: <Cpu size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <Zap size={20} /> },
    { name: 'Notices', path: '/notices', icon: <Megaphone size={20} /> },
  ];


  return (
    <aside
      className="w-64 h-screen hidden md:flex flex-col sticky top-0 relative z-20"
      style={{
        background: 'linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(10,14,26,0.98) 100%)',
        borderRight: '1px solid var(--attendly-border)',
      }}
    >
      {/* Brand */}
      <div
        className="h-16 flex items-center gap-3 px-6"
        style={{ borderBottom: '1px solid var(--attendly-border)' }}
      >
        <div
          className="p-2 rounded-xl animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)',
            color: '#818cf8',
          }}
        >
          <Zap size={22} />
        </div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CNHHS
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                isActive ? '' : ''
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                    color: '#a5b4fc',
                    borderLeft: '3px solid #6366f1',
                    boxShadow: '0 0 20px rgba(99,102,241,0.1)',
                  }
                : {
                    color: 'var(--attendly-text-muted)',
                    borderLeft: '3px solid transparent',
                  }
            }
          >
            <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-4" style={{ borderTop: '1px solid var(--attendly-border)' }}>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(99,102,241,0.06)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            AD
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--attendly-text-primary)' }}>
              Admin User
            </p>
            <p className="text-xs" style={{ color: 'var(--attendly-text-muted)' }}>
              Superadmin
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
