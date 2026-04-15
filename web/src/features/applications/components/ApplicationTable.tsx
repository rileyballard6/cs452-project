import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Building2, Briefcase, Tag, Calendar,
  DollarSign, MapPin, Radio, MoreHorizontal, Trash2, Archive, ArchiveRestore,
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
  onArchive: (e: React.MouseEvent, id: string) => void;
  onUnarchive: (e: React.MouseEvent, id: string) => void;
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

export function ApplicationTable({ apps, loading, totalCount, sortKey, sortDir, onSort, openMenuId, setOpenMenuId, onDelete, onArchive, onUnarchive, onStatusChange }: Props) {
  const navigate = useNavigate();
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, left: 0 });
  const [actionMenuPos, setActionMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    function close() { setStatusMenuId(null); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  function openStatusMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setStatusMenuPos({ top: rect.bottom + 4, left: rect.left });
    setStatusMenuId(statusMenuId === id ? null : id);
  }

  function openActionMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActionMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpenMenuId(openMenuId === id ? null : id);
  }

  const activeApp = openMenuId ? apps.find((a) => a.id === openMenuId) : null;

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
                <td className="py-3 pr-6">
                  <button
                    onClick={(e) => openStatusMenu(e, app.id)}
                    className="cursor-pointer rounded-full transition-opacity hover:opacity-70"
                  >
                    <StatusBadge status={app.status} />
                  </button>
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
                  <button
                    onClick={(e) => openActionMenu(e, app.id)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Status dropdown — portaled to avoid overflow clipping */}
      {statusMenuId && createPortal(
        <div
          style={{ position: 'fixed', top: statusMenuPos.top, left: statusMenuPos.left, zIndex: 9999 }}
          className="animate-rise-up w-36 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); onStatusChange(statusMenuId, s); setStatusMenuId(null); }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-gray-50"
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Action (three-dot) dropdown — portaled to avoid overflow clipping */}
      {openMenuId && activeApp && createPortal(
        <div
          style={{ position: 'fixed', top: actionMenuPos.top, right: actionMenuPos.right, zIndex: 9999 }}
          className="animate-rise-up w-36 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {activeApp.archived ? (
            <button
              onClick={(e) => onUnarchive(e, activeApp.id)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <ArchiveRestore size={13} />
              Unarchive
            </button>
          ) : activeApp.hasAnalysis ? (
            <button
              onClick={(e) => onArchive(e, activeApp.id)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Archive size={13} />
              Archive
            </button>
          ) : (
            <button
              onClick={(e) => onDelete(e, activeApp.id)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50"
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
