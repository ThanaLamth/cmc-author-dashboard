# Deploy on Ubuntu

This app runs as two required processes:
- `web`: Next.js server
- `worker`: background craft/publish runner

Optional third process if you want Google Flow featured images:
- `flow-image-worker`: Playwright browser worker that generates images from Flow and returns them to the main worker

The live craft step depends on:
- `codex` installed on the server
- `codex login` completed for the same Linux user that runs the worker
- `top-cmc-writer` installed in that user's `~/.codex/skills`

## 1. System Packages

```bash
sudo apt update
sudo apt install -y curl git build-essential
```

## 2. Install Node.js

Use Node 20 or newer.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. Clone the App

```bash
cd /opt
sudo git clone https://github.com/ThanaLamth/cmc-author-dashboard.git
sudo chown -R $USER:$USER /opt/cmc-author-dashboard
cd /opt/cmc-author-dashboard
```

## 4. Install Dependencies

```bash
npm install
```

## 5. Create the Environment File

```bash
cp .env.example .env
nano .env
```

Recommended live example:

```dotenv
DATABASE_URL="file:./dev.db"
INTEGRATION_MODE="live"
CODEX_BIN="codex"
OPENAI_MODEL=""
WORDPRESS_BASE_URL="https://your-wordpress-site.com"
WORDPRESS_USERNAME="your-wordpress-user"
WORDPRESS_APP_PASSWORD="your-wordpress-app-password"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_SHEETS_WORKSHEET_NAME="Drafts"
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-telegram-chat-id"
CRAFT_MODEL="gpt-5.4-mini"
FLOW_IMAGE_WORKER_URL="http://127.0.0.1:4319/generate"
FLOW_IMAGE_WORKER_TOKEN="replace-with-shared-secret"
FLOW_PROJECT_URL="https://labs.google/fx/vi/tools/flow/project/YOUR_PROJECT_ID"
FLOW_STORAGE_STATE_PATH="/opt/cmc-author-dashboard/.secrets/flow-storage-state.json"
FLOW_IMAGE_WORKER_PORT="4319"
FLOW_HEADLESS="true"
FLOW_CREATE_TIMEOUT_MS="180000"
FLOW_NAV_TIMEOUT_MS="30000"
```

## 6. Run Prisma Migration

```bash
npx prisma migrate deploy
```

## 7. Build the App

```bash
npm run build
```

## 8. Install Playwright Chromium

The optional Flow image worker needs a real browser runtime:

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium
```

## 9. Install Codex

If `codex` is not already installed:

```bash
npm install -g @openai/codex
codex --version
```

If your environment uses a different installation method, make sure the final binary path matches `CODEX_BIN` in `.env`.

## 10. Login to Codex

Run this as the same Linux user that will run the worker:

```bash
codex login
```

Verify it works:

```bash
codex exec --skip-git-repo-check --ephemeral "Reply with the word OK"
```

## 11. Install the Runtime Skill

```bash
cd /tmp
git clone https://github.com/ThanaLamth/author-news.git
mkdir -p ~/.codex/skills/top-cmc-writer
cp /tmp/author-news/skills/top-cmc-writer/SKILL.md ~/.codex/skills/top-cmc-writer/SKILL.md
```

Verify the skill file exists:

```bash
ls -la ~/.codex/skills/top-cmc-writer
```

## 12. Optional: Bootstrap Google Flow Session

This is required only if you want automatic featured images from Flow.

The worker uses Playwright storage state, not manual cookies. You need to create the storage-state file once while logged in to the target Google account.

On a machine with a GUI/browser session:

```bash
cd /opt/cmc-author-dashboard
mkdir -p /opt/cmc-author-dashboard/.secrets
npm run flow-save-session
```

This opens Flow in Chromium. Log in, wait until the Flow project is fully usable, then press Enter in the terminal. It will save:

```text
/opt/cmc-author-dashboard/.secrets/flow-storage-state.json
```

If your Ubuntu server is headless and you do not want to set up a desktop session, run `npm run flow-save-session` on another Linux/macOS machine, then copy the resulting storage-state JSON to the server path above.

## 13. Test the App Manually

Terminal 1:

```bash
cd /opt/cmc-author-dashboard
npm run start
```

Terminal 2:

```bash
cd /opt/cmc-author-dashboard
npm run worker
```

Optional Terminal 3 if Flow featured images are enabled:

```bash
cd /opt/cmc-author-dashboard
npm run flow-image-worker
```

Open:

```text
http://YOUR_SERVER_IP:3000
```

If that works, move on to `systemd`.

## 14. Install systemd Services

Copy the service files:

```bash
sudo cp deploy/systemd/cmc-author-dashboard-web.service /etc/systemd/system/
sudo cp deploy/systemd/cmc-author-dashboard-worker.service /etc/systemd/system/
sudo cp deploy/systemd/cmc-author-dashboard-flow-image-worker.service /etc/systemd/system/
```

Before starting them, open all copied files and adjust these lines if your Ubuntu username is not `thana`:
- `User=thana`
- `Environment=HOME=/home/thana`
- `Environment=PATH=/home/thana/.npm-global/bin:...`

Reload and enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cmc-author-dashboard-web
sudo systemctl enable cmc-author-dashboard-worker
sudo systemctl enable cmc-author-dashboard-flow-image-worker
sudo systemctl start cmc-author-dashboard-web
sudo systemctl start cmc-author-dashboard-worker
sudo systemctl start cmc-author-dashboard-flow-image-worker
```

