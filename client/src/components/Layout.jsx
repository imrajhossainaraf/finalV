import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div
      className="flex h-screen overflow-hidden font-sans"
      style={{
        background: `var(--attendly-bg-base)`,
        color: 'var(--attendly-text-primary)',
      }}
    >
      {/* Ambient background mesh gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'var(--attendly-gradient-mesh)' }}
      />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
