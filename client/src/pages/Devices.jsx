import { useData } from '../context/DataContext';
import { Wifi, WifiOff, Cpu, MapPin, Activity } from 'lucide-react';

export default function Devices() {
  const { devices } = useData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--attendly-text-primary) 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Device Monitor
          </h1>
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
            style={{ background: 'var(--attendly-glow-success)', color: '#34d399' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#34d399' }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#34d399' }} />
            </span>
            Live
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>
          Manage connected ESP32 RFID scanners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devices?.map((device, idx) => {
          const lastSeenDate = new Date(device.last_seen);
          const isOnline = (new Date() - lastSeenDate) < 5 * 60 * 1000;

          return (
            <div
              key={device.mac}
              className="glass-card p-6 relative overflow-hidden group animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isOnline
                  ? '0 8px 32px rgba(16,185,129,0.1), 0 0 0 1px rgba(16,185,129,0.15)'
                  : '0 8px 32px rgba(99,102,241,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.transform = '';
              }}
            >
              {/* Left accent bar */}
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-r-full"
                style={{
                  background: isOnline
                    ? 'linear-gradient(180deg, #10b981 0%, #06b6d4 100%)'
                    : 'rgba(100,116,139,0.3)',
                }}
              />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-xl transition-transform group-hover:scale-110"
                    style={{
                      background: isOnline
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))'
                        : 'var(--attendly-bg-elevated)',
                      color: isOnline ? '#34d399' : 'var(--attendly-text-muted)',
                    }}
                  >
                    <Cpu size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: 'var(--attendly-text-primary)' }}>
                      {device.name || 'Unnamed Device'}
                    </h3>
                    <p
                      className="font-mono text-xs px-2 py-0.5 rounded inline-block mt-1"
                      style={{ background: 'var(--attendly-bg-elevated)', color: 'var(--attendly-text-muted)' }}
                    >
                      {device.mac}
                    </p>
                  </div>
                </div>
                <div
                  className="p-1.5 rounded-lg"
                  style={{
                    background: isOnline ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: isOnline ? '#34d399' : 'var(--attendly-text-muted)',
                  }}
                >
                  {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                </div>
              </div>

              <div className="space-y-3 mt-5">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--attendly-text-secondary)' }}>
                  <MapPin size={14} />
                  <span>{device.location || 'Location Not Set'}</span>
                </div>
                
                {/* Status bar */}
                <div
                  className="p-3 rounded-xl flex justify-between items-center mt-4"
                  style={{
                    background: 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--attendly-text-muted)' }}>
                    Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {isOnline && (
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ background: '#34d399' }}
                        />
                      )}
                      <span
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{
                          background: isOnline ? '#34d399' : 'rgba(100,116,139,0.4)',
                          boxShadow: isOnline ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
                        }}
                      />
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: isOnline ? '#34d399' : 'var(--attendly-text-muted)' }}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-center pt-2" style={{ color: 'var(--attendly-text-muted)' }}>
                  Last seen: {new Date(device.last_seen).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}

        {devices?.length === 0 && (
          <div
            className="col-span-full py-16 text-center glass-card animate-fade-in-up"
            style={{ border: '1px dashed var(--attendly-border)' }}
          >
            <Cpu size={48} className="mx-auto mb-4" style={{ color: 'var(--attendly-text-muted)', opacity: 0.2 }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--attendly-text-secondary)' }}>
              No Devices Found
            </h3>
            <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>
              Connect an ESP32 to the network to view it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
