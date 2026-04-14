import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { HomePage } from './features/auth/pages/HomePage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { AboutPage } from './features/auth/pages/AboutPage';
import { OnboardingPage } from './features/auth/pages/OnboardingPage';
import { DashboardPage } from './features/applications/pages/DashboardPage';
import { ProfilePage } from './features/profile/pages/ProfilePage';
import { PublicProfilePage } from './features/profile/pages/PublicProfilePage';
import { ApplicationPage } from './features/applications/pages/ApplicationPage';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './shared/components/Toast';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/applications" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/applications/:id" element={<ProtectedRoute><ApplicationPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/u/:username" element={<PublicProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}
