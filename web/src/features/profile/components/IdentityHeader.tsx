import { useState, useEffect } from 'react';
import { Pencil, X, Globe, MapPin, ExternalLink } from 'lucide-react';
import { userService } from '../../../services/user.service';
import type { User } from '../../../types/auth.types';

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-base text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300';

interface IdentityForm {
  name: string; headline: string; bio: string; location: string;
  website: string; linkedinUrl: string; twitter: string;
}

function fromUser(user: User): IdentityForm {
  return {
    name: user.displayName ?? '',
    headline: user.headline ?? '',
    bio: user.bio ?? '',
    location: user.location ?? '',
    website: user.website ?? '',
    linkedinUrl: user.linkedinUrl ?? '',
    twitter: user.twitter ?? '',
  };
}

export function IdentityHeader({ user }: { user: User }) {
  const [identity, setIdentity] = useState<IdentityForm>(() => fromUser(user));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<IdentityForm>(identity);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIdentity(fromUser(user));
  }, [user]);

  async function handleSave() {
    setSaving(true);
    try {
      await userService.updateMe({
        displayName: form.name,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        website: form.website,
        linkedinUrl: form.linkedinUrl,
        twitter: form.twitter,
      } as any);
      setIdentity({ ...form });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  const initials = (identity.name || user.displayName || '?')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <div className="mb-12 flex items-start justify-between gap-4">
        <div className="flex items-start gap-6">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={identity.name} className="h-20 w-20 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-medium text-gray-500">
              {initials}
            </div>
          )}
          <div className="pt-1">
            <h1 className="text-xl font-medium text-gray-900">{identity.name || 'Your Name'}</h1>
            {identity.headline && <p className="mt-0.5 text-sm text-gray-500">{identity.headline}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {identity.location && (
                <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} />{identity.location}</span>
              )}
              {identity.website && (
                <a href={identity.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                  <Globe size={11} />{identity.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {identity.linkedinUrl && (
                <a href={identity.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                  <ExternalLink size={11} />LinkedIn
                </a>
              )}
              {identity.twitter && (
                <a
                  href={identity.twitter.startsWith('http') ? identity.twitter : `https://twitter.com/${identity.twitter.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70"
                >
                  <ExternalLink size={11} />Twitter
                </a>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => { setForm({ ...identity }); setShowModal(true); }}
          className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70"
        >
          <Pencil size={12} />Edit
        </button>
      </div>

      {identity.bio && <p className="mb-10 text-sm leading-relaxed text-gray-600">{identity.bio}</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">Edit profile</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer text-gray-300 hover:text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Headline" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} className={inputClass} />
              <textarea placeholder="Bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
              <input type="text" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputClass} />
              <input type="url" placeholder="Website URL" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className={inputClass} />
              <input type="url" placeholder="LinkedIn URL" value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Twitter / X handle" value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} className={inputClass} />
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:opacity-70">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 cursor-pointer rounded-lg border border-gray-900 bg-gray-900 py-2 text-sm text-white hover:opacity-70 disabled:opacity-40">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
