import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Logo } from '../../../shared/components/Logo';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gray-100">
            <Logo size={26} />
          </div>
          <div>
            <p className="text-lg font-medium leading-tight text-gray-900 tracking-tight">
              Folio
            </p>
            <p className="text-sm text-gray-400">folio.app</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gray-100" />

        {/* About */}
        <p className="mb-8 text-[0.9375rem] leading-relaxed text-gray-500">
          Track your job applications, score your resume fit with AI, and stay on top of every stage of your search.
        </p>

        {/* Sign in */}
        <GoogleSignInButton />

      </div>
    </main>
  );
}
