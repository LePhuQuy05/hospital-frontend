const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
          error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
        }`}
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
};

export default FormInput;
