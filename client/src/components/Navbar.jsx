import { Bell, Search, Menu, Calendar, Mail } from 'lucide-react';
import { useData } from '../context/DataContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useState } from 'react';

export default function Navbar() {
  const { loading, lastFetch, forcedDate, setForcedDate } = useData();
  const [sending, setSending] = useState(false);

  const handleNotifyAll = async () => {
    const notifyDate = forcedDate || new Date().toISOString().split('T')[0];
    if (!confirm(`Are you sure you want to send attendance notices to all students for ${notifyDate}?`)) {
      return;
    }
    
    setSending(true);
    const notificationPromise = axios.post('/api/notify-all', { date: notifyDate });
    
    toast.promise(notificationPromise, {
      pending: 'Sending emails to all students...',
      success: 'Notices sent successfully!',
      error: 'Failed to send notices.'
    });

    try {
      const response = await notificationPromise;
      if(response.data.stats) {
         toast.info(`Sent: ${response.data.stats.sent}, Failed: ${response.data.stats.failed}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

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
            className="input input-sm bg-base-200 pl-10 w-48 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary/50" 
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Force Date Block */}
        <div className="flex items-center gap-2 bg-base-200 px-3 py-1 rounded-lg">
          <Calendar size={16} className="text-primary"/>
          <span className="text-xs font-semibold whitespace-nowrap hidden sm:inline">Show Date:</span>
          <input 
            type="date"
            className="input input-xs border-none bg-transparent focus:outline-none text-xs w-28"
            value={forcedDate}
            onChange={(e) => setForcedDate(e.target.value)}
            title="Leave empty to use 'today'."
          />
          {forcedDate && (
            <button 
              className="text-xs text-error font-bold ml-1 hover:underline"
              onClick={() => setForcedDate('')}
              title="Clear forced date"
            >
              Clear
            </button>
          )}
        </div>

        {/* Notify All Button */}
        <button 
          onClick={handleNotifyAll}
          disabled={sending}
          className="btn btn-sm btn-primary ml-2 rounded-full hidden sm:flex shadow-md"
        >
          {sending ? <span className="loading loading-spinner loading-xs"></span> : <Mail size={14} />}
          <span>Notify All</span>
        </button>

        <div className="text-xs text-base-content/50 hidden lg:block border-l pl-4 border-base-300 ml-2">
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
