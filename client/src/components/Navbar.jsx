import { Bell, Search, Menu, Calendar, Mail, Loader2 } from 'lucide-react';
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
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-30 w-full backdrop-blur-xl"
      style={{
        background: 'rgba(10, 14, 26, 0.7)',
        borderBottom: '1px solid var(--attendly-border)',
      }}
    >
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 rounded-lg" style={{ color: 'var(--attendly-text-muted)' }}>
          <Menu size={20} />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--attendly-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="text-sm pl-9 pr-4 py-2 w-52 rounded-xl border-none focus:outline-none"
            style={{
              background: 'var(--attendly-bg-elevated)',
              border: '1px solid var(--attendly-border)',
              color: 'var(--attendly-text-primary)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Force Date Block */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{
            background: 'var(--attendly-bg-elevated)',
            border: '1px solid var(--attendly-border)',
          }}
        >
          <Calendar size={14} style={{ color: '#818cf8' }} />
          <span className="text-xs font-medium whitespace-nowrap hidden sm:inline" style={{ color: 'var(--attendly-text-muted)' }}>
            Date:
          </span>
          <input 
            type="date"
            className="text-xs w-28 bg-transparent border-none focus:outline-none"
            style={{
              color: 'var(--attendly-text-secondary)',
              background: 'transparent',
              fontSize: '12px',
            }}
            value={forcedDate}
            onChange={(e) => setForcedDate(e.target.value)}
            title="Leave empty to use 'today'."
          />
          {forcedDate && (
            <button 
              className="text-xs font-semibold ml-1 hover:underline"
              style={{ color: 'var(--attendly-accent-error)' }}
              onClick={() => setForcedDate('')}
              title="Clear forced date"
            >
              ✕
            </button>
          )}
        </div>

        {/* Notify All Button */}
        <button 
          onClick={handleNotifyAll}
          disabled={sending}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          style={{
            background: 'var(--attendly-gradient-primary)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 25px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          <span>Notify All</span>
        </button>

        {/* Sync indicator */}
        <div
          className="text-xs hidden lg:flex items-center gap-2 pl-3 ml-1"
          style={{
            borderLeft: '1px solid var(--attendly-border)',
            color: 'var(--attendly-text-muted)',
          }}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Syncing…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--attendly-accent-success)' }} />
              {lastFetch ? lastFetch.toLocaleTimeString() : 'Never'}
            </span>
          )}
        </div>
        
        {/* Bell */}
        <button
          className="relative p-2 rounded-xl transition-colors"
          style={{ color: 'var(--attendly-text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--attendly-bg-elevated)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--attendly-accent-error)', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }}
          />
        </button>
      </div>
    </header>
  );
}
