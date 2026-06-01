const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'primary' }) => {
  if (!isOpen) return null;

  const buttonStyle = confirmVariant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${buttonStyle}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
