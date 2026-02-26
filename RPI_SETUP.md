# Rubis sur Raspberry Pi (RPi 4/5)

## Compatibilité

Rubis fonctionne sur Raspberry Pi OS 64-bit.

Recommandé:
- Raspberry Pi 5 (8GB) ou Raspberry Pi 4 (8GB)
- Raspberry Pi OS 64-bit
- SSD/NVMe (ou carte SD rapide)

Minimum:
- Pi 4 4GB (fonctionne, mais IA locale plus lente)

## 1) Cloner le projet sur le Pi

```bash
git clone <URL_DU_REPO> Rubis
cd Rubis
```

## 2) Bootstrap automatique (Node + deps + Ollama)

```bash
chmod +x bootstrap-rpi.sh
./bootstrap-rpi.sh
```

Options:
- Sans Ollama: `./bootstrap-rpi.sh --no-ollama`
- Modèle spécifique: `./bootstrap-rpi.sh --model qwen2.5:3b`

## 3) Lancer Rubis

```bash
npm run dev
```

Accès navigateur:
- Local Pi: http://localhost:5173
- Depuis un autre poste: http://<IP_DU_PI>:5173

## Modèles Ollama conseillés sur Pi

- Rapide: `qwen2.5:1.5b`
- Équilibré: `qwen2.5:3b`
- Plus qualitatif (plus lent): `mistral:7b-q4_0`

Sur Pi 4, commencer par un modèle 1.5B/3B est recommandé.

## Exécuter Rubis au boot (optionnel)

Créer un service systemd (exemple):

```bash
sudo tee /etc/systemd/system/rubis.service >/dev/null <<'EOF'
[Unit]
Description=Rubis Dev Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Rubis
ExecStart=/usr/bin/npm run dev
Restart=always
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now rubis
sudo systemctl status rubis
```

## Troubleshooting

- Ports occupés: `ss -ltnp | grep -E '4000|5173|11434'`
- RAM insuffisante: utiliser un modèle plus petit (`1.5b`/`3b`)
- Température élevée: ajouter refroidissement actif et vérifier `vcgencmd measure_temp`
- Lenteur I/O: préférer SSD à carte SD
