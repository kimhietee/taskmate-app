# Deploying TaskMate for Beta Testing (24/7 Cloud Hosting)

This repository includes a production-ready [`Dockerfile`](../Dockerfile), startup script ([`docker/entrypoint.sh`](../docker/entrypoint.sh)), and [`render.yaml`](../render.yaml) Blueprint so you can host TaskMate online 24/7 for classmates and beta testers.

> **Important Privacy & Prototype Notice**
> Keep `TASKMATE_PROTOTYPE_MODE=true` for beta testing and remind testers to use **synthetic/test details** (never real payment transfers or real sensitive identity details). In `APP_ENV=production`, passwords must be **at least 12 characters** with mixed case, numbers, and symbols.

---

## Option A: Deploy to Render (Free Tier + Free PostgreSQL — Recommended)

1. **Push your latest code to GitHub.**
2. **Generate an `APP_KEY` locally** (copy the full `base64:...` string):
   ```powershell
   php artisan key:generate --show
   ```
3. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint** → connect your GitHub repository.
4. Render automatically detects `render.yaml` and creates:
   - **`taskmate-beta`** (PHP 8.4 + Apache + Vite production bundle, health check `/up`)
   - **`taskmate-db`** (managed PostgreSQL database — data persists across redeploys)
5. When prompted for unsynced environment variables:
   - **`APP_KEY`**: paste the `base64:...` key from Step 2.
   - **`APP_URL`**: set to your assigned Render URL (for example, `https://taskmate-beta.onrender.com`).
6. Wait for the build to finish (first build takes ~3–5 minutes). On boot, `docker/entrypoint.sh` automatically runs `php artisan migrate --force` and caches config/routes.

> **Free-tier sleep note:** Render's free web service spins down after 15 minutes of inactivity, so the first visit after idle takes ~30 seconds to wake up. Render's free PostgreSQL database expires after 30 days (export/move if you need longer).

---

## Option B: Deploy to Railway (Easy GitHub + PostgreSQL)

1. Push your latest code to GitHub.
2. Go to [Railway](https://railway.com/) → **New Project** → **Deploy from GitHub repo**.
3. Add a **PostgreSQL** service inside the same Railway project.
4. Set these environment variables on your TaskMate web service:
   - `APP_NAME=TaskMate`
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_KEY=base64:...` (from `php artisan key:generate --show`)
   - `APP_URL=https://your-app.up.railway.app`
   - `LOG_CHANNEL=stderr`
   - `DB_CONNECTION=pgsql`
   - `DB_URL=${{Postgres.DATABASE_URL}}`
   - `SESSION_DRIVER=database`
   - `SESSION_SECURE_COOKIE=true`
   - `CACHE_STORE=database`
   - `QUEUE_CONNECTION=sync`
   - `TASKMATE_PROTOTYPE_MODE=true`
   - `MAIL_MAILER=log` and `TASKMATE_PROTOTYPE_MAILBOX=true` *(or real SMTP below)*
5. Generate a public domain under **Settings → Networking → Generate Domain** (target port `8080`).

---

## Email Verification Codes for Beta Testers

You have two choices:

### 1. Zero-Setup Beta Mode (Simulated Gmail Tab)
- Set `MAIL_MAILER=log`, `TASKMATE_PROTOTYPE_MODE=true`, and `TASKMATE_PROTOTYPE_MAILBOX=true`.
- Testers click **Open Prototype Email Tab ↗** on `/email/verify` or `/verification/student` to copy their 6-digit code in a simulated inbox tab (scoped strictly to their signed-in account).

### 2. Real Inbox Delivery (Recommended Once Ready)
Set `TASKMATE_PROTOTYPE_MAILBOX=false` and configure a mail provider:
- **On Render Free tier:** Render blocks outbound SMTP ports (`25`, `465`, `587`), so use an **HTTPS email API** (port `443`) such as Brevo or Resend rather than standard SMTP.
- **On Paid Render / Railway / hosts that allow SMTP:** use standard SMTP (in Laravel 13, `MAIL_SCHEME` is `smtp` for port `587` or `smtps` for port `465`):

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=smtp
MAIL_USERNAME=your.test.sender@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_ADDRESS=your.test.sender@gmail.com
MAIL_FROM_NAME="TaskMate"
```

---

## Creating Your First Admin Account on the Cloud Host

1. Open your deployed site and register your own account at `/register` with a strong password (12+ chars, upper, lower, number, symbol).
2. Promote your registered account using the official `taskmate:make-admin` Artisan command:
   - **On Render Free (no web Shell):** In Render Dashboard → your web service → **Environment**, add `TASKMATE_ADMIN_EMAIL=your-admin-email@example.com` (supports comma-separated emails for multiple team admins) and save. On boot, `docker/entrypoint.sh` runs `php artisan taskmate:make-admin` automatically. Remove `TASKMATE_ADMIN_EMAIL` once your admin accounts are promoted.
   - **On hosts with a Shell / CLI (Paid Render or Railway):**
     ```bash
     php artisan taskmate:make-admin your-admin-email@example.com
     ```
3. Sign in at `/login` and visit `/admin` to review beta accounts and approve posted tasks.

> **Never reuse default local demo credentials (`password`) on a public URL.**
