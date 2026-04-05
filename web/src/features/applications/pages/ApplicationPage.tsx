import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ArrowLeft, ExternalLink, Sparkles, StickyNote, FileText, Calendar, DollarSign, MapPin, Radio, Link2, Pencil, X } from 'lucide-react';
import { applicationService } from '../../../services/application.service';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';
import type { Application, ApplicationStatus, ApplicationSource } from '../../../types/application.types';

const STATUS_OPTIONS: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];
const SOURCE_OPTIONS: ApplicationSource[] = ['linkedin', 'indeed', 'greenhouse', 'manual'];

const statusStyles: Record<ApplicationStatus, string> = {
  saved:     'bg-[rgb(240,239,237)] text-[rgb(55,53,50)]',
  applied:   'bg-[rgb(213,227,246)] text-[rgb(22,58,120)]',
  interview: 'bg-[rgb(240,228,198)] text-[rgb(100,72,15)]',
  offer:     'bg-[rgb(221,230,222)] text-[rgb(28,78,48)]',
  rejected:  'bg-[rgb(244,221,218)] text-[rgb(110,35,25)]',
};

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300';

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return '—';
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `up to ${fmt(max!)}`;
}

interface EditForm {
  roleTitle: string;
  companyName: string;
  dateApplied: string;
  salaryMin: string;
  salaryMax: string;
  location: string;
  remote: boolean;
  source: ApplicationSource | '';
  jobUrl: string;
}

