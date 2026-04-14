import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { authService } from '../../../services/auth.service';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';
import { IdentityHeader } from '../components/IdentityHeader';
import { ResumeRow } from '../components/ResumeRow';
import { PortfolioRow } from '../components/PortfolioRow';
import { ExperienceSection } from '../components/ExperienceSection';
import { EducationSection } from '../components/EducationSection';
import { SkillsSection } from '../components/SkillsSection';
import { ProjectsSection } from '../components/ProjectsSection';
import { AccountSection } from '../components/AccountSection';

export function ProfilePage() {
  const { user: authUser, isLoading } = useAuth();
  const [user, setUser] = useState(authUser);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  async function handleUploadComplete() {
    setRefreshKey(k => k + 1);
    const updated = await authService.getMe();
    if (updated) setUser(updated);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          {isLoading || !user ? (
            <div className="animate-pulse space-y-8">
              {/* Identity skeleton */}
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 shrink-0 rounded-full bg-gray-100" />
                <div className="flex-1 pt-1 space-y-2">
                  <div className="h-4 w-40 rounded-full bg-gray-100" />
                  <div className="h-3 w-56 rounded-full bg-gray-100" />
                  <div className="h-3 w-32 rounded-full bg-gray-100" />
                </div>
              </div>
              {/* Row skeletons */}
              <div className="h-16 rounded-xl bg-gray-100" />
              <div className="h-16 rounded-xl bg-gray-100" />
              <div className="h-px bg-gray-100" />
              <div className="space-y-3">
                <div className="h-3 w-24 rounded-full bg-gray-100" />
                <div className="h-12 rounded-xl bg-gray-100" />
              </div>
            </div>
          ) : (
            <>
              <IdentityHeader user={user} />

              <ResumeRow
                initialHasResume={!!user.resumeText}
                onUploadComplete={handleUploadComplete}
              />

              <PortfolioRow
                initialUsername={user.username ?? ''}
                initialPublic={user.portfolioPublic ?? false}
                savedUsername={user.username ?? ''}
              />

              <div className="border-t border-gray-100" />
              <ExperienceSection refreshKey={refreshKey} />

              <div className="border-t border-gray-100" />
              <EducationSection refreshKey={refreshKey} />

              <div className="border-t border-gray-100" />
              <SkillsSection refreshKey={refreshKey} />

              <div className="border-t border-gray-100" />
              <ProjectsSection refreshKey={refreshKey} />

              <div className="border-t border-gray-100" />
              <AccountSection />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
