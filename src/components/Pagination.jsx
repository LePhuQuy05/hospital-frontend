const Pagination = ({ page = 1, totalPages = 1, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2 rounded-3xl bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
