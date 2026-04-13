import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Application, ApplicationStatus } from '../../../types/application.types';

const KANBAN_COLS: { status: ApplicationStatus; label: string; dot: string; cardBg: string }[] = [
  { status: 'saved',     label: 'Saved',     dot: 'bg-[rgb(142,139,135)]', cardBg: 'bg-[rgb(240,239,237)]' },
  { status: 'applied',   label: 'Applied',   dot: 'bg-[rgb(68,129,216)]',  cardBg: 'bg-[rgb(213,227,246)]' },
  { status: 'interview', label: 'Interview', dot: 'bg-[rgb(208,165,72)]',  cardBg: 'bg-[rgb(240,228,198)]' },
  { status: 'offer',     label: 'Offer',     dot: 'bg-[rgb(95,159,117)]',  cardBg: 'bg-[rgb(221,230,222)]' },
  { status: 'rejected',  label: 'Rejected',  dot: 'bg-[rgb(213,108,94)]',  cardBg: 'bg-[rgb(244,221,218)]' },
];

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  applications: Application[];
  loading: boolean;
  remoteFilter: 'all' | 'remote' | 'onsite';
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onAddClick: (status: ApplicationStatus) => void;
}

export function KanbanBoard({ applications, loading, remoteFilter, onStatusChange, onAddClick }: Props) {
  const navigate = useNavigate();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  }

  function handleDrop(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault();
    if (draggingId) {
      const app = applications.find((a) => a.id === draggingId);
      if (app && app.status !== status) {
        onStatusChange(draggingId, status);
      }
    }
    setDraggingId(null);
    setDragOverCol(null);
  }

  if (loading) {
    return <p className="py-10 text-sm text-gray-300">Loading…</p>;
  }

  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-4">
      <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
        {KANBAN_COLS.map(({ status, label, dot, cardBg }) => {
          const colApps = applications
            .filter((a) => a.status === status)
            .filter((a) => {
              if (remoteFilter === 'remote') return a.remote;
              if (remoteFilter === 'onsite') return !a.remote;
              return true;
            });

          const isOver = dragOverCol === status;

          return (
            <div
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex w-[260px] shrink-0 flex-col rounded-xl p-3 transition-opacity ${cardBg} ${
                isOver ? 'opacity-80' : 'opacity-100'
              }`}
            >
              {/* Column header */}
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                <span className="text-xs font-medium text-gray-600">{label}</span>
                <span className="ml-auto text-xs text-gray-400">{colApps.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {colApps.map((app) => {
                  const isDragging = draggingId === app.id;
                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className={`cursor-pointer rounded-lg border bg-white p-3.5 transition-all select-none ${
                        isDragging
                          ? 'opacity-40 shadow-sm border-gray-100'
                          : 'border-gray-100 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {app.roleTitle && (
                        <p className="text-sm font-medium text-gray-900 leading-snug">{app.roleTitle}</p>
                      )}
                      <p className={`leading-snug ${app.roleTitle ? 'mt-0.5 text-xs text-gray-500' : 'text-sm font-medium text-gray-900'}`}>
                        {app.companyName ?? '—'}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {app.source && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] capitalize text-gray-500">
                            {app.source}
                          </span>
                        )}
                        {app.dateApplied && (
                          <span className="ml-auto text-[10px] text-gray-400">{formatDate(app.dateApplied)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add button */}
              <button
                onClick={() => onAddClick(status)}
                className="mt-2 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
