const EmptyState = ({ message, icon }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
    {icon && <div className="mb-4 text-slate-400">{icon}</div>}
    <p className="text-base font-medium">{message || 'No data available.'}</p>
  </div>
);

export default EmptyState;
