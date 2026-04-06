import { Bell, Search, Menu } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Navbar() {
  const { loading, lastFetch } = useData();

  return (
    <header className="h-16 bg-base-100 border-b border-base-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <button className="md:hidden btn btn-ghost btn-circle">
          <Menu size={20} />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="input input-sm bg-base-200 pl-10 w-64 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary/50" 
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-base-content/50 hidden sm:block">
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="loading loading-spinner loading-xs text-primary"></span>
               Syncing...
            </span>
          ) : (
            <span>Last sync: {lastFetch ? lastFetch.toLocaleTimeString() : 'Never'}</span>
          )}
        </div>
        
        <button className="btn btn-ghost btn-circle relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}
