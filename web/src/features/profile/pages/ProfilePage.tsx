import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { authService } from '../../../services/auth.service';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';
import { IdentityHeader } from '../components/IdentityHeader';
import { ResumeRow } from '../components/ResumeRow';
import { PortfolioRow } from '../components/PortfolioRow';
import { ExperienceSection } from '../components/ExperienceSection';
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

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-2xl">

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
          <SkillsSection refreshKey={refreshKey} />

          <div className="border-t border-gray-100" />
          <ProjectsSection refreshKey={refreshKey} />

          <div className="border-t border-gray-100" />
          <AccountSection />

        </div>
      </main>

      <Footer />
    </div>
  );
}
