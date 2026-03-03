#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "   Rubis - Production Start (Ollama + API + Web)"
echo "================================================"
echo

windows_models="/mnt/c/Users/${USER}/.ollama/models"
if [[ -d "$windows_models" && -z "${OLLAMA_MODELS:-}" ]]; then
  export OLLAMA_MODELS="$windows_models"
  echo "[INFO] Reusing Ollama models from Windows: $OLLAMA_MODELS"
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
rebuild_on_start="${REBUILD_ON_START:-0}"
rebuild_mode="${rebuild_on_start,,}"
build_marker=".cache/rubis/last-successful-build-rev"
build_marker_time=".cache/rubis/last-successful-build-at"
current_rev=""
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  current_rev="$(git rev-parse HEAD 2>/dev/null || true)"
fi

needs_rebuild=0
rebuild_reason=""
skip_reason=""

if [[ "$rebuild_mode" == "1" || "$rebuild_mode" == "true" || "$rebuild_mode" == "yes" ]]; then
  needs_rebuild=1
  rebuild_reason="REBUILD_ON_START forced"
elif [[ "$rebuild_mode" == "auto" ]]; then
  if [[ ! -f apps/api/dist/server.js || ! -f apps/web/dist/index.html ]]; then
    needs_rebuild=1
    rebuild_reason="production artifacts missing"
  elif [[ -n "$current_rev" ]]; then
    last_rev=""
    if [[ -f "$build_marker" ]]; then
      last_rev="$(cat "$build_marker" 2>/dev/null || true)"
    fi

    if [[ "$last_rev" != "$current_rev" ]]; then
      needs_rebuild=1
      rebuild_reason="git revision changed"
    else
      short_rev="${current_rev:0:12}"
      skip_reason="same git revision (${short_rev})"
    fi
  else
    skip_reason="git revision unavailable"
  fi
elif [[ ! -f apps/api/dist/server.js || ! -f apps/web/dist/index.html ]]; then
  needs_rebuild=1
  rebuild_reason="production artifacts missing"
fi

if [[ "$needs_rebuild" == "1" ]]; then
  echo "[Building] $rebuild_reason, rebuilding API + Web"
  npm run build -w @rubis/api
  npm run build -w @rubis/web

  build_time="$(date -Iseconds)"
  if [[ -n "$current_rev" ]]; then
    mkdir -p "$(dirname "$build_marker")"
    printf "%s" "$current_rev" > "$build_marker"
  fi
  mkdir -p "$(dirname "$build_marker_time")"
  printf "%s" "$build_time" > "$build_marker_time"
else
  last_build_time=""
  if [[ -f "$build_marker_time" ]]; then
    last_build_time="$(cat "$build_marker_time" 2>/dev/null || true)"
  elif [[ -f "apps/web/dist/index.html" ]]; then
    last_build_time="$(date -Iseconds -r "apps/web/dist/index.html" 2>/dev/null || true)"
  fi

  if [[ -n "$skip_reason" ]]; then
    if [[ -n "$last_build_time" ]]; then
      echo "[OK] No rebuild required ($skip_reason, last build: $last_build_time)"
    else
      echo "[OK] No rebuild required ($skip_reason)"
    fi
  else
    if [[ -n "$last_build_time" ]]; then
      echo "[OK] No rebuild required (last build: $last_build_time)"
    else
      echo "[OK] No rebuild required"
    fi
  fi
fi

echo
echo "[Starting] API on :4000 (node apps/api/dist/server.js)"
node apps/api/dist/server.js &
api_pid=$!

echo "[Starting] Web preview on :5173 (Vite preview static build)"
npm run preview -w @rubis/web -- --host 0.0.0.0 --port 5173 --strictPort &
web_pid=$!

cleanup() {
  echo
  echo "[Stopping] Shutting down Rubis production processes"
  kill "$api_pid" "$web_pid" >/dev/null 2>&1 || true
}

trap cleanup EXIT SIGINT SIGTERM

set +e
wait -n "$api_pid" "$web_pid"
exit_code=$?
set -e

wait || true
exit "$exit_code"
