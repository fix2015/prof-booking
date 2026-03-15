#!/bin/bash
# Run once on the server after DNS has propagated.
# Usage: sudo bash /var/www/prof-booking/infra/setup-ssl.sh

set -e
DOMAIN="probooking.app"
EMAIL="your@email.com"   # ← change this to your real email
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

echo "==> Installing nginx & certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Writing initial HTTP-only nginx config (needed for ACME challenge)..."
cp /var/www/prof-booking/infra/nginx.conf "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/"$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Obtaining Let's Encrypt certificate..."
certbot --nginx \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos \
  --email "$EMAIL" \
  --redirect

echo "==> Reloading nginx with SSL config..."
nginx -t && systemctl reload nginx

echo "==> Enabling auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "Done! Visit https://$DOMAIN"