Check status:

```bash
sudo systemctl status cmc-author-dashboard-web
sudo systemctl status cmc-author-dashboard-worker
sudo systemctl status cmc-author-dashboard-flow-image-worker
```

Tail logs:

```bash
journalctl -u cmc-author-dashboard-web -f
journalctl -u cmc-author-dashboard-worker -f
journalctl -u cmc-author-dashboard-flow-image-worker -f
```

If you do not want featured images from Flow, leave `FLOW_IMAGE_WORKER_URL` empty and do not start the Flow worker service.

## 15. Update the App Later

```bash
cd /opt/cmc-author-dashboard
git pull
npm install
npx prisma migrate deploy
npm run build
sudo systemctl restart cmc-author-dashboard-web
sudo systemctl restart cmc-author-dashboard-worker
sudo systemctl restart cmc-author-dashboard-flow-image-worker
```

## 16. Common Failure Points

### Worker cannot find Codex

Set the correct binary path in `.env`:

```dotenv
CODEX_BIN="/usr/bin/codex"
```

Or check:

```bash
which codex
```

### Worker fails because Codex is not authenticated

Run:

```bash
codex login
```

Again, do it as the same user that runs the worker service.

### Worker fails because the skill is missing

Check:

```bash
ls ~/.codex/skills/top-cmc-writer/SKILL.md
```

### Flow image worker fails because Chromium is missing

Run:

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium
```

### Flow image worker fails because storage state is missing

Check:

```bash
ls -la /opt/cmc-author-dashboard/.secrets/flow-storage-state.json
```

If the file is missing or stale, re-run:

```bash
npm run flow-save-session
```

### Flow image worker returns Google login page or unauthorized Flow UI

Your saved Google session is stale. Recreate the storage state and restart the service:

```bash
npm run flow-save-session
sudo systemctl restart cmc-author-dashboard-flow-image-worker
```

### Flow image worker service is not needed

If you only want article publishing without Flow featured images:
- leave `FLOW_IMAGE_WORKER_URL` blank
- do not enable the `cmc-author-dashboard-flow-image-worker` systemd service

### Google Sheets private key breaks

Make sure the private key in `.env` preserves escaped newlines:

```dotenv
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### WordPress scheduled posts do not behave correctly

Check that the WordPress site timezone and cron behavior are healthy. The app sends:
- one post with `status=publish`
- three posts with `status=future` and `date_gmt`

If WordPress cron is unhealthy, future posts may not publish on time.
