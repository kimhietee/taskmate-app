# Stage 1: Build PHP vendor dependencies + Vite/Wayfinder frontend assets
FROM node:22-bookworm-slim AS node_base
FROM composer:2 AS composer_bin

FROM php:8.4-cli-bookworm AS builder

WORKDIR /app

# Install system dependencies required by Composer and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libicu-dev \
    libpq-dev \
    libsqlite3-dev \
    libzip-dev \
    && docker-php-ext-install -j"$(nproc)" bcmath intl pdo_mysql pdo_pgsql pdo_sqlite zip \
    && rm -rf /var/lib/apt/lists/*

# Bring in Composer and Node.js 22 (required together because @laravel/vite-plugin-wayfinder invokes php artisan)
COPY --from=composer_bin /usr/bin/composer /usr/bin/composer
COPY --from=node_base /usr/local/bin/node /usr/local/bin/node
COPY --from=node_base /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install production PHP dependencies first for better Docker layer caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Copy application source
COPY . .

# Prepare Laravel directories and run package discovery
RUN mkdir -p \
    storage/app/private/evidence \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && cp .env.example .env \
    && php artisan key:generate --ansi \
    && php artisan package:discover --ansi

# Install Node dependencies for Linux x64 and build production assets (includes Wayfinder generation)
RUN npm install --no-audit --no-fund \
    && npx vp build \
    && rm -f .env

# Stage 2: Lean production PHP 8.4 + Apache runtime
FROM php:8.4-apache-bookworm AS runtime

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
    libicu-dev \
    libpq-dev \
    libsqlite3-dev \
    libzip-dev \
    && docker-php-ext-install -j"$(nproc)" bcmath intl opcache pdo_mysql pdo_pgsql pdo_sqlite zip \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Configure PHP OPcache and upload limits for production
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=10000'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'upload_max_filesize=10M'; \
        echo 'post_max_size=12M'; \
    } > /usr/local/etc/php/conf.d/taskmate.ini

RUN echo 'ServerName localhost' > /etc/apache2/conf-available/servername.conf \
    && a2enconf servername

COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf

# Copy application code, vendor/, and compiled public/build assets (without node_modules)
COPY --from=builder /app/app ./app
COPY --from=builder /app/bootstrap ./bootstrap
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/public ./public
COPY --from=builder /app/resources ./resources
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/storage ./storage
COPY --from=builder /app/vendor ./vendor
COPY --from=builder /app/artisan ./artisan
COPY --from=builder /app/composer.json ./composer.json

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
