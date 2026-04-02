type Variant = {
  id: string;
  variantNo: number;
  title: string;
  body: string;
  metaDescription: string | null;
  thumbnailPrompt: string | null;
};

type Publication = {
  publishOrder: number;
  wordpressUrl: string | null;
  publishStatus: string;
  scheduledAt: string | null;
  sheetRowId: string | null;
};

function formatScheduleLabel(status: string, scheduledAt: string | null) {
  if (!scheduledAt) {
    return "Scheduled time pending";
  }

  return `Scheduled ${new Date(scheduledAt).toLocaleString()}`;
}

export function ArticleVariantCard({
  publication,
  selected,
  variant,
}: {
  publication?: Publication;
  selected?: boolean;
  variant: Variant;
}) {
  return (
    <article
      className={`rounded-[1.75rem] border p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 ${
        selected
          ? "border-[var(--accent-primary)] bg-[linear-gradient(180deg,rgba(27,36,49,0.98),rgba(15,22,32,0.98))] text-[var(--text-primary)]"
          : "border-[var(--border-subtle)] bg-[rgba(21,29,40,0.92)] text-[var(--text-primary)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-medium uppercase tracking-[0.18em] ${
              selected ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Variant {variant.variantNo}
          </span>
          {selected ? (
            <span className="rounded-full bg-[rgba(56,189,248,0.18)] px-3 py-1 text-xs font-medium text-[var(--accent-primary)]">
              Selected
            </span>
          ) : null}
          {publication ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                selected
                  ? "bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]"
                  : "bg-[var(--bg-panel-soft)] text-[var(--text-secondary)]"
              }`}
            >
              #{publication.publishOrder + 1} {publication.publishStatus}
            </span>
          ) : null}
        </div>
      </div>
      <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{variant.title}</h3>
      <p
        className={`mt-3 line-clamp-6 text-sm ${
          selected ? "text-[var(--text-secondary)]" : "text-[var(--text-secondary)]"
        }`}
      >
        {variant.body}
      </p>
      {variant.metaDescription ? (
        <p className={`mt-4 text-xs ${selected ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}>
          Meta: {variant.metaDescription}
        </p>
      ) : null}
      {publication ? (
        <div
          className={`mt-4 rounded-2xl border p-4 text-xs ${
            selected
              ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] text-[var(--text-secondary)]"
          }`}
        >
          <p className="font-medium">{formatScheduleLabel(publication.publishStatus, publication.scheduledAt)}</p>
          <p className="mt-2">Sheet row: {publication.sheetRowId ?? "-"}</p>
          {publication.wordpressUrl ? (
            <a
              className={`mt-2 inline-flex underline underline-offset-4 ${
                selected ? "text-[var(--accent-primary)]" : "text-[var(--accent-primary)]"
              }`}
              href={publication.wordpressUrl}
            >
              Open WordPress post
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
