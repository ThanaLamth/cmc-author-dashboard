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
  if (!scheduledAt || status === "publish") {
    return "Publishes immediately";
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
      className={`rounded-3xl border p-5 shadow-sm ${
        selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-black/10 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-medium ${selected ? "text-zinc-300" : "text-zinc-500"}`}>
            Variant {variant.variantNo}
          </span>
          {selected ? (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">Selected</span>
          ) : null}
          {publication ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                selected
                  ? "bg-white/10 text-zinc-100"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              #{publication.publishOrder + 1} {publication.publishStatus}
            </span>
          ) : null}
        </div>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{variant.title}</h3>
      <p
        className={`mt-3 line-clamp-6 text-sm ${
          selected ? "text-zinc-200" : "text-zinc-600"
        }`}
      >
        {variant.body}
      </p>
      {variant.metaDescription ? (
        <p className={`mt-4 text-xs ${selected ? "text-zinc-300" : "text-zinc-500"}`}>
          Meta: {variant.metaDescription}
        </p>
      ) : null}
      {publication ? (
        <div
          className={`mt-4 rounded-2xl border p-4 text-xs ${
            selected
              ? "border-white/10 bg-white/5 text-zinc-200"
              : "border-zinc-200 bg-zinc-50 text-zinc-600"
          }`}
        >
          <p className="font-medium">{formatScheduleLabel(publication.publishStatus, publication.scheduledAt)}</p>
          <p className="mt-2">Sheet row: {publication.sheetRowId ?? "-"}</p>
          {publication.wordpressUrl ? (
            <a
              className={`mt-2 inline-flex underline ${
                selected ? "text-white" : "text-zinc-900"
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
