// Notices Page for CNHHS Smart School System
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Megaphone, 
  Trash2, 
  Send, 
  Plus,
  Bell,
  Calendar,
  Tag,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';

const CATEGORIES = [
  { id: 'General', icon: Info, color: 'blue' },
  { id: 'Urgent', icon: AlertCircle, color: 'red' },
  { id: 'Event', icon: Sparkles, color: 'purple' },
  { id: 'Holiday', icon: Calendar, color: 'amber' },
  { id: 'Exam', icon: Calendar, color: 'emerald' },
];

export default function Notices() {
  const { notices, addNotice, broadcastNotice, loading, refetch } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    content: ''
  });
  const [sendingId, setSendingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addNotice(formData);
      setFormData({ title: '', category: 'General', content: '' });
      setIsAdding(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async (id) => {
    setSendingId(id);
    try {
      await broadcastNotice(id);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Official Notices
          </h1>
          <p className="text-gray-400 mt-1 font-medium">Manage and broadcast school communications</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--attendly-primary)] hover:bg-[var(--attendly-primary-hover)] text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-[var(--attendly-primary)]/20 active:scale-95 group"
        >
          <Plus className={`w-5 h-5 transition-transform duration-300 ${isAdding ? 'rotate-45' : ''}`} />
          {isAdding ? 'Cancel' : 'Create Notice'}
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 rounded-[2rem] bg-[var(--attendly-bg-card)] border border-[var(--attendly-border)] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Megaphone className="w-16 h-16 text-[var(--attendly-primary)]" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Total Notices</p>
            <h3 className="text-4xl font-black mt-2">{notices.length}</h3>
         </div>
         <div className="p-6 rounded-[2rem] bg-[var(--attendly-bg-card)] border border-[var(--attendly-border)] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Send className="w-16 h-16 text-emerald-500" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Broadcasted</p>
            <h3 className="text-4xl font-black mt-2">{notices.filter(n => n.sentAt).length}</h3>
         </div>
         <div className="p-6 rounded-[2rem] bg-[var(--attendly-bg-card)] border border-[var(--attendly-border)] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Calendar className="w-16 h-16 text-blue-500" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Active Today</p>
            <h3 className="text-4xl font-black mt-2">
              {notices.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length}
            </h3>
         </div>
      </div>

      {/* Add Notice Form */}
      {isAdding && (
        <div className="overflow-hidden transition-all duration-500">
          <form onSubmit={handleSubmit} className="p-8 rounded-[2rem] bg-[var(--attendly-bg-card)] border border-[var(--attendly-primary)] shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Fair Postponement"
                  className="w-full bg-[#1e1e2e]/50 border border-[var(--attendly-border)] p-4 rounded-2xl focus:outline-none focus:border-[var(--attendly-primary)] transition-all font-medium placeholder:text-gray-600"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Category</label>
                <select
                  className="w-full bg-[#1e1e2e]/50 border border-[var(--attendly-border)] p-4 rounded-2xl focus:outline-none focus:border-[var(--attendly-primary)] transition-all font-medium appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.id}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Content</label>
              <textarea
                required
                rows="4"
                placeholder="Write the details of the notice here..."
                className="w-full bg-[#1e1e2e]/50 border border-[var(--attendly-border)] p-4 rounded-2xl focus:outline-none focus:border-[var(--attendly-primary)] transition-all font-medium placeholder:text-gray-600 resize-none"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              ></textarea>
            </div>
            <div className="flex justify-end gap-3">
               <button
                 type="button"
                 onClick={() => setIsAdding(false)}
                 className="px-6 py-3 rounded-2xl border border-[var(--attendly-border)] font-bold hover:bg-white/5 transition-all active:scale-95"
               >
                 Discard
               </button>
               <button
                 type="submit"
                 className="px-8 py-3 bg-[var(--attendly-primary)] text-white font-bold rounded-2xl hover:bg-[var(--attendly-primary-hover)] transition-all shadow-lg active:scale-95"
               >
                 Save Notice
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices List */}
      <div className="grid grid-cols-1 gap-6">
        {notices.length === 0 ? (
          <div className="text-center py-20 bg-[var(--attendly-bg-card)] rounded-[2.5rem] border border-dashed border-[var(--attendly-border)]">
             <Bell className="w-16 h-16 text-gray-600 mx-auto opacity-20" />
             <p className="text-gray-500 font-bold mt-4">No notices created yet.</p>
          </div>
        ) : (
          notices.map((notice) => {
            const catInfo = CATEGORIES.find(c => c.id === notice.category) || CATEGORIES[0];
            const Icon = catInfo.icon;
            
            // Map colors to hex for dynamic styles if needed, but we'll use Tailwind-like classes or inline styles
            const colors = {
              blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
              red: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
              purple: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.2)' },
              amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
              emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(10, 185, 129, 0.2)' },
            }[catInfo.color];

            return (
              <div
                key={notice._id}
                className="group relative p-8 rounded-[2.5rem] bg-[var(--attendly-bg-card)] border border-[var(--attendly-border)] hover:border-[var(--attendly-primary)]/50 transition-all shadow-xl hover:shadow-[var(--attendly-primary)]/5 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
                  <div className="p-4 rounded-3xl" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                    <Icon className="w-8 h-8" style={{ color: colors.text }} />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter" style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                            {notice.category}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black group-hover:text-[var(--attendly-primary)] transition-colors line-clamp-1">
                          {notice.title}
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {notice.sentAt && (
                           <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-xs font-black uppercase tracking-widest">Broadcasted</span>
                           </div>
                         )}
                         <button
                           disabled={sendingId === notice._id}
                           onClick={() => handleBroadcast(notice._id)}
                           className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                             notice.sentAt 
                             ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                             : 'bg-white text-black hover:bg-gray-200 shadow-lg'
                           } active:scale-95 disabled:opacity-50`}
                         >
                           {sendingId === notice._id ? (
                             <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                           ) : <Send className="w-4 h-4" />}
                           {notice.sentAt ? 'Resend to Parents' : 'Broadcast to Parents'}
                         </button>
                      </div>
                    </div>

                    <p className="text-gray-400 leading-relaxed font-medium whitespace-pre-wrap">
                      {notice.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
