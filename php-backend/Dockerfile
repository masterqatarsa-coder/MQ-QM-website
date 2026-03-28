FROM php:8.3-apache

WORKDIR /var/www/html

RUN a2dismod mpm_event mpm_worker 2>/dev/null || true \
    && a2enmod rewrite headers expires

COPY render-php.ini /usr/local/etc/php/conf.d/render.ini
COPY . /var/www/html

RUN mkdir -p /var/www/html/data/uploads/resumes \
    && chmod +x /var/www/html/render-entrypoint.sh \
    && chown -R www-data:www-data /var/www/html

ENV PORT=10000

EXPOSE 10000

CMD ["/var/www/html/render-entrypoint.sh"]
