import { useState } from 'react';
import { X } from 'lucide-react';
import { userService } from '../../../services/user.service';

export function AccountSection() {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await userService.deleteAccount();
      window.location.href = '/';
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-10 mb-10">
      <p className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-400">Account</p>
      <button
        onClick={() => { setConfirmText(''); setShowModal(true); }}
        className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-400 hover:opacity-70"
      >
        Delete account
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">Delete account</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer text-gray-300 hover:text-gray-500"><X size={16} /></button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-500">
              This will permanently delete your account and all your data — applications, portfolio, resume, and analyses.{' '}
              <span className="font-medium text-gray-700">This cannot be undone.</span>
            </p>
            <p className="mb-2 text-xs text-gray-400">Type <span className="font-mono font-medium text-gray-600">DELETE</span> to confirm</p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-red-300 placeholder:text-gray-300"
            />
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:opacity-70">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex-1 cursor-pointer rounded-lg border border-red-500 bg-red-500 py-2 text-sm text-white hover:opacity-70 disabled:opacity-30"
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
