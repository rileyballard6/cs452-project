import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  SlidersHorizontal, Building2, Briefcase, Tag,
  Calendar, DollarSign, MapPin, Radio, Plus, X,
} from 'lucide-react';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';
import { StatusBadge } from '../components/StatusBadge';
import { applicationService } from '../../../services/application.service';
import type { Application, ApplicationStatus, ApplicationSource } from '../../../types/application.types';

type SortKey = 'companyName' | 'roleTitle' | 'status' | 'dateApplied' | 'salaryMin' | 'location' | 'source';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];
const ALL_STATUSES: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];
const ALL_SOURCES: ApplicationSource[] = ['linkedin', 'indeed', 'greenhouse', 'manual'];

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

function sortApps(apps: Application[], key: SortKey, dir: SortDir): Application[] {
  return [...apps].sort((a, b) => {
    let av: string | number | null;
    let bv: string | number | null;

    if (key === 'status') {
      av = STATUS_ORDER.indexOf(a.status);
      bv = STATUS_ORDER.indexOf(b.status);
    } else if (key === 'salaryMin') {
      av = a.salaryMin ?? -1;
      bv = b.salaryMin ?? -1;
    } else if (key === 'dateApplied') {
      av = a.dateApplied ?? '';
      bv = b.dateApplied ?? '';
    } else {
      av = (a[key] ?? '').toString().toLowerCase();
      bv = (b[key] ?? '').toString().toLowerCase();
    }

    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="opacity-30" />;
  return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
}

const COLUMNS: { key: SortKey; label: string; icon: ReactNode }[] = [
  { key: 'companyName', label: 'Company',  icon: <Building2 size={12} /> },
  { key: 'roleTitle',   label: 'Role',     icon: <Briefcase size={12} /> },
  { key: 'status',      label: 'Status',   icon: <Tag size={12} /> },
  { key: 'dateApplied', label: 'Applied',  icon: <Calendar size={12} /> },
  { key: 'salaryMin',   label: 'Salary',   icon: <DollarSign size={12} /> },
  { key: 'location',    label: 'Location', icon: <MapPin size={12} /> },
  { key: 'source',      label: 'Source',   icon: <Radio size={12} /> },
];

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300';

export function DashboardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('dateApplied');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [remoteFilter, setRemoteFilter] = useState<'all' | 'remote' | 'onsite'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ companyName: '', roleTitle: '', source: 'linkedin' as ApplicationSource });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applicationService.getAll()
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const app = await applicationService.create(createForm);
      setApplications((prev) => [app, ...prev]);
      setShowCreate(false);
      setCreateForm({ companyName: '', roleTitle: '', source: 'linkedin' });
      navigate(`/applications/${app.id}`);
    } catch {
      // TODO: surface error toast
    } finally {
      setCreating(false);
    }
  }

  const filtered = applications
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter((a) => {
      if (remoteFilter === 'remote') return a.remote;
      if (remoteFilter === 'onsite') return !a.remote;
      return true;
    });

  const sorted = sortApps(filtered, sortKey, sortDir);
  const hasActiveFilters = statusFilter !== 'all' || remoteFilter !== 'all';
  const thClass = 'pb-2.5 text-left text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors pr-6';

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-6 py-8">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-base font-medium text-gray-900">Applications</h1>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{sorted.length} of {applications.length}</span>

            {/* Filter */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:opacity-70 ${
                  hasActiveFilters
                    ? 'border-gray-300 text-gray-700 font-medium'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <SlidersHorizontal size={12} />
                Filter
                {hasActiveFilters && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white">
                    {(statusFilter !== 'all' ? 1 : 0) + (remoteFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="animate-rise-up absolute right-0 top-9 z-20 w-56 rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
                  <p className="mb-2 text-xs font-medium text-gray-400">Status</p>
                  <div className="mb-4 flex flex-wrap gap-1">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-xs capitalize transition-colors ${statusFilter === 'all' ? 'bg-gray-100 font-medium text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      All
                    </button>
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-xs capitalize transition-colors ${statusFilter === s ? 'bg-gray-100 font-medium text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 text-xs font-medium text-gray-400">Location type</p>
                  <div className="flex gap-1">
                    {(['all', 'remote', 'onsite'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRemoteFilter(r)}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-xs capitalize transition-colors ${remoteFilter === r ? 'bg-gray-100 font-medium text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={() => { setStatusFilter('all'); setRemoteFilter('all'); }}
                      className="mt-4 cursor-pointer text-xs text-gray-400 hover:opacity-70"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Add new */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:opacity-70"
            >
              <Plus size={12} />
              New
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {COLUMNS.map(({ key, label, icon }) => (
                  <th key={key} className={thClass} onClick={() => handleSort(key)}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-gray-300">{icon}</span>
                      {label}
                      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-300">
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-300">
                    {applications.length === 0 ? 'No applications yet. Add your first one.' : 'No applications match these filters.'}
                  </td>
                </tr>
              ) : (
                sorted.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="group cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50"
                  >
                    <td className="py-3 pr-6 font-medium text-gray-900">{app.companyName ?? '—'}</td>
                    <td className="py-3 pr-6 text-gray-600">{app.roleTitle ?? '—'}</td>
                    <td className="py-3 pr-6"><StatusBadge status={app.status} /></td>
                    <td className="py-3 pr-6 text-gray-500">{formatDate(app.dateApplied)}</td>
                    <td className="py-3 pr-6 text-gray-500">{formatSalary(app.salaryMin, app.salaryMax)}</td>
                    <td className="py-3 pr-6 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        {app.location ?? '—'}
                        {app.remote && (
                          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">Remote</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-gray-400 capitalize">{app.source ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-rise-up mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">New application</h2>
              <button onClick={() => setShowCreate(false)} className="cursor-pointer text-gray-300 hover:text-gray-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-3">
              <input
                type="text"
                placeholder="Company name"
                value={createForm.companyName}
                onChange={(e) => setCreateForm((f) => ({ ...f, companyName: e.target.value }))}
                className={inputClass}
                autoFocus
              />
              <input
                type="text"
                placeholder="Role title"
                value={createForm.roleTitle}
                onChange={(e) => setCreateForm((f) => ({ ...f, roleTitle: e.target.value }))}
                className={inputClass}
              />
              <select
                value={createForm.source}
                onChange={(e) => setCreateForm((f) => ({ ...f, source: e.target.value as ApplicationSource }))}
                className={inputClass}
              >
                {ALL_SOURCES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || (!createForm.companyName && !createForm.roleTitle)}
                  className="flex-1 cursor-pointer rounded-lg border border-gray-900 bg-gray-900 py-2 text-sm text-white hover:opacity-70 disabled:opacity-40"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
