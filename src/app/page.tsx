import Link from "next/link";

import { JobForm } from "@/components/job-form";
import { getIntegrationMode } from "@/lib/integrations/mode";

export default function HomePage() {
  const integrationMode = getIntegrationMode();

  return (
    <main className="min-h-screen px-6 py-16 text-[var(--text-primary)]">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">
              CMC Author Dashboard
            </p>
            <span className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)] shadow-[var(--shadow-soft)]">
              {integrationMode} mode
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(21,29,40,0.98),rgba(15,22,32,0.96))] p-8 shadow-[var(--shadow-panel)]">
              <div className="max-w-3xl space-y-4">
                <h1 className="text-5xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-6xl">
                  Run the publishing console for CoinMarketCap-driven drafts.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
                  Research a coin page, generate four variants, push the publish queue to
                  WordPress, and monitor what is live from one dark operator surface.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[#061018] transition hover:border-[var(--accent-primary-strong)] hover:bg-[var(--accent-primary-strong)]"
                  href="/jobs"
                >
                  View Craft History
                </Link>
                <span className="inline-flex items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] px-4 text-sm text-[var(--text-secondary)]">
                  Queue-aware publishing with Telegram and Sheets logging
                </span>
              </div>
            </div>

            <div className="space-y-4 rounded-[2rem] border border-[var(--border-subtle)] bg-[rgba(18,24,33,0.88)] p-6 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Runtime
              </p>
              <div className="space-y-3">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Current mode
                  </p>
                  <p className="mt-2 text-lg font-semibold capitalize text-[var(--text-primary)]">
                    {integrationMode}
                  </p>
                </div>
                {integrationMode === "mock" ? (
                  <p className="rounded-2xl border border-[rgba(245,158,11,0.28)] bg-[rgba(58,38,8,0.82)] px-4 py-3 text-sm text-[var(--status-scheduled-text)]">
                    Mock mode is active. The dashboard will render visible placeholders instead of
                    performing real publishing side effects.
                  </p>
                ) : (
                  <p className="rounded-2xl border border-[rgba(74,222,128,0.22)] bg-[rgba(15,47,33,0.78)] px-4 py-3 text-sm text-[var(--status-success-text)]">
                    Live mode is active. Craft jobs can write to WordPress, Google Sheets, and
                    Telegram.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <JobForm />

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Research", "Observe CoinMarketCap feed behavior and gather non-CMC sources."],
            ["Select", "Generate three variants and choose the best fit with ban-risk checks."],
            ["Publish", "Create WordPress draft, log to Sheets, and send Telegram notice."],
          ].map(([title, copy]) => (
            <div
              className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[rgba(21,29,40,0.86)] p-5 shadow-[var(--shadow-soft)]"
              key={title}
            >
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
