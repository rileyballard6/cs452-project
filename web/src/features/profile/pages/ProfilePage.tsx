import { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, Plus, Pencil, X, ExternalLink, Globe, MapPin } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/user.service';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';
import type { WorkExperience, Skill, Project } from '../../../types/portfolio.types';

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300';
const CATEGORIES = ['language', 'framework', 'tool', 'other'] as const;

function formatDateRange(start: string | null, end: string | null, current: boolean) {
  if (!start && !end) return '—';
  const fmt = (d: string) => {
    const [y, m] = d.split('-');
    return m ? new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : y;
  };
  return `${start ? fmt(start) : '?'} – ${current ? 'Present' : end ? fmt(end) : '?'}`;
}

interface WorkForm {
  company: string; title: string; startDate: string; endDate: string; current: boolean; description: string;
}
interface ProjectForm {
  title: string; description: string; url: string; repoUrl: string;
}
interface IdentityForm {
  name: string; headline: string; bio: string; location: string;
  website: string; linkedinUrl: string; twitter: string;
  username: string; portfolioPublic: boolean;
}

export function ProfilePage() {
  const { user, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Displayed identity (read-only view)
  const [identity, setIdentity] = useState<IdentityForm>({
    name: '', headline: '', bio: '', location: '', website: '',
    linkedinUrl: '', twitter: '', username: '', portfolioPublic: false,
  });
  const [initialized, setInitialized] = useState(false);

  // Identity edit modal
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [identityForm, setIdentityForm] = useState<IdentityForm>({ ...identity });
  const [identitySaving, setIdentitySaving] = useState(false);

  // Resume
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Portfolio data
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Work modal
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkExperience | null>(null);
  const [workForm, setWorkForm] = useState<WorkForm>({ company: '', title: '', startDate: '', endDate: '', current: false, description: '' });
  const [workSaving, setWorkSaving] = useState(false);

  // Project modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>({ title: '', description: '', url: '', repoUrl: '' });
  const [projectSaving, setProjectSaving] = useState(false);

  // Skill add
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<string>('language');

  if (!isLoading && user && !initialized) {
    const id: IdentityForm = {
      name: user.displayName ?? '',
      headline: user.headline ?? '',
      bio: user.bio ?? '',
      location: user.location ?? '',
      website: user.website ?? '',
      linkedinUrl: user.linkedinUrl ?? '',
      twitter: user.twitter ?? '',
      username: user.username ?? '',
      portfolioPublic: user.portfolioPublic ?? false,
    };
    setIdentity(id);
    setHasResume(!!user.resumeText);
    setInitialized(true);
  }

  useEffect(() => {
    if (!user) return;
    Promise.all([
      userService.getWorkExperience(),
      userService.getSkills(),
      userService.getProjects(),
    ]).then(([we, sk, pr]) => {
      setWorkExperience(we);
      setSkills(sk);
      setProjects(pr);
    }).catch(() => {});
  }, [user?.id]);

  function openIdentityModal() {
    setIdentityForm({ ...identity });
    setShowIdentityModal(true);
  }

  async function handleIdentitySave() {
    setIdentitySaving(true);
    try {
      await userService.updateMe({
        displayName: identityForm.name,
        headline: identityForm.headline,
        bio: identityForm.bio,
        location: identityForm.location,
        website: identityForm.website,
        linkedinUrl: identityForm.linkedinUrl,
        twitter: identityForm.twitter,
        username: identityForm.username || null,
        portfolioPublic: identityForm.portfolioPublic,
      } as any);
      setIdentity({ ...identityForm });
      setShowIdentityModal(false);
    } finally {
      setIdentitySaving(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { parsed } = await userService.uploadResume(file);
      setHasResume(true);
      setUploadedFileName(file.name);
      const [we, sk, pr] = await Promise.all([
        userService.getWorkExperience(),
        userService.getSkills(),
        userService.getProjects(),
      ]);
      setWorkExperience(we);
      setSkills(sk);
      setProjects(pr);
      // Seed identity if fields are empty
      const p = parsed as any;
      setIdentity(prev => ({
        ...prev,
        headline: prev.headline || p?.headline || prev.headline,
        location: prev.location || p?.location || prev.location,
        linkedinUrl: prev.linkedinUrl || p?.linkedin || prev.linkedinUrl,
        website: prev.website || p?.website || prev.website,
      }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // ─── Work Experience ────────────────────────────────────────────────────────
  function openWorkModal(entry?: WorkExperience) {
    setEditingWork(entry ?? null);
    setWorkForm(entry ? {
      company: entry.company ?? '', title: entry.title ?? '',
      startDate: entry.start_date ?? '', endDate: entry.end_date ?? '',
      current: entry.current_role, description: entry.description ?? '',
    } : { company: '', title: '', startDate: '', endDate: '', current: false, description: '' });
    setShowWorkModal(true);
  }

  async function handleWorkSave() {
    setWorkSaving(true);
    try {
      const payload = {
        company: workForm.company || null, title: workForm.title || null,
        startDate: workForm.startDate || null,
        endDate: workForm.current ? null : workForm.endDate || null,
        current: workForm.current, description: workForm.description || null,
      };
      if (editingWork) {
        const updated = await userService.updateWorkExperience(editingWork.id, payload);
        setWorkExperience(prev => prev.map(w => w.id === editingWork.id ? updated : w));
      } else {
        const created = await userService.createWorkExperience(payload);
        setWorkExperience(prev => [...prev, created]);
      }
      setShowWorkModal(false);
    } finally {
      setWorkSaving(false);
    }
  }

  async function handleWorkDelete(id: string) {
    await userService.deleteWorkExperience(id);
    setWorkExperience(prev => prev.filter(w => w.id !== id));
  }

  // ─── Skills ─────────────────────────────────────────────────────────────────
  async function handleAddSkill() {
    if (!newSkillName.trim()) return;
    const created = await userService.createSkill({ name: newSkillName.trim(), category: newSkillCategory });
    setSkills(prev => [...prev, created]);
    setNewSkillName('');
  }

  async function handleDeleteSkill(id: string) {
    await userService.deleteSkill(id);
    setSkills(prev => prev.filter(s => s.id !== id));
  }

  // ─── Projects ────────────────────────────────────────────────────────────────
  function openProjectModal(project?: Project) {
    setEditingProject(project ?? null);
    setProjectForm(project ? {
      title: project.title ?? '', description: project.description ?? '',
      url: project.url ?? '', repoUrl: project.repo_url ?? '',
    } : { title: '', description: '', url: '', repoUrl: '' });
    setShowProjectModal(true);
  }

  async function handleProjectSave() {
    setProjectSaving(true);
    try {
      const payload = {
        title: projectForm.title || null, description: projectForm.description || null,
        url: projectForm.url || null, repoUrl: projectForm.repoUrl || null,
      };
      if (editingProject) {
        const updated = await userService.updateProject(editingProject.id, payload);
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updated : p));
      } else {
        const created = await userService.createProject(payload);
        setProjects(prev => [...prev, created]);
      }
      setShowProjectModal(false);
    } finally {
      setProjectSaving(false);
    }
  }

  async function handleProjectDelete(id: string) {
    await userService.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const initials = (identity.name || user?.displayName || '?')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const publicUrl = identity.username ? `/u/${identity.username}` : null;

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-2xl">

          {/* ─── Identity ─────────────────────────────────────────────────── */}
          <div className="mb-12 flex items-start justify-between gap-4">
            <div className="flex items-start gap-6">
              {user?.avatarUrl ? (
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
                {publicUrl && (
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-gray-300 hover:opacity-70">
                    <ExternalLink size={10} />View public profile
                  </a>
                )}
              </div>
            </div>
            <button onClick={openIdentityModal} className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70">
              <Pencil size={12} />Edit
            </button>
          </div>

          {identity.bio && <p className="mb-10 text-sm leading-relaxed text-gray-600">{identity.bio}</p>}

          {/* ─── Resume ───────────────────────────────────────────────────── */}
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

          <div className="border-t border-gray-100" />

          {/* ─── Work Experience ───────────────────────────────────────────── */}
          <section className="mt-10 mb-10">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Experience</p>
              <button onClick={() => openWorkModal()} className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                <Plus size={12} />Add
              </button>
            </div>

            {workExperience.length === 0 ? (
              <p className="text-sm text-gray-300">No experience added yet.</p>
            ) : (
              <div className="space-y-6">
                {workExperience.map(w => (
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
                          <button onClick={() => openWorkModal(w)} className="cursor-pointer text-gray-300 hover:text-gray-500"><Pencil size={12} /></button>
                          <button onClick={() => handleWorkDelete(w.id)} className="cursor-pointer text-gray-300 hover:text-red-400"><X size={12} /></button>
                        </div>
                      </div>
                      {w.description && <p className="mt-2 text-sm leading-relaxed text-gray-600">{w.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* ─── Skills ───────────────────────────────────────────────────── */}
          <section className="mt-10 mb-10">
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-400">Skills</p>

            {Object.keys(skillsByCategory).length === 0 && (
              <p className="mb-3 text-sm text-gray-300">No skills added yet.</p>
            )}

            <div className="space-y-3">
              {Object.entries(skillsByCategory).map(([cat, items]) => (
                <div key={cat} className="flex items-baseline gap-3">
                  <p className="w-20 shrink-0 text-xs capitalize text-gray-400">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map(s => (
                      <span key={s.id} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                        {s.name}
                        <button onClick={() => handleDeleteSkill(s.id)} className="cursor-pointer text-gray-300 hover:text-red-400"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add skill…"
                className="w-36 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300"
              />
              <select
                value={newSkillCategory}
                onChange={e => setNewSkillCategory(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 outline-none focus:border-gray-400"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <button onClick={handleAddSkill} className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70">
                <Plus size={12} />Add
              </button>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* ─── Projects ─────────────────────────────────────────────────── */}
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Projects</p>
              <button onClick={() => openProjectModal()} className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70">
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
                        <button onClick={() => openProjectModal(p)} className="cursor-pointer text-gray-300 hover:text-gray-500"><Pencil size={12} /></button>
                        <button onClick={() => handleProjectDelete(p.id)} className="cursor-pointer text-gray-300 hover:text-red-400"><X size={12} /></button>
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
          </section>

        </div>
      </main>

      <Footer />

      {/* ─── Identity Edit Modal ───────────────────────────────────────────── */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">Edit profile</h2>
              <button onClick={() => setShowIdentityModal(false)} className="cursor-pointer text-gray-300 hover:text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={identityForm.name} onChange={e => setIdentityForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Headline" value={identityForm.headline} onChange={e => setIdentityForm(f => ({ ...f, headline: e.target.value }))} className={inputClass} />
              <textarea placeholder="Bio" value={identityForm.bio} onChange={e => setIdentityForm(f => ({ ...f, bio: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
              <input type="text" placeholder="Location" value={identityForm.location} onChange={e => setIdentityForm(f => ({ ...f, location: e.target.value }))} className={inputClass} />
              <input type="url" placeholder="Website URL" value={identityForm.website} onChange={e => setIdentityForm(f => ({ ...f, website: e.target.value }))} className={inputClass} />
              <input type="url" placeholder="LinkedIn URL" value={identityForm.linkedinUrl} onChange={e => setIdentityForm(f => ({ ...f, linkedinUrl: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Twitter / X handle" value={identityForm.twitter} onChange={e => setIdentityForm(f => ({ ...f, twitter: e.target.value }))} className={inputClass} />
              <div className="border-t border-gray-100 pt-3">
                <input
                  type="text"
                  placeholder="username (for public URL)"
                  value={identityForm.username}
                  onChange={e => setIdentityForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  className={inputClass}
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={identityForm.portfolioPublic} onChange={e => setIdentityForm(f => ({ ...f, portfolioPublic: e.target.checked }))} className="accent-gray-700" />
                  Make portfolio public
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowIdentityModal(false)} className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:opacity-70">Cancel</button>
              <button onClick={handleIdentitySave} disabled={identitySaving} className="flex-1 cursor-pointer rounded-lg border border-gray-900 bg-gray-900 py-2 text-sm text-white hover:opacity-70 disabled:opacity-40">
                {identitySaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Work Experience Modal ─────────────────────────────────────────── */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{editingWork ? 'Edit experience' : 'Add experience'}</h2>
              <button onClick={() => setShowWorkModal(false)} className="cursor-pointer text-gray-300 hover:text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Company" value={workForm.company} onChange={e => setWorkForm(f => ({ ...f, company: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Title" value={workForm.title} onChange={e => setWorkForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-xs text-gray-400">Start</p>
                  <input type="month" value={workForm.startDate} onChange={e => setWorkForm(f => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-400" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400">End</p>
                  <input type="month" value={workForm.endDate} onChange={e => setWorkForm(f => ({ ...f, endDate: e.target.value }))} disabled={workForm.current} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-400 disabled:opacity-30" />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={workForm.current} onChange={e => setWorkForm(f => ({ ...f, current: e.target.checked }))} className="accent-gray-700" />
                Current role
              </label>
              <textarea placeholder="Description" value={workForm.description} onChange={e => setWorkForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowWorkModal(false)} className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:opacity-70">Cancel</button>
              <button onClick={handleWorkSave} disabled={workSaving} className="flex-1 cursor-pointer rounded-lg border border-gray-900 bg-gray-900 py-2 text-sm text-white hover:opacity-70 disabled:opacity-40">{workSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Project Modal ─────────────────────────────────────────────────── */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{editingProject ? 'Edit project' : 'Add project'}</h2>
              <button onClick={() => setShowProjectModal(false)} className="cursor-pointer text-gray-300 hover:text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Project title" value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
              <textarea placeholder="Description" value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
              <input type="url" placeholder="Live URL" value={projectForm.url} onChange={e => setProjectForm(f => ({ ...f, url: e.target.value }))} className={inputClass} />
              <input type="url" placeholder="Repo URL" value={projectForm.repoUrl} onChange={e => setProjectForm(f => ({ ...f, repoUrl: e.target.value }))} className={inputClass} />
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowProjectModal(false)} className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:opacity-70">Cancel</button>
              <button onClick={handleProjectSave} disabled={projectSaving} className="flex-1 cursor-pointer rounded-lg border border-gray-900 bg-gray-900 py-2 text-sm text-white hover:opacity-70 disabled:opacity-40">{projectSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
