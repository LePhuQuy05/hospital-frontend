import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">404</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-3 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
