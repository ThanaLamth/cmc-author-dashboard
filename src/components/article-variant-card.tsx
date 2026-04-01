type Variant = {
  id: string;
  variantNo: number;
  title: string;
  body: string;
  metaDescription: string | null;
  thumbnailPrompt: string | null;
};

export function ArticleVariantCard({ selected, variant }: { selected?: boolean; variant: Variant }) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${
        selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-black/10 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-medium ${selected ? "text-zinc-300" : "text-zinc-500"}`}>
          Variant {variant.variantNo}
        </span>
        {selected ? (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">Selected</span>
        ) : null}
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
    </article>
  );
}
