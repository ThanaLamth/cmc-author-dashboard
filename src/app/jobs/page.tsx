import { JobsPageLive } from "@/components/jobs-page-live";
import { listJobs } from "@/lib/jobs/queries";

export default async function JobsPage() {
  const jobs = await listJobs();

  return (
    <JobsPageLive
      jobs={jobs.map((job) => ({
        id: job.id,
        cmcUrl: job.cmcUrl,
        coinSlug: job.coinSlug,
        targetSite: job.targetSite,
        status: job.status,
        currentStage: job.currentStage,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      }))}
    />
  );
}
