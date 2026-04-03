import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';

export function ProfilePage() {
  const { user, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);
  const [resumeInitialized, setResumeInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed local state from user once loaded
  if (!isLoading && user) {
    if (!nameInitialized) {
      setName(user.displayName ?? '');
      setNameInitialized(true);
    }
    if (!resumeInitialized) {
      setResumeText(user.resumeText ?? '');
      setResumeInitialized(true);
    }
  }

  function handleSave() {
    // TODO: wire up to PATCH /api/profile
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = (name || user?.displayName || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-xl">

          {/* Avatar + identity */}
          <div className="mb-10 flex items-center gap-5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
                {initials}
              </div>
            )}

            <div className="flex-1">
              {/* Editable name */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-transparent text-base font-medium text-gray-900 outline-none placeholder:text-gray-300 focus:border-b focus:border-gray-200"
              />
              {/* Non-editable email */}
              <p className="mt-0.5 text-sm text-gray-400">{user?.email ?? '—'}</p>
            </div>
          </div>

          <div className="mb-3 border-t border-gray-100" />

          {/* Resume section */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Resume
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here. This is used to score job fit."
              rows={20}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-700 outline-none placeholder:text-gray-300"
            />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <button
              onClick={handleSave}
              className={`cursor-pointer rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors duration-300 hover:opacity-70 ${
                saved
                  ? 'border-green-200 bg-green-50 text-green-600'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {saved ? 'Saved ✓' : 'Save changes'}
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
