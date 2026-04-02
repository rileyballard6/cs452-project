import type { ApplicationStatus } from '../../../types/application.types';

const styles: Record<ApplicationStatus, string> = {
  saved:     'bg-gray-100 text-gray-500',
  applied:   'bg-blue-50 text-blue-500',
  interview: 'bg-amber-50 text-amber-600',
  offer:     'bg-green-50 text-green-600',
  rejected:  'bg-red-50 text-red-400',
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
