import { useState, useRef } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/user.service';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';

export function ProfilePage() {
  const { user, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);
  const [resumeInitialized, setResumeInitialized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await userService.uploadResume(file);
      setResumeText(updated.resumeText ?? '');
      setUploadedFileName(file.name);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-uploaded if needed
      e.target.value = '';
    }
  }

  async function handleSave() {
    await userService.updateMe({ displayName: name, resumeText });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = (name || user?.displayName || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hasExistingResume = !!(user?.resumeText && !uploadedFileName);

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
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-transparent text-base font-medium text-gray-900 outline-none placeholder:text-gray-300 focus:border-b focus:border-gray-200"
              />
              <p className="mt-0.5 text-sm text-gray-400">{user?.email ?? '—'}</p>
            </div>
          </div>

          <div className="mb-3 border-t border-gray-100" />

          {/* Resume section */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Resume
            </p>

            {/* Upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploadedFileName || hasExistingResume ? (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  <span className="text-sm text-gray-600">
                    {uploadedFileName ?? 'Resume on file'}
                  </span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="cursor-pointer text-xs text-gray-400 hover:opacity-70 disabled:opacity-40"
                >
                  {uploading ? 'Processing…' : 'Replace'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-4 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-500 disabled:opacity-40"
              >
                <Upload size={14} />
                {uploading ? 'Processing…' : 'Upload PDF'}
              </button>
            )}

            {/* Editable extracted text */}
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Resume text will appear here after uploading. You can also paste it directly."
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
