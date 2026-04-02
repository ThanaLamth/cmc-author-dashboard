"use client";

function formatTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleTimeString() : null;
}

export function LiveRefreshIndicator({
  enabled,
  refreshing = false,
  updatedAt,
}: {
  enabled: boolean;
  refreshing?: boolean;
  updatedAt?: string | null;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
      <span
        className={`rounded-full px-3 py-1 font-medium uppercase tracking-[0.12em] ${
          enabled
            ? "bg-[var(--status-running-bg)] text-[var(--status-running-text)]"
            : "bg-[var(--bg-panel)] text-[var(--text-muted)]"
        }`}
      >
        {enabled ? "Live refresh on" : "Live refresh off"}
      </span>
      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-1 text-[var(--text-muted)]">
        {refreshing ? "Refreshing..." : `Updated ${formatTime(updatedAt) ?? "-"}`}
      </span>
    </div>
  );
}
