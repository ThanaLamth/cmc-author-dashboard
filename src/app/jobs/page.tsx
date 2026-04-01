import { JobsTable } from "@/components/jobs-table";
import { listJobs } from "@/lib/jobs/queries";

export default async function JobsPage() {
  const jobs = await listJobs();

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">Jobs</p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Craft history</h1>
        </div>
        <JobsTable
          jobs={jobs.map((job) => ({
            id: job.id,
            cmcUrl: job.cmcUrl,
            coinSlug: job.coinSlug,
            status: job.status,
            currentStage: job.currentStage,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
