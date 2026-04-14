import { useState, useRef } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { userService } from '../../../services/user.service';
import { useToast } from '../../../shared/components/Toast';

interface Props {
  initialHasResume: boolean;
  onUploadComplete: () => void;
}

export function ResumeRow({ initialHasResume, onUploadComplete }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(initialHasResume);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await userService.uploadResume(file);
      setHasResume(true);
      setUploadedFileName(file.name);
      onUploadComplete();
      toast('Resume uploaded — profile updated');
    } catch {
      toast('Failed to upload resume', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mb-10 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Resume</p>
        <p className="mt-0.5 text-xs text-gray-400">
          {uploadedFileName ?? (hasResume ? 'Resume on file — re-upload to refresh AI data' : 'Upload your PDF to auto-populate your profile')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {(uploadedFileName || hasResume) && <CheckCircle size={14} className="text-green-500" />}
        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-400 hover:opacity-70 disabled:opacity-40"
        >
          <Upload size={13} />
          {uploading ? 'Processing…' : hasResume ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
