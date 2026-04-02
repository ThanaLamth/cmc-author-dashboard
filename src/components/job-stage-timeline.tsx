type StageRun = {
  id: string;
  stage: string;
  attempt: number;
  status: string;
  errorText: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatDuration(startedAt: string | null, finishedAt: string | null) {
  if (!startedAt || !finishedAt) {
    return null;
  }

  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

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
              <div className="mt-3 grid gap-3 text-xs text-zinc-500 md:grid-cols-3">
                <p>Started: {formatDateTime(stage.startedAt)}</p>
                <p>Finished: {formatDateTime(stage.finishedAt)}</p>
                <p>Duration: {formatDuration(stage.startedAt, stage.finishedAt) ?? "-"}</p>
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
