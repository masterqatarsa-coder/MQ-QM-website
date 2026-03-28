#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-10000}"
APACHE_PORTS_CONF="/etc/apache2/ports.conf"
APACHE_SITE_CONF="/etc/apache2/sites-available/000-default.conf"

if grep -q "Listen 80" "$APACHE_PORTS_CONF"; then
  sed -ri "s/Listen 80/Listen ${PORT}/" "$APACHE_PORTS_CONF"
fi

if grep -q "<VirtualHost \\*:80>" "$APACHE_SITE_CONF"; then
  sed -ri "s/<VirtualHost \\*:80>/<VirtualHost *:${PORT}>/" "$APACHE_SITE_CONF"
fi

mkdir -p /var/www/html/data/uploads/resumes
chown -R www-data:www-data /var/www/html/data

exec apache2-foreground
