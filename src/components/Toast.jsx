const Toast = ({ type = 'info', message }) => {
  const styles = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
  };

  return (
    <div className={`max-w-sm rounded-3xl px-4 py-3 text-white shadow-lg ${styles[type]}`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default Toast;
