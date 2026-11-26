#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

# Update Apache listen port dynamically for Render, Railway, Fly.io, etc.
sed -ri "s/Listen [0-9]+/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Ensure runtime writable directories exist
mkdir -p \
    /var/www/html/storage/app/private/evidence \
    /var/www/html/storage/app/public \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

# Initialize SQLite database file if SQLite is configured
if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    SQLITE_PATH="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    mkdir -p "$(dirname "${SQLITE_PATH}")"
    if [ ! -f "${SQLITE_PATH}" ]; then
        touch "${SQLITE_PATH}"
    fi
    chown www-data:www-data "${SQLITE_PATH}"
    chmod 664 "${SQLITE_PATH}"
fi

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

if [ -z "${APP_KEY:-}" ]; then
    echo "ERROR: APP_KEY is not set. Generate one locally with 'php artisan key:generate --show' and add it to your host environment variables." >&2
    exit 1
fi

# On Render, prevent stale *.onrender.com APP_URL / ASSET_URL values from breaking same-origin Vite assets
RENDER_URL="${RENDER_EXTERNAL_URL:-}"
if [ -z "${RENDER_URL}" ] && [ -n "${RENDER_EXTERNAL_HOSTNAME:-}" ]; then
    RENDER_URL="https://${RENDER_EXTERNAL_HOSTNAME}"
fi
RENDER_URL="${RENDER_URL%/}"

if [ -n "${RENDER_URL}" ]; then
    APP_URL_CLEAN="${APP_URL:-}"
    APP_URL_CLEAN="${APP_URL_CLEAN%/}"
    ASSET_URL_CLEAN="${ASSET_URL:-}"
    ASSET_URL_CLEAN="${ASSET_URL_CLEAN%/}"

    if [ -z "${APP_URL_CLEAN}" ] || [[ "${APP_URL_CLEAN}" == *".onrender.com"* && "${APP_URL_CLEAN}" != "${RENDER_URL}" ]]; then
        export APP_URL="${RENDER_URL}"
    fi

    if [[ "${ASSET_URL_CLEAN}" == *".onrender.com"* ]]; then
        unset ASSET_URL
    fi
fi

echo "TaskMate boot: APP_URL=${APP_URL:-unset} ASSET_URL=${ASSET_URL:-unset}"

# Refresh caches with live runtime environment variables and apply migrations
php artisan config:clear --no-interaction
php artisan storage:link --quiet || true
php artisan migrate --force --no-interaction

# Optional admin bootstrap via the official Artisan command for hosts without an interactive shell (e.g. Render Free)
if [ -n "${TASKMATE_ADMIN_EMAIL:-}" ]; then
    IFS=',' read -ra ADMIN_EMAILS <<< "${TASKMATE_ADMIN_EMAIL}"
    for RAW_ADMIN_EMAIL in "${ADMIN_EMAILS[@]}"; do
        TRIMMED_ADMIN_EMAIL="$(printf '%s' "${RAW_ADMIN_EMAIL}" | xargs)"
        if [ -n "${TRIMMED_ADMIN_EMAIL}" ]; then
            php artisan taskmate:make-admin "${TRIMMED_ADMIN_EMAIL}" --no-interaction || true
        fi
    done
fi

# Seed beta sample accounts and approved campus tasks unless explicitly disabled
if [ "${TASKMATE_SEED_BETA_DATA:-true}" != "false" ]; then
    php artisan db:seed --class=BetaSampleDataSeeder --force --no-interaction
fi

php artisan optimize --no-interaction

# Keep newly created cache/log files writable by Apache's www-data user
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec apache2-foreground
