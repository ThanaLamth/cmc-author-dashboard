# Deploy on Ubuntu

This app runs as two processes:
- `web`: Next.js server
- `worker`: background craft/publish runner

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
```

## 6. Run Prisma Migration

```bash
npx prisma migrate deploy
```

## 7. Build the App

```bash
npm run build
```

## 8. Install Codex

If `codex` is not already installed:

```bash
npm install -g @openai/codex
codex --version
```

If your environment uses a different installation method, make sure the final binary path matches `CODEX_BIN` in `.env`.

## 9. Login to Codex

Run this as the same Linux user that will run the worker:

```bash
codex login
```

Verify it works:

```bash
codex exec --skip-git-repo-check --ephemeral "Reply with the word OK"
```

## 10. Install the Runtime Skill

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

## 11. Test the App Manually

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

Open:

```text
http://YOUR_SERVER_IP:3000
```

If that works, move on to `systemd`.

## 12. Install systemd Services

Copy the service files:

```bash
sudo cp deploy/systemd/cmc-author-dashboard-web.service /etc/systemd/system/
sudo cp deploy/systemd/cmc-author-dashboard-worker.service /etc/systemd/system/
```

Before starting them, open both files and adjust these lines if your Ubuntu username is not `thana`:
- `User=thana`
- `Environment=HOME=/home/thana`
- `Environment=PATH=/home/thana/.npm-global/bin:...`

Reload and enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cmc-author-dashboard-web
sudo systemctl enable cmc-author-dashboard-worker
sudo systemctl start cmc-author-dashboard-web
sudo systemctl start cmc-author-dashboard-worker
```

Check status:

```bash
sudo systemctl status cmc-author-dashboard-web
sudo systemctl status cmc-author-dashboard-worker
```

Tail logs:

```bash
journalctl -u cmc-author-dashboard-web -f
journalctl -u cmc-author-dashboard-worker -f
```

## 13. Update the App Later

```bash
cd /opt/cmc-author-dashboard
git pull
npm install
npx prisma migrate deploy
npm run build
sudo systemctl restart cmc-author-dashboard-web
sudo systemctl restart cmc-author-dashboard-worker
```

## 14. Common Failure Points

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
