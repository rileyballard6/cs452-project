import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Building2, Briefcase, Tag, Calendar,
  DollarSign, MapPin, Radio, MoreHorizontal, Trash2,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Application, ApplicationStatus } from '../../../types/application.types';

type SortKey = 'companyName' | 'roleTitle' | 'status' | 'dateApplied' | 'salaryMin' | 'location' | 'source';
type SortDir = 'asc' | 'desc';

const ALL_STATUSES: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];

interface Props {
  apps: Application[];
  loading: boolean;
  totalCount: number;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
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

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="opacity-30" />;
  return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
}

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

const thClass = 'pb-2.5 text-left text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors pr-6';

export function ApplicationTable({ apps, loading, totalCount, sortKey, sortDir, onSort, openMenuId, setOpenMenuId, onDelete, onStatusChange }: Props) {
  const navigate = useNavigate();
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  useEffect(() => {
    function close() { setStatusMenuId(null); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {COLUMNS.map(({ key, label, icon }) => (
              <th key={key} className={thClass} onClick={() => onSort(key)}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-gray-300">{icon}</span>
                  {label}
                  <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
            ))}
            <th className="pb-2.5 w-8" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-sm text-gray-300">Loading…</td>
            </tr>
          ) : apps.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-sm text-gray-300">
                {totalCount === 0 ? 'No applications yet. Add your first one.' : 'No applications match these filters.'}
              </td>
            </tr>
          ) : (
            apps.map((app) => (
              <tr
                key={app.id}
                onClick={() => navigate(`/applications/${app.id}`)}
                className="group cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50"
              >
                <td className="py-3 pr-6 font-medium text-gray-900">{app.companyName ?? '—'}</td>
                <td className="py-3 pr-6 text-gray-600">{app.roleTitle ?? '—'}</td>
                <td className="py-3 pr-6" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setStatusMenuId(statusMenuId === app.id ? null : app.id); }}
                      className="cursor-pointer rounded-full transition-opacity hover:opacity-70"
                    >
                      <StatusBadge status={app.status} />
                    </button>
                    {statusMenuId === app.id && (
                      <div className="animate-rise-up absolute left-0 top-8 z-20 w-36 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
                        {ALL_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); onStatusChange(app.id, s); setStatusMenuId(null); }}
                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-gray-50"
                          >
                            <StatusBadge status={s} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
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
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === app.id ? null : app.id); }}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenuId === app.id && (
                      <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                        <button
                          onClick={(e) => onDelete(e, app.id)}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
