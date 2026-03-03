#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "================================================"
echo "   Rubis - Restart API + Web"
echo "================================================"
echo

kill_port_process() {
  local port="$1"
  local pids
  pids="$(ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p {print $NF}' | sed -E 's/.*pid=([0-9]+).*/\1/' | sort -u | tr '\n' ' ')"

  if [[ -z "${pids// }" ]]; then
    return 0
  fi

  echo "[Stopping] Port ${port} used by PID(s): $pids"
  kill $pids 2>/dev/null || true
  sleep 1

  for pid in $pids; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}

echo "[1/3] Stopping existing API/Web processes"
kill_port_process 4000
kill_port_process 5173
pkill -f "npm run dev -w @rubis/api|npm run dev -w @rubis/web|tsx watch src/server.ts|vite" 2>/dev/null || true

echo "[2/3] Starting stack"
if [[ "${1:-}" == "--background" ]]; then
  nohup "$ROOT_DIR/start-rubis.sh" >/tmp/rubis-restart.log 2>&1 &
  sleep 5
  echo "[OK] Started in background (log: /tmp/rubis-restart.log)"
else
  exec "$ROOT_DIR/start-rubis.sh"
fi

echo "[3/3] Health checks"
curl -fsS http://127.0.0.1:4000/health >/dev/null && echo "[OK] API up on :4000" || echo "[WARN] API not reachable yet"
curl -I -fsS http://127.0.0.1:5173 >/dev/null && echo "[OK] Web up on :5173" || echo "[WARN] Web not reachable yet"
