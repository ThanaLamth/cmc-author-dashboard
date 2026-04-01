type JobRow = {
  id: string;
  cmcUrl: string;
  coinSlug: string | null;
  status: string;
  currentStage: string | null;
  createdAt: string;
  updatedAt: string;
};

export function JobsTable({ jobs }: { jobs: JobRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-100 text-sm">
        <thead className="bg-zinc-50">
          <tr className="text-left text-zinc-600">
            <th className="px-4 py-3 font-medium">Coin</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {jobs.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-zinc-500" colSpan={5}>
                No craft jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900">{job.coinSlug ?? "Unknown"}</div>
                  <div className="max-w-md truncate text-xs text-zinc-500">{job.cmcUrl}</div>
                </td>
                <td className="px-4 py-3 capitalize text-zinc-800">{job.status}</td>
                <td className="px-4 py-3 text-zinc-700">{job.currentStage ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {new Date(job.updatedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <a className="text-zinc-950 underline" href={`/jobs/${job.id}`}>
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
