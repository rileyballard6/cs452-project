import { useState, useEffect } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import { userService } from '../../../services/user.service';
import type { WorkExperience } from '../../../types/portfolio.types';

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300';

interface WorkForm {
  company: string; title: string; startDate: string; endDate: string; current: boolean; description: string;
}

function formatDateRange(start: string | null, end: string | null, current: boolean) {
  if (!start && !end) return '—';
  const fmt = (d: string) => {
    const [y, m] = d.split('-');
    return m ? new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : y;
  };
  return `${start ? fmt(start) : '?'} – ${current ? 'Present' : end ? fmt(end) : '?'}`;
}

export function ExperienceSection({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<WorkExperience[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WorkExperience | null>(null);
  const [form, setForm] = useState<WorkForm>({ company: '', title: '', startDate: '', endDate: '', current: false, description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userService.getWorkExperience().then(setEntries).catch(() => {});
  }, [refreshKey]);

  function openModal(entry?: WorkExperience) {
    setEditing(entry ?? null);
    setForm(entry ? {
      company: entry.company ?? '', title: entry.title ?? '',
      startDate: entry.start_date ?? '', endDate: entry.end_date ?? '',
      current: entry.current_role, description: entry.description ?? '',
    } : { company: '', title: '', startDate: '', endDate: '', current: false, description: '' });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        company: form.company || null, title: form.title || null,
        startDate: form.startDate || null,
        endDate: form.current ? null : form.endDate || null,
        current: form.current, description: form.description || null,
      };
      if (editing) {
        const updated = await userService.updateWorkExperience(editing.id, payload);
        setEntries(prev => prev.map(w => w.id === editing.id ? updated : w));
      } else {
        const created = await userService.createWorkExperience(payload);
        setEntries(prev => [...prev, created]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await userService.deleteWorkExperience(id);
    setEntries(prev => prev.filter(w => w.id !== id));
  }

  return (
    <section className="mt-10 mb-10">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Experience</p>
        <button onClick={() => openModal()} className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70">
          <Plus size={12} />Add
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-300">No experience added yet.</p>
      ) : (
        <div className="space-y-6">
          {entries.map(w => (
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
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-xs text-gray-400">{formatDateRange(w.start_date, w.end_date, w.current_role)}</p>
                    <button onClick={() => openModal(w)} className="cursor-pointer text-gray-300 hover:text-gray-500"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(w.id)} className="cursor-pointer text-gray-300 hover:text-red-400"><X size={12} /></button>
                  </div>
                </div>
                {w.description && <p className="mt-2 text-sm leading-relaxed text-gray-600">{w.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{editing ? 'Edit experience' : 'Add experience'}</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer text-gray-300 hover:text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-xs text-gray-400">Start</p>
                  <input type="month" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-400" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400">End</p>
                  <input type="month" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} disabled={form.current} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-400 disabled:opacity-30" />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.checked }))} className="accent-gray-700" />
                Current role
              </label>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
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
    </section>
  );
}
