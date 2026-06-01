import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/ToastContainer';
import Router from './routes';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
