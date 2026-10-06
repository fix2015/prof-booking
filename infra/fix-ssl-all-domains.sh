#!/usr/bin/env bash
# Issue/renew Let's Encrypt certificates for every probooking.app host served by this nginx
# and wire them into the server blocks. Safe to re-run.
#
#   ssh probooking
#   curl -fsSL https://raw.githubusercontent.com/fix2015/prof-booking/main/infra/fix-ssl-all-domains.sh -o fix-ssl.sh   # or scp it
#   sudo bash fix-ssl.sh you@example.com
set -euo pipefail

EMAIL="${1:-}"
DOMAINS=(probooking.app www.probooking.app calories.probooking.app dreampick-tv.probooking.app)
SERVER_IP="$(curl -s https://checkip.amazonaws.com || true)"

[[ $EUID -eq 0 ]] || { echo "Run with sudo"; exit 1; }
[[ -n "$EMAIL" ]] || { echo "Usage: sudo bash $0 your@email.com"; exit 1; }

echo "==> Server public IP: ${SERVER_IP:-unknown}"
echo "==> Checking DNS for each domain"
for d in "${DOMAINS[@]}"; do
  ip="$(dig +short "$d" | tail -n1 || true)"
  printf '   %-32s -> %s' "$d" "${ip:-NO RECORD}"
  [[ "$ip" == "$SERVER_IP" ]] && echo "  OK" || echo "  <-- must be an A record to $SERVER_IP (fix in your DNS provider first)"
done

echo "==> Installing certbot if missing"
command -v certbot >/dev/null || { apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx; }

echo "==> Making sure every site has a server block enabled"
for site in calories.probooking.app dreampick-tv.probooking.app; do
  if [[ ! -e /etc/nginx/sites-enabled/$site ]]; then
    echo "   $site not enabled in nginx - looking for its snippet"
    src="$(ls /var/www/*/infra/nginx-snippet.conf 2>/dev/null | xargs grep -l "server_name $site" 2>/dev/null | head -n1 || true)"
    [[ -n "$src" ]] || { echo "   !! no nginx snippet found for $site - copy infra/nginx-snippet.conf from its repo to /etc/nginx/sites-available/$site"; continue; }
    cp "$src" /etc/nginx/sites-available/$site
    ln -sf /etc/nginx/sites-available/$site /etc/nginx/sites-enabled/$site
    echo "   enabled from $src"
  fi
done

# A "listen 443 ssl" block with no certificate makes nginx fail or serve the wrong cert.
# Temporarily point such blocks at the existing probooking.app cert so nginx starts; certbot replaces it.
for f in /etc/nginx/sites-enabled/*; do
  if grep -q "listen 443" "$f" && ! grep -qE '^\s*ssl_certificate\s' "$f"; then
    echo "   adding temporary certificate to $f"
    sed -i 's|^\(\s*\)# ssl_certificate .*|\1ssl_certificate /etc/letsencrypt/live/probooking.app/fullchain.pem;|; s|^\(\s*\)# ssl_certificate_key .*|\1ssl_certificate_key /etc/letsencrypt/live/probooking.app/privkey.pem;|' "$f"
  fi
done
nginx -t && systemctl reload nginx

echo "==> Requesting one certificate covering all domains (expands the existing one)"
certbot --nginx --non-interactive --agree-tos --redirect --expand -m "$EMAIL" \
  $(printf -- '-d %s ' "${DOMAINS[@]}")

nginx -t && systemctl reload nginx
echo "==> Auto-renewal check"
certbot renew --dry-run --quiet && echo "   renewal OK (systemd timer: $(systemctl is-active certbot.timer 2>/dev/null || echo 'not found'))"

echo "==> Verifying"
for d in "${DOMAINS[@]}"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$d/" || echo ERR)"
  echo "   https://$d -> HTTP $code"
done
echo "Done. Hard-refresh the browser (Cmd+Shift+R) if it still shows the old error."
