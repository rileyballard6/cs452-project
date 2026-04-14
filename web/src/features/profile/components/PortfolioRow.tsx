import { useState, useEffect, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { userService } from '../../../services/user.service';
import { useToast } from '../../../shared/components/Toast';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${checked ? 'bg-gray-800' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

interface Props {
  initialUsername: string;
  initialPublic: boolean;
  savedUsername: string;
}

export function PortfolioRow({ initialUsername, initialPublic, savedUsername }: Props) {
  const { toast } = useToast();
  const [username, setUsername] = useState(initialUsername);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  useEffect(() => {
    if (!username) { setStatus('idle'); return; }
    if (username === savedUsername) { setStatus('available'); return; }
    setStatus('checking');
    const t = setTimeout(async () => {
      try {
        const { available } = await userService.checkUsername(username);
        setStatus(available ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [username, savedUsername]);

  const [toggleSaving, setToggleSaving] = useState(false);

  async function handleToggle(val: boolean) {
    setIsPublic(val);
    setToggleSaving(true);
    try {
      await userService.updateMe({ portfolioPublic: val } as any);
    } finally {
      setToggleSaving(false);
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await userService.updateMe({ username: username || null, portfolioPublic: isPublic } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast('Username saved');
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [username, isPublic, toast]);

  return (
    <div className="mb-10 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Portfolio</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs transition-colors ${isPublic ? 'text-gray-700' : 'text-gray-400'}`}>
              {toggleSaving ? 'Saving…' : isPublic ? 'Public' : 'Private'}
            </span>
            <Toggle checked={isPublic} onChange={handleToggle} />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || status === 'taken' || status === 'checking'}
            className="cursor-pointer text-xs text-gray-400 hover:opacity-70 disabled:opacity-30"
          >
            {saved ? <span className="text-green-500">Saved</span> : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-xs text-gray-400">/u/</span>
        <input
          type="text"
          value={username}
          onChange={e => { setSaved(false); setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); }}
          placeholder="username"
          className="w-32 rounded-md border border-gray-200 bg-white px-2 py-1 text-base text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300"
        />
        {status === 'checking' && <span className="text-xs text-gray-300">checking…</span>}
        {status === 'available' && <span className="text-xs text-green-500">available</span>}
        {status === 'taken' && <span className="text-xs text-red-400">taken</span>}
      </div>
      {isPublic && username && status !== 'taken' && (
        <a href={`/u/${username}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-gray-300 hover:opacity-70">
          <ExternalLink size={10} />View public profile
        </a>
      )}
    </div>
  );
}
