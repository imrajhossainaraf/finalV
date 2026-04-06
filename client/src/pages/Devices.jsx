import { useData } from '../context/DataContext';
import { Wifi, WifiOff, Cpu, MapPin } from 'lucide-react';

export default function Devices() {
  const { devices } = useData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Device Monitor</h1>
        <p className="text-base-content/60 mt-1">Manage connected ESP32 RFID scanners.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices?.map((device) => {
          const lastSeenDate = new Date(device.last_seen);
          const isOnline = (new Date() - lastSeenDate) < 5 * 60 * 1000; // 5 minutes threshold

          return (
            <div key={device.mac} className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className={`absolute top-0 left-0 w-1 h-full ${isOnline ? 'bg-success' : 'bg-base-300'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isOnline ? 'bg-success/10 text-success' : 'bg-base-200 text-base-content/50'}`}>
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{device.name || 'Unnamed Device'}</h3>
                    <p className="font-mono text-xs text-base-content/50 bg-base-200 px-2 py-1 rounded inline-block mt-1">
                      {device.mac}
                    </p>
                  </div>
                </div>
                {isOnline ? (
                  <Wifi size={20} className="text-success" />
                ) : (
                  <WifiOff size={20} className="text-base-content/30" />
                )}
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <MapPin size={16} />
                  <span>{device.location || 'Location Not Set'}</span>
                </div>
                
                <div className="bg-base-200/50 p-3 rounded-xl flex justify-between items-center mt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Status</span>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-success' : 'bg-base-content/30'}`}></span>
                    </span>
                    <span className={`text-sm font-medium ${isOnline ? 'text-success' : 'text-base-content/50'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-center text-base-content/50 pt-2">
                  Last seen: {new Date(device.last_seen).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}

        {devices?.length === 0 && (
          <div className="col-span-full py-16 text-center text-base-content/50 bg-base-100 rounded-2xl border border-base-200 border-dashed">
            <Cpu size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-1">No Devices Found</h3>
            <p className="text-sm">Connect an ESP32 to the network to view it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
