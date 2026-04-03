import type { ApplicationStatus } from '../../../types/application.types';

const styles: Record<ApplicationStatus, { pill: string; dot: string }> = {
  saved:     { pill: 'bg-[rgb(240,239,237)] text-[rgb(55,53,50)]',   dot: 'bg-[rgb(142,139,135)]' },
  applied:   { pill: 'bg-[rgb(213,227,246)] text-[rgb(22,58,120)]',  dot: 'bg-[rgb(68,129,216)]' },
  interview: { pill: 'bg-[rgb(240,228,198)] text-[rgb(100,72,15)]',  dot: 'bg-[rgb(208,165,72)]' },
  offer:     { pill: 'bg-[rgb(221,230,222)] text-[rgb(28,78,48)]',   dot: 'bg-[rgb(95,159,117)]' },
  rejected:  { pill: 'bg-[rgb(244,221,218)] text-[rgb(110,35,25)]',  dot: 'bg-[rgb(213,108,94)]' },
};

const labels: Record<ApplicationStatus, string> = {
  saved:     'Saved',
  applied:   'Applied',
  interview: 'Interview',
  offer:     'Offer',
  rejected:  'Rejected',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { pill, dot } = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${pill}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {labels[status]}
    </span>
  );
}