export function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ApplicationStatus>('saved');
  const [notes, setNotes] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    roleTitle: '', companyName: '', dateApplied: '',
    salaryMin: '', salaryMax: '', location: '',
    remote: false, source: '', jobUrl: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    applicationService.getOne(id)
      .then((data) => {
        setApp(data);
        setStatus(data.status as ApplicationStatus);
        setNotes(data.notes ?? '');
        setJobDescription(data.jobDescription ?? '');
        setEditForm({
          roleTitle:   data.roleTitle ?? '',
          companyName: data.companyName ?? '',
          dateApplied: data.dateApplied ?? '',
          salaryMin:   data.salaryMin?.toString() ?? '',
          salaryMax:   data.salaryMax?.toString() ?? '',
          location:    data.location ?? '',
          remote:      data.remote,
          source:      data.source ?? '',
          jobUrl:      data.jobUrl ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: ApplicationStatus) {
    setStatus(newStatus);
    if (newStatus === 'offer') {
      setShowOffer(true);
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 } });
    }
    if (!app) return;
    await applicationService.update(app.id, { status: newStatus });
  }

  function openEdit() {
    // Re-seed form from current app state before opening
    if (!app) return;
    setEditForm({
      roleTitle:   app.roleTitle ?? '',
      companyName: app.companyName ?? '',
      dateApplied: app.dateApplied ?? '',
      salaryMin:   app.salaryMin?.toString() ?? '',
      salaryMax:   app.salaryMax?.toString() ?? '',
      location:    app.location ?? '',
      remote:      app.remote,
      source:      app.source ?? '',
      jobUrl:      app.jobUrl ?? '',
    });
    setShowEdit(true);
  }

  async function handleEditSave() {
    if (!app) return;
    setSaving(true);
    try {
      const updated = await applicationService.update(app.id, {
        roleTitle:   editForm.roleTitle || null,
        companyName: editForm.companyName || null,
        dateApplied: editForm.dateApplied || null,
        salaryMin:   editForm.salaryMin ? parseInt(editForm.salaryMin) : null,
        salaryMax:   editForm.salaryMax ? parseInt(editForm.salaryMax) : null,
        location:    editForm.location || null,
        remote:      editForm.remote,
        source:      (editForm.source as ApplicationSource) || null,
        jobUrl:      editForm.jobUrl || null,
      });
      setApp(updated);
      setShowEdit(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!app) return;
    await applicationService.update(app.id, { status, notes, jobDescription });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-300">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-400">Application not found.</p>
            <Link to="/applications" className="mt-3 inline-block text-sm text-gray-500 hover:opacity-70">
              ← Back to applications
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-xl">

          {/* Back */}
          <button
            onClick={() => navigate('/applications')}
            className="mb-8 flex cursor-pointer items-center gap-1.5 text-sm text-gray-400 hover:opacity-70"
          >
            <ArrowLeft size={14} />
            Applications
          </button>

          {/* Title + status + edit */}
          <div className="mb-1 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-base font-medium text-gray-900">
                {app.roleTitle ?? 'Untitled Role'}
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">{app.companyName ?? '—'}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openEdit}
                className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70 transition-opacity"
              >
                <Pencil size={12} />
                Edit
              </button>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                className={`cursor-pointer rounded-full border-0 px-2 py-1 text-sm outline-none ${statusStyles[status]}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-white text-gray-700 capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100" />

          {/* Metadata grid */}
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                <Calendar size={12} />Applied
              </dt>
              <dd className="mt-1 text-sm text-gray-700">{formatDate(app.dateApplied)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                <DollarSign size={12} />Salary
              </dt>
              <dd className="mt-1 text-sm text-gray-700">{formatSalary(app.salaryMin, app.salaryMax)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                <MapPin size={12} />Location
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
                {app.location ?? '—'}
                {app.remote && (
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">Remote</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                <Radio size={12} />Source
              </dt>
              <dd className="mt-1 text-sm capitalize text-gray-700">{app.source ?? '—'}</dd>
            </div>
            {app.jobUrl && (
              <div className="col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                  <Link2 size={12} />Job posting
                </dt>
                <dd className="mt-1">
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:opacity-70"
                  >
                    {app.jobUrl}
                    <ExternalLink size={12} />
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-8 border-t border-gray-100" />

          {/* AI Overview */}
          <div className="mt-8">
            <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-purple-400">
              <Sparkles size={12} />AI Overview
            </p>
            <p className="text-sm text-gray-300">
              Paste a job description below and save to generate an AI analysis.
            </p>
          </div>

          <div className="mt-8 border-t border-gray-100" />

          {/* Notes */}
          <div className="mt-8">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
              <StickyNote size={12} />Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this application…"
              rows={4}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-700 outline-none placeholder:text-gray-300"
            />
          </div>

          <div className="mt-4 border-t border-gray-100" />

          {/* Job description */}
          <div className="mt-8">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
              <FileText size={12} />Job description
            </p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to enable AI scoring…"
              rows={12}
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

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">Edit details</h2>
              <button onClick={() => setShowEdit(false)} className="cursor-pointer text-gray-300 hover:text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Role title"
                value={editForm.roleTitle}
                onChange={(e) => setEditForm((f) => ({ ...f, roleTitle: e.target.value }))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Company"
                value={editForm.companyName}
                onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
                className={inputClass}
              />
              <input
                type="date"
                value={editForm.dateApplied}
                onChange={(e) => setEditForm((f) => ({ ...f, dateApplied: e.target.value }))}
                className={inputClass}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Salary min"
                  value={editForm.salaryMin}
                  onChange={(e) => setEditForm((f) => ({ ...f, salaryMin: e.target.value }))}
                  className={inputClass}
                />
                <input
                  type="number"
                  placeholder="Salary max"
                  value={editForm.salaryMax}
                  onChange={(e) => setEditForm((f) => ({ ...f, salaryMax: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <input
                type="text"
                placeholder="Location"
                value={editForm.location}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                className={inputClass}
              />
              <input
                type="url"
                placeholder="Job URL"
                value={editForm.jobUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, jobUrl: e.target.value }))}
                className={inputClass}
              />
              <div className="flex items-center justify-between">
                <select
                  value={editForm.source}
                  onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value as ApplicationSource }))}
                  className={inputClass}
                >
                  <option value="">Source</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
                <label className="ml-4 flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={editForm.remote}
                    onChange={(e) => setEditForm((f) => ({ ...f, remote: e.target.checked }))}
                    className="accent-gray-600"
                  />
                  Remote
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex-1 cursor-pointer rounded-lg border border-gray-900 bg-gray-900 py-2 text-sm text-white hover:opacity-70 disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer congrats modal */}
      {showOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="mb-2 text-3xl">🎉</p>
            <h2 className="mb-2 text-base font-medium text-gray-900">You got an offer!</h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Hurray! Looks like all the prep paid off. Take a moment to celebrate before you negotiate.
            </p>
            <button
              onClick={() => setShowOffer(false)}
              className="cursor-pointer rounded-lg border border-gray-200 px-5 py-1.5 text-sm text-gray-600 hover:opacity-70"
            >
              Thanks!
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
