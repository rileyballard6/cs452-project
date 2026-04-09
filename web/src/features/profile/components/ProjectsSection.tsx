import { useState, useEffect } from 'react';
import { Plus, Pencil, X, Globe, ExternalLink } from 'lucide-react';
import { userService } from '../../../services/user.service';
import type { Project } from '../../../types/portfolio.types';

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300';

interface ProjectForm {
  title: string; description: string; url: string; repoUrl: string;
}

export function ProjectsSection({ refreshKey }: { refreshKey: number }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>({ title: '', description: '', url: '', repoUrl: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userService.getProjects().then(setProjects).catch(() => {});
  }, [refreshKey]);

  function openModal(project?: Project) {
    setEditing(project ?? null);
    setForm(project ? {
      title: project.title ?? '', description: project.description ?? '',
      url: project.url ?? '', repoUrl: project.repo_url ?? '',
    } : { title: '', description: '', url: '', repoUrl: '' });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        title: form.title || null, description: form.description || null,
        url: form.url || null, repoUrl: form.repoUrl || null,
      };
      if (editing) {
        const updated = await userService.updateProject(editing.id, payload);
        setProjects(prev => prev.map(p => p.id === editing.id ? updated : p));
      } else {
        const created = await userService.createProject(payload);
        setProjects(prev => [...prev, created]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await userService.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Projects</p>
        <button onClick={() => openModal()} className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70">
          <Plus size={12} />Add
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-300">No projects added yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map(p => (
            <div key={p.id} className="rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => openModal(p)} className="cursor-pointer text-gray-300 hover:text-gray-500"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(p.id)} className="cursor-pointer text-gray-300 hover:text-red-400"><X size={12} /></button>
                </div>
              </div>
              {p.description && <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{p.description}</p>}
              <div className="mt-3 flex items-center gap-3">
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70"><Globe size={11} />Live</a>}
                {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:opacity-70"><ExternalLink size={11} />Repo</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{editing ? 'Edit project' : 'Add project'}</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer text-gray-300 hover:text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Project title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
              <input type="url" placeholder="Live URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className={inputClass} />
              <input type="url" placeholder="Repo URL" value={form.repoUrl} onChange={e => setForm(f => ({ ...f, repoUrl: e.target.value }))} className={inputClass} />
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
