"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function JobForm() {
  const router = useRouter();
  const [cmcUrl, setCmcUrl] = useState("");
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
        body: JSON.stringify({ cmcUrl }),
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
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-950">Craft From Coin Page</h2>
        <p className="text-sm text-zinc-600">
          Paste a CoinMarketCap coin page URL and the worker will research, draft, publish a
          WordPress draft, log to Google Sheets, and send Telegram notification.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-700" htmlFor="cmc-url">
          CoinMarketCap coin page URL
        </label>
        <input
          id="cmc-url"
          className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-400"
          onChange={(event) => setCmcUrl(event.target.value)}
          placeholder="https://coinmarketcap.com/currencies/xrp/"
          type="url"
          value={cmcUrl}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
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
