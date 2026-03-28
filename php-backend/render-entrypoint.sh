#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-10000}"

mkdir -p /var/www/html/data/uploads/resumes
chown -R www-data:www-data /var/www/html/data

exec php -S "0.0.0.0:${PORT}" -t /var/www/html /var/www/html/router.php
