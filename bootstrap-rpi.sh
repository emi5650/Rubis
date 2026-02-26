#!/usr/bin/env bash
set -euo pipefail

INSTALL_OLLAMA=true
MODEL_NAME="${OLLAMA_MODEL:-mistral:7b-q4_0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-ollama)
      INSTALL_OLLAMA=false
      shift
      ;;
    --model)
      MODEL_NAME="${2:-}"
      if [[ -z "$MODEL_NAME" ]]; then
        echo "[ERROR] Missing value for --model"
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "[ERROR] Unknown option: $1"
      echo "Usage: ./bootstrap-rpi.sh [--no-ollama] [--model <model-name>]"
      exit 1
      ;;
  esac
done

echo "================================================"
echo "   Rubis Bootstrap - Raspberry Pi"
echo "================================================"

aarch="$(uname -m)"
if [[ "$aarch" != "aarch64" && "$aarch" != "armv7l" ]]; then
  echo "[WARNING] Architecture detected: $aarch"
  echo "This script is intended for Raspberry Pi (ARM). Continuing..."
fi

if ! command -v sudo >/dev/null 2>&1; then
  echo "[ERROR] sudo is required"
  exit 1
fi

echo "[INFO] Updating apt repositories..."
sudo apt-get update

echo "[INFO] Installing base dependencies..."
sudo apt-get install -y curl ca-certificates git build-essential

if ! command -v node >/dev/null 2>&1; then
  echo "[INFO] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[OK] Node already installed: $(node -v)"
fi

echo "[INFO] npm version: $(npm -v)"

if [[ ! -d node_modules ]]; then
  echo "[INFO] Installing npm dependencies for Rubis..."
  npm install
else
  echo "[OK] node_modules already present"
fi

if [[ "$INSTALL_OLLAMA" == "true" ]]; then
  if ! command -v ollama >/dev/null 2>&1; then
    echo "[INFO] Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
  else
    echo "[OK] Ollama already installed: $(ollama --version)"
  fi

  if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "[INFO] Starting Ollama service in background..."
    nohup ollama serve >/tmp/ollama.log 2>&1 &
    sleep 3
  fi

  echo "[INFO] Pulling model: $MODEL_NAME"
  ollama pull "$MODEL_NAME"

  if [[ ! -f apps/api/.env ]]; then
    cat > apps/api/.env <<EOF
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=$MODEL_NAME
API_PORT=4000
EOF
    echo "[OK] Created apps/api/.env"
  else
    echo "[OK] apps/api/.env already exists"
  fi
fi

echo
echo "[OK] Raspberry Pi bootstrap complete"
echo "[NEXT] Run: npm run dev"
echo "[NEXT] Open: http://<RPI_IP>:5173"
