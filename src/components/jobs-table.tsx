import { getWordPressSiteDefinition, isWordPressSiteKey } from "@/lib/integrations/wordpress-sites";

type JobRow = {
  id: string;
  cmcUrl: string;
  coinSlug: string | null;
  targetSite: string;
  status: string;
  currentStage: string | null;
  createdAt: string;
  updatedAt: string;
};

function statusBadgeClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-[var(--status-success-bg)] text-[var(--status-success-text)]";
    case "failed":
    case "partial_failed":
      return "bg-[var(--status-error-bg)] text-[var(--status-error-text)]";
    case "running":
      return "bg-[var(--status-running-bg)] text-[var(--status-running-text)]";
    default:
      return "bg-[var(--status-scheduled-bg)] text-[var(--status-scheduled-text)]";
  }
}

export function JobsTable({ jobs }: { jobs: JobRow[] }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[rgba(21,29,40,0.9)] shadow-[var(--shadow-panel)]">
      <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm">
        <thead className="bg-[rgba(27,36,49,0.9)]">
          <tr className="text-left text-[var(--text-muted)]">
            <th className="px-4 py-3 font-medium">Coin</th>
            <th className="px-4 py-3 font-medium">Site</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {jobs.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-[var(--text-muted)]" colSpan={6}>
                No craft jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr
                className="transition hover:bg-[rgba(27,36,49,0.55)]"
                key={job.id}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--text-primary)]">
                    {job.coinSlug ?? "Unknown"}
                  </div>
                  <div className="max-w-md truncate text-xs text-[var(--text-muted)]">{job.cmcUrl}</div>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {isWordPressSiteKey(job.targetSite)
                    ? getWordPressSiteDefinition(job.targetSite).label
                    : job.targetSite}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusBadgeClasses(job.status)}`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{job.currentStage ?? "-"}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {new Date(job.updatedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <a className="text-[var(--accent-primary)] underline underline-offset-4" href={`/jobs/${job.id}`}>
                    View
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
