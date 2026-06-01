const variantStyles = {
  success: 'bg-emerald-100 text-emerald-800',
  danger: 'bg-rose-100 text-rose-800',
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-sky-100 text-sky-800',
  default: 'bg-slate-100 text-slate-800',
};

const Badge = ({ variant = 'default', children }) => {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${variantStyles[variant]}`}>{children}</span>;
};

export default Badge;
