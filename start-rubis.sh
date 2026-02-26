#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "   Rubis - Start Ollama + Application (WSL2/Linux)"
echo "================================================"
echo

windows_models="/mnt/c/Users/${USER}/.ollama/models"
if [[ -d "$windows_models" ]]; then
  if [[ -z "${OLLAMA_MODELS:-}" ]]; then
    export OLLAMA_MODELS="$windows_models"
    echo "[INFO] Reusing Ollama models from Windows: $OLLAMA_MODELS"
  fi
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "[ERROR] Ollama not found"
  echo "Run first: ./install-ollama.sh"
  exit 1
fi

echo "[OK] Ollama detected: $(ollama --version)"

if ! ollama list 2>/dev/null | grep -q "mistral"; then
  echo "[WARNING] mistral not found; run ./setup-ollama.sh to download it"
fi

echo
echo "[Checking] Ollama service..."
if curl -fsS "http://localhost:11434/api/tags" >/dev/null 2>&1; then
  echo "[OK] Ollama already running"
else
  echo "[Starting] Ollama in background (logs: /tmp/ollama.log)"
  nohup ollama serve >/tmp/ollama.log 2>&1 &
  sleep 3
  if curl -fsS "http://localhost:11434/api/tags" >/dev/null 2>&1; then
    echo "[OK] Ollama started"
  else
    echo "[WARNING] Could not confirm Ollama startup, continuing anyway"
  fi
fi

echo
if [[ ! -d node_modules ]]; then
  echo "[Installing] npm dependencies..."
  npm install
else
  echo "[OK] Dependencies already installed"
fi

echo
echo "[Starting] Rubis dev server"
echo "Open: http://localhost:5173"
exec npm run dev
