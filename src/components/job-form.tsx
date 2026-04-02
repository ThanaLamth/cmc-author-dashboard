"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  WORDPRESS_SITE_OPTIONS,
  type WordPressSiteKey,
} from "@/lib/integrations/wordpress-sites";

export function JobForm() {
  const router = useRouter();
  const [cmcUrl, setCmcUrl] = useState("");
  const [targetSite, setTargetSite] = useState<WordPressSiteKey>("cryptodailyalert");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cmcUrl, targetSite }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };

      if (!response.ok || !payload.id) {
        setError(payload.error ?? "Unable to create craft job.");
        return;
      }

      router.push(`/jobs/${payload.id}`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(21,29,40,0.96),rgba(15,22,32,0.96))] p-6 shadow-[var(--shadow-panel)]">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Launch Craft
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          Craft From Coin Page
        </h2>
        <p className="text-sm leading-7 text-[var(--text-secondary)]">
          Paste a CoinMarketCap coin page URL, choose the publishing site, and the worker will
          research, draft, schedule the WordPress queue, log to Google Sheets, and send Telegram
          notification.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="cmc-url">
          CoinMarketCap coin page URL
        </label>
        <input
          id="cmc-url"
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none ring-0 transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.18)]"
          onChange={(event) => setCmcUrl(event.target.value)}
          placeholder="https://coinmarketcap.com/currencies/xrp/"
          type="url"
          value={cmcUrl}
        />
        <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="target-site">
          Publishing site
        </label>
        <select
          id="target-site"
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none ring-0 transition focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.18)]"
          onChange={(event) => setTargetSite(event.target.value as WordPressSiteKey)}
          value={targetSite}
        >
          {WORDPRESS_SITE_OPTIONS.map((site) => (
            <option key={site.value} value={site.value}>
              {site.label}
            </option>
          ))}
        </select>
        {error ? <p className="text-sm text-[var(--status-error-text)]">{error}</p> : null}
        <button
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[#061018] transition hover:border-[var(--accent-primary-strong)] hover:bg-[var(--accent-primary-strong)] disabled:cursor-not-allowed disabled:border-[var(--border-subtle)] disabled:bg-[var(--bg-panel-soft)] disabled:text-[var(--text-muted)]"
          disabled={isPending || !cmcUrl.trim()}
          onClick={submit}
          type="button"
        >
          {isPending ? "Crafting..." : "Craft"}
        </button>
      </div>
    </section>
  );
}
