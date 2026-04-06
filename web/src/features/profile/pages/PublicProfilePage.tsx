import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Globe, ExternalLink } from 'lucide-react';
import { userService } from '../../../services/user.service';
import type { PublicProfile, Skill } from '../../../types/portfolio.types';

function formatDateRange(start: string | null, end: string | null, current: boolean) {
  if (!start && !end) return '';
  const fmt = (d: string) => {
    const [y, m] = d.split('-');
    return m ? new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : y;
  };
  return `${start ? fmt(start) : '?'} – ${current ? 'Present' : end ? fmt(end) : '?'}`;
}

function groupSkills(skills: Skill[]) {
  return skills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    userService.getPublicProfile(username)
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-300">Loading…</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white gap-3">
        <p className="text-sm text-gray-400">This profile doesn't exist or isn't public.</p>
        <Link to="/" className="text-xs text-gray-300 hover:opacity-70">← Go home</Link>
      </div>
    );
  }

  const initials = (profile.displayName ?? '?')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const skillGroups = groupSkills(profile.skills);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-12 flex items-start gap-6">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName ?? ''} className="h-20 w-20 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-medium text-gray-500">
              {initials}
            </div>
          )}

          <div className="flex-1 pt-1">
            <h1 className="text-xl font-medium text-gray-900">{profile.displayName ?? username}</h1>
            {profile.headline && <p className="mt-0.5 text-sm text-gray-500">{profile.headline}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-4">
              {profile.location && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} />{profile.location}
                </span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                  <Globe size={11} />{profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                  <ExternalLink size={11} />LinkedIn
                </a>
              )}
              {profile.twitter && (
                <a
                  href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70"
                >
                  <ExternalLink size={11} />Twitter
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bio ────────────────────────────────────────────────────────── */}
        {profile.bio && (
          <>
            <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
            <div className="my-10 border-t border-gray-100" />
          </>
        )}

        {/* ─── Work Experience ─────────────────────────────────────────────── */}
        {profile.workExperience.length > 0 && (
          <section className="mb-10">
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-400">Experience</p>
            <div className="space-y-6">
              {profile.workExperience.map(w => (
                <div key={w.id} className="flex gap-5">
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <div className="mt-1 w-px flex-1 bg-gray-100" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{w.title}</p>
                        <p className="text-sm text-gray-500">{w.company}</p>
                      </div>
                      <p className="shrink-0 text-xs text-gray-400">{formatDateRange(w.start_date, w.end_date, w.current_role)}</p>
                    </div>
                    {w.description && <p className="mt-2 text-sm leading-relaxed text-gray-600">{w.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-gray-100" />
          </section>
        )}

        {/* ─── Skills ─────────────────────────────────────────────────────── */}
        {profile.skills.length > 0 && (
          <section className="mb-10">
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-400">Skills</p>
            <div className="space-y-3">
              {Object.entries(skillGroups).map(([cat, items]) => (
                <div key={cat} className="flex items-baseline gap-3">
                  <p className="w-20 shrink-0 text-xs capitalize text-gray-400">{cat}</p>
                  <p className="text-sm text-gray-700">{items.map(s => s.name).join(' · ')}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-gray-100" />
          </section>
        )}

        {/* ─── Projects ───────────────────────────────────────────────────── */}
        {profile.projects.length > 0 && (
          <section className="mb-10">
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-400">Projects</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.projects.map(p => (
                <div key={p.id} className="rounded-xl border border-gray-100 p-5">
                  <p className="text-sm font-medium text-gray-900">{p.title}</p>
                  {p.description && <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{p.description}</p>}
                  <div className="mt-3 flex items-center gap-3">
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                        <Globe size={11} />Live
                      </a>
                    )}
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                        <ExternalLink size={11} />Repo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-16 text-center text-xs text-gray-200">Built with Folio</p>
      </div>
    </div>
  );
}
