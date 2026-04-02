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
    <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[rgba(21,29,40,0.9)] p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Stage Timeline</h2>
      <div className="mt-4 space-y-3">
        {stages.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No stage runs yet.</p>
        ) : (
          stages.map((stage) => (
            <div
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4"
              key={stage.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{stage.stage}</p>
                  <p className="text-xs text-[var(--text-muted)]">Attempt {stage.attempt}</p>
                </div>
                <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs font-medium capitalize text-[var(--text-secondary)]">
                  {stage.status}
                </span>
              </div>
              <div className="mt-3 grid gap-3 text-xs text-[var(--text-muted)] md:grid-cols-3">
                <p>Started: {formatDateTime(stage.startedAt)}</p>
                <p>Finished: {formatDateTime(stage.finishedAt)}</p>
                <p>Duration: {formatDuration(stage.startedAt, stage.finishedAt) ?? "-"}</p>
              </div>
              {stage.errorText ? (
                <p className="mt-3 text-sm text-[var(--status-error-text)]">{stage.errorText}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
