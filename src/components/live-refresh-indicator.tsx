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
    <div className="inline-flex flex-wrap items-center gap-2 text-xs text-zinc-600">
      <span
        className={`rounded-full px-3 py-1 font-medium uppercase tracking-[0.12em] ${
          enabled ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        {enabled ? "Live refresh on" : "Live refresh off"}
      </span>
      <span className="rounded-full bg-white px-3 py-1 text-zinc-500">
        {refreshing ? "Refreshing..." : `Updated ${formatTime(updatedAt) ?? "-"}`}
      </span>
    </div>
  );
}
