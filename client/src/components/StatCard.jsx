export default function StatCard({ title, value, icon, colorClass, subtitle }) {
  return (
    <div className="bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider">{title}</h3>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-base-content/50 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
