const LoadingState = () => (
  <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
    <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 shadow-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      <span className="text-sm font-medium text-slate-600">Loading...</span>
    </div>
  </div>
);

export default LoadingState;
