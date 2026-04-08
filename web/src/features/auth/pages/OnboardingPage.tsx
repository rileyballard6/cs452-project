import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, Loader2, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/user.service';
import { Logo } from '../../../shared/components/Logo';

type Stage = 'idle' | 'uploading' | 'done';

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ headline?: string; skills?: number; experience?: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

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
            <p className="text-sm text-gray-400">Let's set up your profile</p>
          </div>
        </div>

        <p className="mb-6 text-[0.9375rem] leading-relaxed text-gray-500">
          Upload your resume and we'll automatically build your profile — pulling out your experience, skills, and role.
        </p>

        {/* Upload area */}
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
                  <span className="font-medium text-gray-700 truncate max-w-[200px]">{parsed.headline}</span>
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

        {/* Actions */}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {stage === 'uploading' ? (
              <><Loader2 size={15} className="animate-spin" /> Analyzing…</>
            ) : (
              <><Upload size={15} /> Upload resume</>
            )}
          </button>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        </div>

      </div>
    </main>
  );
}
