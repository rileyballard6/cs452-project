import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ArrowLeft, ExternalLink, Sparkles, StickyNote, FileText, Calendar, DollarSign, MapPin, Radio, Link2 } from 'lucide-react';
import { dummyApplications, dummyAiAnalyses } from '../data/dummy';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';
import type { ApplicationStatus, AiVerdict } from '../../../types/application.types';

const STATUS_OPTIONS: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];

const statusStyles: Record<ApplicationStatus, string> = {
  saved:     'bg-[rgb(240,239,237)] text-[rgb(55,53,50)]',
  applied:   'bg-[rgb(213,227,246)] text-[rgb(22,58,120)]',
  interview: 'bg-[rgb(240,228,198)] text-[rgb(100,72,15)]',
  offer:     'bg-[rgb(221,230,222)] text-[rgb(28,78,48)]',
  rejected:  'bg-[rgb(244,221,218)] text-[rgb(110,35,25)]',
};

const verdictStyles: Record<AiVerdict, string> = {
  'strong fit':   'bg-green-100 text-green-700',
  'moderate fit': 'bg-amber-100 text-amber-700',
  'long shot':    'bg-red-100 text-red-600',
};

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

export function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const app = dummyApplications.find((a) => a.id === id);
  const ai = dummyAiAnalyses.find((a) => a.applicationId === id) ?? null;

  const [status, setStatus] = useState(app?.status ?? 'saved');
  const [notes, setNotes] = useState(app?.notes ?? '');
  const [jobDescription, setJobDescription] = useState(app?.jobDescription ?? '');
  const [saved, setSaved] = useState(false);
  const [showOffer, setShowOffer] = useState(false);

  function handleStatusChange(newStatus: ApplicationStatus) {
    setStatus(newStatus);
    if (newStatus === 'offer') {
      setShowOffer(true);
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 } });
    }
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

  function handleSave() {
    // TODO: wire up to PATCH /api/applications/:id
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

          {/* Title + status */}
          <div className="mb-1 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-base font-medium text-gray-900">
                {app.roleTitle ?? 'Untitled Role'}
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">{app.companyName ?? '—'}</p>
            </div>

            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              className={`cursor-pointer rounded-full border-0 px-2 py-1 text-sm font-small outline-none ${statusStyles[status]}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-white text-gray-700 capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
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
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
                    Remote
                  </span>
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

            {ai ? (
              <div className="space-y-6">

                {/* Score + verdict */}
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-medium text-gray-900">{ai.fitScore ?? '—'}</span>
                    {ai.fitScore !== null && <span className="text-sm text-gray-400">/ 100</span>}
                  </div>
                  {ai.verdict && (
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${verdictStyles[ai.verdict]}`}>
                      {ai.verdict}
                    </span>
                  )}
                </div>

                {/* Strengths */}
                {ai.strengths && ai.strengths.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-400">Strengths</p>
                    <ul className="space-y-1">
                      {ai.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700">· {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing keywords */}
                {ai.missingKeywords && ai.missingKeywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-400">Missing keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ai.missingKeywords.map((kw: string) => (
                        <span key={kw} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {ai.suggestions && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-400">Suggestions</p>
                    <p className="text-sm leading-relaxed text-gray-700">{ai.suggestions}</p>
                  </div>
                )}

                {/* Cover letter */}
                {ai.coverLetter && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-400">Cover letter draft</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{ai.coverLetter}</p>
                  </div>
                )}

              </div>
            ) : (
              <p className="text-sm text-gray-300">
                Paste a job description above and save to generate an AI analysis.
              </p>
            )}
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
