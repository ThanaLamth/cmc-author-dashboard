type StageRun = {
  id: string;
  stage: string;
  attempt: number;
  status: string;
  errorText: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export function JobStageTimeline({ stages }: { stages: StageRun[] }) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">Stage Timeline</h2>
      <div className="mt-4 space-y-3">
        {stages.length === 0 ? (
          <p className="text-sm text-zinc-500">No stage runs yet.</p>
        ) : (
          stages.map((stage) => (
            <div
              className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
              key={stage.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">{stage.stage}</p>
                  <p className="text-xs text-zinc-500">Attempt {stage.attempt}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium capitalize text-zinc-700">
                  {stage.status}
                </span>
              </div>
              {stage.errorText ? (
                <p className="mt-3 text-sm text-red-600">{stage.errorText}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
