import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, Loader2, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/user.service';
import { Logo } from '../../../shared/components/Logo';

type Stage = 'username' | 'idle' | 'uploading' | 'done';

function usernameValid(u: string) {
  return /^[a-z0-9_-]{3,20}$/.test(u);
}

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('username');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ headline?: string; skills?: number; experience?: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Username step state
  const [username, setUsername] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

  const checkUsername = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!usernameValid(val)) { setAvailable(null); setChecking(false); return; }
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await userService.checkUsername(val);
        setAvailable(available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 450);
  }, []);

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(val);
    setAvailable(null);
    checkUsername(val);
  }

  async function handleClaimUsername() {
    if (!usernameValid(username) || !available) return;
    setSavingUsername(true);
    try {
      await userService.updateMe({ username });
      setStage('idle');
    } catch {
      // stay on step
    } finally {
      setSavingUsername(false);
    }
  }

  async function handleFile(file: File) {
    if (!file || file.type !== 'application/pdf') return;
    setFileName(file.name);
    setStage('uploading');
    try {
      const result = await userService.uploadResume(file);
      const p = result.parsed as any;
      const skillsArr = p?.skills ?? [];
      const expArr = p?.workExperience ?? [];
      setParsed({
        headline: p?.headline ?? result.user.headline ?? undefined,
        skills: skillsArr.length,
        experience: expArr.length,
      });
      setStage('done');
    } catch {
      setStage('idle');
      setFileName(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleContinue() {
    await userService.completeOnboarding();
    navigate('/applications', { replace: true });
  }

  async function handleSkip() {
    await userService.completeOnboarding();
    navigate('/applications', { replace: true });
  }

  const canClaim = usernameValid(username) && available === true && !checking;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gray-100">
            <Logo size={26} />
          </div>
          <div>
            <p className="text-lg font-medium leading-tight text-gray-900 tracking-tight">Folio</p>
            <p className="text-sm text-gray-400">folio.app</p>
          </div>
        </div>

        <div className="mb-8 h-px bg-gray-100" />

        {/* Welcome */}
        <div className="mb-6 flex items-center gap-3">
          {user?.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.displayName ?? ''}
              className="h-9 w-9 rounded-full"
            />
          )}
          <div>
            <p className="text-[0.9375rem] font-medium text-gray-900">Hey, {firstName}</p>
            <p className="text-sm text-gray-400">
              {stage === 'username' ? 'Claim your handle' : "Let's set up your profile"}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${stage === 'username' ? 'bg-gray-900' : 'bg-gray-900'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${stage === 'username' ? 'bg-gray-100' : 'bg-gray-900'}`} />
        </div>

        {/* ── Step 1: Username ── */}
        {stage === 'username' && (
          <>
            <p className="mb-6 text-[0.9375rem] leading-relaxed text-gray-500">
              Pick your public handle. This is the URL you'll share for your portfolio.
            </p>

            <div className="mb-4">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-300">
                  folio.app/u/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="yourname"
                  maxLength={20}
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 py-3 pl-[5.75rem] pr-10 text-sm text-gray-800 outline-none transition-colors focus:border-gray-400 placeholder:text-gray-300"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
                  )}
                  {!checking && available === true && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(221,230,222)]">
                      <span className="h-2 w-2 rounded-full bg-[rgb(95,159,117)]" />
                    </span>
                  )}
                  {!checking && available === false && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(244,221,218)]">
                      <span className="h-2 w-2 rounded-full bg-[rgb(213,108,94)]" />
                    </span>
                  )}
                </div>
              </div>
              {username && !checking && available !== null && (
                <p className={`mt-1.5 text-xs ${available ? 'text-[rgb(95,159,117)]' : 'text-[rgb(213,108,94)]'}`}>
                  {available ? `folio.app/u/${username} is available` : 'That handle is already taken'}
                </p>
              )}
              {username && !usernameValid(username) && (
                <p className="mt-1.5 text-xs text-gray-400">3–20 chars, letters, numbers, _ and - only</p>
              )}
            </div>

            <button
              onClick={handleClaimUsername}
              disabled={!canClaim || savingUsername}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingUsername ? <Loader2 size={15} className="animate-spin" /> : <>Claim handle <ArrowRight size={15} /></>}
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={() => setStage('idle')}
                className="text-sm text-gray-400 transition-colors hover:text-gray-600"
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Resume ── */}
        {(stage === 'idle' || stage === 'uploading' || stage === 'done') && (
          <>
            <p className="mb-6 text-[0.9375rem] leading-relaxed text-gray-500">
              Upload your resume and we'll automatically build your profile — pulling out your experience, skills, and role.
            </p>

            {stage === 'idle' && (
              <div
                className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                  dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                  <Upload size={20} className="text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Drop your resume here</p>
                  <p className="mt-0.5 text-xs text-gray-400">or click to browse · PDF only</p>
                </div>
              </div>
            )}

            {stage === 'uploading' && (
              <div className="mb-4 flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-6 py-10">
                <Loader2 size={24} className="animate-spin text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Analyzing your resume</p>
                  {fileName && (
                    <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-gray-400">
                      <FileText size={11} /> {fileName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {stage === 'done' && parsed && (
              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 px-5 py-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <p className="text-sm font-medium text-gray-800">Profile built</p>
                </div>
                <div className="space-y-1.5">
                  {parsed.headline && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Role</span>
                      <span className="max-w-[200px] truncate font-medium text-gray-700">{parsed.headline}</span>
                    </div>
                  )}
                  {(parsed.experience ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Experience</span>
                      <span className="font-medium text-gray-700">{parsed.experience} position{parsed.experience === 1 ? '' : 's'}</span>
                    </div>
                  )}
                  {(parsed.skills ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Skills</span>
                      <span className="font-medium text-gray-700">{parsed.skills} found</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {stage === 'done' ? (
              <button
                onClick={handleContinue}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                Go to dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={stage === 'uploading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {stage === 'uploading' ? (
                  <><Loader2 size={15} className="animate-spin" /> Analyzing…</>
                ) : (
                  <><Upload size={15} /> Upload resume</>
                )}
              </button>
            )}

            {stage !== 'done' && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-400 transition-colors hover:text-gray-600"
                >
                  Skip for now
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
