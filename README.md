# CMC Author Dashboard

Internal dashboard for turning a CoinMarketCap coin page URL into a crafted article workflow:
- create three variants
- auto-select the best variant
- generate SEO support assets
- create a WordPress draft
- append a Google Sheets log row
- notify Telegram

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
- WordPress draft publishing credentials
- Google Sheets target information
- Telegram bot token and chat ID

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
