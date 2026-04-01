# CMC Author Dashboard

`v1` internal dashboard for turning a CoinMarketCap coin page URL into a crafted article workflow:
- create three variants
- auto-select the best variant
- generate SEO support assets
- create a WordPress draft
- append a Google Sheets log row
- notify Telegram

## Version Scope

### `v1`

Current scope:
- submit a CoinMarketCap coin page URL
- run the craft pipeline
- choose the best of three generated variants
- create a WordPress draft
- log the run to Google Sheets
- send a Telegram notification that the draft was created

### `v2` planned

Planned next feature set:
- check whether the published article has surfaced in the coin page `Top` feed yet
- record the top-check result in the workflow state
- send a follow-up Telegram notification showing whether the article has reached `Top`
- support repeated top-status checks after publish

## Stack

- Next.js
- TypeScript
- Prisma
- SQLite
- Vitest
- Playwright
- `tsx` worker runtime

## Local Development

```bash
npm install
npx prisma migrate dev
npm run dev
```

In a second terminal:

```bash
npm run worker
```

## Test Commands

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Required Environment

Copy `.env.example` to `.env` and fill in:
- database URL
- integration mode (`mock` for local development, `live` for real publishing)
- OpenAI API key and model for the craft step
- WordPress draft publishing credentials
- Google Sheets target information
- Telegram bot token and chat ID

## Skills

### Runtime requirement

For the current `v1`, the app does **not** require Codex skills at runtime.

The live craft step currently calls the OpenAI Responses API directly from the app, so Ubuntu deployment only needs the normal app environment variables and processes.

### Recommended skill for manual or Codex-assisted workflows

Recommended companion skill:
- `top-cmc-writer`

Use it when you want to:
- manually research a coin page in Codex
- inspect why an article ranked in `Top`
- draft article variants outside the dashboard
- keep the same article heuristics as the app workflow

### How to install `top-cmc-writer` on Ubuntu

If you are also running Codex on the same Ubuntu machine, install the skill into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills/top-cmc-writer
cp /path/to/top-cmc-writer/SKILL.md ~/.codex/skills/top-cmc-writer/SKILL.md
```

If you want to pull it from your existing repo that already stores the skill:

```bash
git clone https://github.com/ThanaLamth/author-news.git
mkdir -p ~/.codex/skills/top-cmc-writer
cp author-news/skills/top-cmc-writer/SKILL.md ~/.codex/skills/top-cmc-writer/SKILL.md
```

After that, Codex can use the skill by name in future sessions.

## Integration Modes

- `INTEGRATION_MODE=mock`
  - uses visible mock outputs for local development
  - does not silently pretend to be real publishing
- `INTEGRATION_MODE=live`
  - requires real credentials
  - missing credentials fail the relevant stage

## Ubuntu Deploy Shape

Recommended `v1` layout:
- one web process
- one worker process
- one SQLite database file

Use `systemd` or `pm2` to keep both processes running.
