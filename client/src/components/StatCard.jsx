export default function StatCard({ title, value, icon, colorClass, subtitle }) {
  // Extract color from colorClass for glow effect
  const getGlowColor = () => {
    if (colorClass?.includes('primary') || colorClass?.includes('indigo')) return 'rgba(99,102,241,0.1)';
    if (colorClass?.includes('info') || colorClass?.includes('cyan')) return 'rgba(6,182,212,0.1)';
    if (colorClass?.includes('success') || colorClass?.includes('emerald')) return 'rgba(16,185,129,0.1)';
    if (colorClass?.includes('warning') || colorClass?.includes('amber')) return 'rgba(245,158,11,0.1)';
    return 'rgba(99,102,241,0.1)';
  };

  const getIconBg = () => {
    if (colorClass?.includes('primary') || colorClass?.includes('indigo')) return 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)';
    if (colorClass?.includes('info') || colorClass?.includes('cyan')) return 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(59,130,246,0.15) 100%)';
    if (colorClass?.includes('success') || colorClass?.includes('emerald')) return 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(52,211,153,0.15) 100%)';
    if (colorClass?.includes('warning') || colorClass?.includes('amber')) return 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.15) 100%)';
    return 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)';
  };

  const getIconColor = () => {
    if (colorClass?.includes('primary') || colorClass?.includes('indigo')) return '#818cf8';
    if (colorClass?.includes('info') || colorClass?.includes('cyan')) return '#22d3ee';
    if (colorClass?.includes('success') || colorClass?.includes('emerald')) return '#34d399';
    if (colorClass?.includes('warning') || colorClass?.includes('amber')) return '#fbbf24';
    return '#818cf8';
  };

  return (
    <div
      className="glass-card p-6 group cursor-default animate-fade-in-up"
      style={{
        '--glow': getGlowColor(),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${getGlowColor()}, 0 0 0 1px rgba(99,102,241,0.1)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      <div className="flex items-center justify-between pb-4">
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--attendly-text-muted)' }}
        >
          {title}
        </h3>
        <div
          className="p-3 rounded-xl transition-transform group-hover:scale-110"
          style={{ background: getIconBg(), color: getIconColor() }}
        >
          {icon}
        </div>
      </div>
      <div>
        <div
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--attendly-text-primary)' }}
        >
          {value}
        </div>
        {subtitle && (
          <p
            className="text-xs mt-2 font-medium"
            style={{ color: 'var(--attendly-text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
