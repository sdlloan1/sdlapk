import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import TrafficTracker from './components/TrafficTracker';
import ProtectedRoute from '@/components/ProtectedRoute';
import NeuAppLoader from '@/components/NeuAppLoader';
import { Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import DownloadApp from './pages/DownloadApp';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import PartnerPage from './pages/app/PartnerPage';
import AdminLogin from './pages/AdminLogin';
import AdminPage from './pages/AdminPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <NeuAppLoader label="Starting SDL..." />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to onboarding first, then login
      window.location.href = '/onboarding';
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/download" element={<DownloadApp />} />
      <Route path="/sdlsubr1250noida/login" element={<AdminLogin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/sdlsubr1250noida/login" replace />} />}>
        <Route path="/sdlsubr1250noida" element={<AdminPage />} />
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/onboarding" replace />} />}>
        <Route path="/" element={<Home />} />
        <Route path="/partner" element={<PartnerPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <TrafficTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App