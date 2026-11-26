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

# Refresh caches with live runtime environment variables and apply migrations
php artisan config:clear --no-interaction
php artisan storage:link --quiet || true
php artisan migrate --force --no-interaction
php artisan optimize --no-interaction

# Keep newly created cache/log files writable by Apache's www-data user
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec apache2-foreground
