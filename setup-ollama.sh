#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "   Rubis - Ollama Setup (WSL2/Linux)"
echo "   (Mistral - Local AI, 100% Offline)"
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
  echo "Install it first with: ./install-ollama.sh"
  exit 1
fi

echo "[OK] Ollama detected: $(ollama --version)"
echo

free_gb="$(df -BG . | awk 'NR==2 {gsub(/G/,"",$4); print $4}')"
if [[ -z "${free_gb}" ]]; then
  echo "[WARNING] Could not determine free disk space"
else
  echo "[INFO] Free space: ${free_gb} GB"
  if (( free_gb < 5 )); then
    echo "[ERROR] Insufficient space (need 5GB minimum)"
    exit 1
  fi
fi

echo
echo "[Downloading] mistral (first time can take 15-30 min)..."
ollama pull mistral
echo "[OK] Mistral model ready"

env_file="apps/api/.env"
if [[ ! -f "$env_file" ]]; then
  cat > "$env_file" <<'EOF'
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
API_PORT=4000
EOF
  echo "[OK] Created apps/api/.env"
else
  echo "[OK] apps/api/.env already exists"
fi

echo
echo "================================================"
echo "   Setup Complete"
echo "================================================"
echo "Next:"
echo "  1) ./start-rubis.sh"
echo "  2) Open http://localhost:5173"
