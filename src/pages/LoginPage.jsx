import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const LoginPage = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    setFieldErrors({ username: '', password: '' });

    const errors = {
      username: username.trim() ? '' : 'Username is required.',
      password: password.trim() ? '' : 'Password is required.',
    };

    if (errors.username || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white px-8 py-10 shadow-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Hospital Login</h1>
            <p className="text-sm text-slate-500">Sign in to access your hospital dashboard.</p>
          </div>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                fieldErrors.username ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
              }`}
              placeholder="admin"
            />
            {fieldErrors.username && <p className="mt-2 text-sm text-rose-600">{fieldErrors.username}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                fieldErrors.password ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
              }`}
              placeholder="Enter your password"
            />
            {fieldErrors.password && <p className="mt-2 text-sm text-rose-600">{fieldErrors.password}</p>}
          </div>
          {serverError && <p className="text-sm text-rose-600">{serverError}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
