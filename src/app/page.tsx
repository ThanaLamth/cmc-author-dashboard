import { JobForm } from "@/components/job-form";
import { getIntegrationMode } from "@/lib/integrations/mode";

export default function HomePage() {
  const integrationMode = getIntegrationMode();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fafaf9,_#f4f4f5_40%,_#e4e4e7)] px-6 py-16 text-zinc-950">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
              CMC Author Dashboard
            </p>
            <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-700">
              {integrationMode} mode
            </span>
          </div>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-950">
              Research a coin page, craft variants, and push a WordPress draft.
            </h1>
            <p className="text-base leading-7 text-zinc-600">
              The worker will generate three article variants, select the strongest one, add SEO
              support assets, log the run to Google Sheets, and notify Telegram.
            </p>
            {integrationMode === "mock" ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Mock mode is active. The dashboard will generate visible mock outputs instead of
                performing real external publishing side effects.
              </p>
            ) : null}
          </div>
        </section>

        <JobForm />

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Research", "Observe CoinMarketCap feed behavior and gather non-CMC sources."],
            ["Select", "Generate three variants and choose the best fit with ban-risk checks."],
            ["Publish", "Create WordPress draft, log to Sheets, and send Telegram notice."],
          ].map(([title, copy]) => (
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm" key={title}>
              <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
