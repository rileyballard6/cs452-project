import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PublicHeader } from '../../../shared/components/PublicHeader';
import { PublicFooter } from '../../../shared/components/PublicFooter';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export function LoginPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const claimedUsername = searchParams.get('username');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(user?.onboardingComplete ? '/applications' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-32">
        <div className="w-full max-w-sm">
          <p className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Sign in to Folio</p>
          <p className="mb-8 text-[0.9375rem] leading-relaxed text-gray-400">
            {claimedUsername
              ? <>folio.app/u/<span className="font-medium text-gray-600">{claimedUsername}</span> is waiting for you.</>
              : 'Track applications, score your resume, and share your portfolio.'}
          </p>

          <GoogleSignInButton />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
