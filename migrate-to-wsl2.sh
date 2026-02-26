#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-$(pwd)}"
TARGET_DIR="${2:-$HOME/Rubis}"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "[ERROR] Source directory not found: $SOURCE_DIR"
  exit 1
fi

SOURCE_DIR="$(cd "$SOURCE_DIR" && pwd)"
TARGET_DIR="${TARGET_DIR/#\~/$HOME}"
mkdir -p "$TARGET_DIR"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

if [[ "$SOURCE_DIR" == "$TARGET_DIR" ]]; then
  echo "[ERROR] Source and target are identical: $SOURCE_DIR"
  exit 1
fi

echo "[INFO] Source: $SOURCE_DIR"
echo "[INFO] Target: $TARGET_DIR"
echo "[INFO] Copying project to Linux filesystem..."

tar \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=.turbo \
  -C "$SOURCE_DIR" -cf - . | tar -C "$TARGET_DIR" -xf -

cd "$TARGET_DIR"

chmod +x ./*.sh 2>/dev/null || true

if command -v dos2unix >/dev/null 2>&1; then
  dos2unix ./*.sh >/dev/null 2>&1 || true
else
  sed -i 's/\r$//' ./*.sh 2>/dev/null || true
fi

echo "[INFO] Installing npm dependencies..."
npm install

echo
echo "[OK] Migration complete"
echo "[NEXT] cd $TARGET_DIR"
echo "[NEXT] ./install-ollama.sh"
echo "[NEXT] ./start-rubis.sh"
