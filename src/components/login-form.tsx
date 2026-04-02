"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          redirectTo,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Login failed.");
        return;
      }

      router.push(payload.redirectTo ?? "/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(21,29,40,0.98),rgba(15,22,32,0.96))] p-8 shadow-[var(--shadow-panel)]">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Dashboard Access
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          Sign in
        </h1>
        <p className="text-sm leading-7 text-[var(--text-secondary)]">
          Use your dashboard credentials to access the craft console.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.18)]"
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            value={username}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.18)]"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </div>
        {error ? <p className="text-sm text-[var(--status-error-text)]">{error}</p> : null}
        <button
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[#061018] transition hover:border-[var(--accent-primary-strong)] hover:bg-[var(--accent-primary-strong)] disabled:cursor-not-allowed disabled:border-[var(--border-subtle)] disabled:bg-[var(--bg-panel-soft)] disabled:text-[var(--text-muted)]"
          disabled={isPending || !username.trim() || !password}
          onClick={submit}
          type="button"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
