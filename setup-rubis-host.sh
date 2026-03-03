#!/usr/bin/env bash
set -euo pipefail

HOST_ENTRY="127.0.0.1 rubis"
NGINX_SITE_PATH="/etc/nginx/sites-available/rubis"
NGINX_SITE_LINK="/etc/nginx/sites-enabled/rubis"

if ! grep -qE '^127\.0\.0\.1\s+rubis(\s|$)' /etc/hosts; then
  echo "[INFO] Ajout de l'alias local: $HOST_ENTRY"
  echo "$HOST_ENTRY" | sudo tee -a /etc/hosts >/dev/null
else
  echo "[OK] L'alias 'rubis' existe déjà dans /etc/hosts"
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "[INFO] Installation de Nginx (proxy local port 80 -> 5173)..."
  sudo apt-get update
  sudo apt-get install -y nginx
fi

echo "[INFO] Configuration du reverse proxy http://rubis -> http://127.0.0.1:5173"
sudo tee "$NGINX_SITE_PATH" >/dev/null <<'EOF'
server {
    listen 80;
    server_name rubis;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

if [[ ! -L "$NGINX_SITE_LINK" ]]; then
  sudo ln -sf "$NGINX_SITE_PATH" "$NGINX_SITE_LINK"
fi

if [[ -L /etc/nginx/sites-enabled/default ]]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t
sudo systemctl restart nginx

echo "[OK] Configuration terminée. Utilise maintenant: http://rubis"
echo "[INFO] Garde le serveur Rubis démarré (./restart-rubis.sh --background)"
