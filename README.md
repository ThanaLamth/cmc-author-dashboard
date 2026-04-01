# CMC Author Dashboard

`v1` internal dashboard for turning a CoinMarketCap coin page URL into a crafted article workflow:
- create four variants
- auto-select the best variant
- generate SEO support assets
- publish one WordPress post immediately
- schedule three additional WordPress posts
- append all created posts to Google Sheets
- notify Telegram with the publish queue

## Version Scope

### `v1`

Current scope:
- submit a CoinMarketCap coin page URL
- run the craft pipeline through `codex exec`
- generate four materially different article variants
- choose the best variant for immediate publication
- publish one post immediately
- schedule the remaining three posts at `+6h`, `+12h`, and `+24h`
- log all created WordPress posts to Google Sheets
- send a Telegram notification with the full publish queue

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
- Codex binary path if not available as `codex`
- model override for the craft step if you want one
- WordPress draft publishing credentials
- Google Sheets target information
- Telegram bot token and chat ID

## Skills

### Runtime requirement

For the current `v1`, live craft **does** require Codex on the server.

The live craft step calls `codex exec` from the worker process. That means the Ubuntu server needs:
- `codex` installed
- `codex login` completed for the runtime user
- the `top-cmc-writer` skill installed for that same user

### Recommended skill for manual or Codex-assisted workflows

Required runtime skill:
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

### Live craft execution shape

When you press `Craft` in the web app:
- the worker runs `codex exec`
- the prompt explicitly tells Codex to use `top-cmc-writer`
- Codex returns strict JSON
- each variant includes `body_html`, so the selected article can be pushed to WordPress directly
- the app parses that JSON, stores the variants, then:
  - publishes the best variant immediately
  - schedules the remaining three variants
  - logs every created WordPress post to Google Sheets
  - sends a Telegram summary of the full queue

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
