export default function StatCard({ title, value, icon, color = '#6366f1', subtitle }) {

  return (
    <div
      className="glass-card p-6 group cursor-default animate-fade-in-up"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${color}18, 0 0 0 1px ${color}20`;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${color}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = '';
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
          style={{
            background: `${color}18`,
            color: color,
          }}
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
