const ForbiddenPage = () => (
  <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">403</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Access denied</h1>
      <p className="mt-3 text-sm text-slate-500">You do not have permission to view this page.</p>
    </div>
  </div>
);

export default ForbiddenPage;
