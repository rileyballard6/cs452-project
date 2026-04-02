import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';
import { StatusBadge } from '../components/StatusBadge';
import { dummyApplications } from '../data/dummy';

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSalary(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return '—';
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `up to ${fmt(max!)}`;
}

export function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-6 py-8">
        {/* Page title */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-base font-medium text-gray-900">Applications</h1>
          <span className="text-sm text-gray-400">{dummyApplications.length} total</span>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2.5 text-left text-xs font-medium text-gray-400">Company</th>
                <th className="pb-2.5 text-left text-xs font-medium text-gray-400">Role</th>
                <th className="pb-2.5 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="pb-2.5 text-left text-xs font-medium text-gray-400">Applied</th>
                <th className="pb-2.5 text-left text-xs font-medium text-gray-400">Salary</th>
                <th className="pb-2.5 text-left text-xs font-medium text-gray-400">Location</th>
                <th className="pb-2.5 text-left text-xs font-medium text-gray-400">Source</th>
              </tr>
            </thead>
            <tbody>
              {dummyApplications.map((app) => (
                <tr
                  key={app.id}
                  className="group border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  <td className="py-3 pr-6 font-medium text-gray-900">
                    {app.companyName ?? '—'}
                  </td>
                  <td className="py-3 pr-6 text-gray-600">
                    {app.roleTitle ?? '—'}
                  </td>
                  <td className="py-3 pr-6">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="py-3 pr-6 text-gray-500">
                    {formatDate(app.dateApplied)}
                  </td>
                  <td className="py-3 pr-6 text-gray-500">
                    {formatSalary(app.salaryMin, app.salaryMax, app.currency)}
                  </td>
                  <td className="py-3 pr-6 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      {app.location ?? '—'}
                      {app.remote && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
                          Remote
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-gray-400 capitalize">
                    {app.source ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
