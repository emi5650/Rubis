#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "   Ollama Installer (WSL2/Linux)"
echo "================================================"
echo

if command -v ollama >/dev/null 2>&1; then
  echo "[OK] Ollama already installed: $(ollama --version)"
else
  echo "[Installing] Ollama via official installer script..."
  if ! command -v curl >/dev/null 2>&1; then
    echo "[ERROR] curl is required. Install it first (e.g. sudo apt-get install -y curl)."
    exit 1
  fi
  curl -fsSL https://ollama.com/install.sh | sh
  echo "[OK] Ollama installation completed"
fi

echo
echo "[Next] Running setup-ollama.sh..."
"$(dirname "$0")/setup-ollama.sh"
