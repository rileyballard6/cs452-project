import type { ApplicationStatus } from '../../../types/application.types';

const styles: Record<ApplicationStatus, string> = {
  saved:     'bg-gray-100 text-gray-600',
  applied:   'bg-blue-100 text-blue-600',
  interview: 'bg-amber-100 text-amber-700',
  offer:     'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-600',
};

const labels: Record<ApplicationStatus, string> = {
  saved:     'Saved',
  applied:   'Applied',
  interview: 'Interview',
  offer:     'Offer',
  rejected:  'Rejected',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
