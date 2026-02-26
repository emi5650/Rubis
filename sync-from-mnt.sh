#!/usr/bin/env bash
set -euo pipefail

SRC="${SRC:-/mnt/c/VS_Code/Rubis/}"
DST="${DST:-/home/ermichel/Rubis/}"
MODE="apply"
DELETE_FLAG=""

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      MODE="dry"
      ;;
    --delete)
      DELETE_FLAG="--delete"
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--dry-run] [--delete]"
      exit 1
      ;;
  esac
done

if [[ ! -d "$SRC" ]]; then
  echo "Source not found: $SRC"
  exit 1
fi

if [[ ! -d "$DST" ]]; then
  echo "Destination not found: $DST"
  exit 1
fi

RSYNC_ARGS=(
  -r
  --checksum
  --human-readable
  --no-perms
  --no-owner
  --no-group
  --omit-dir-times
  --exclude=.git/
  --exclude=node_modules/
  --exclude=.turbo/
  --exclude=dist/
  --exclude=build/
)

if [[ "$MODE" == "dry" ]]; then
  RSYNC_ARGS+=(--dry-run --itemize-changes)
fi

if [[ -n "$DELETE_FLAG" ]]; then
  RSYNC_ARGS+=(--delete)
fi

echo "Syncing from $SRC to $DST"
echo "Mode: $MODE ${DELETE_FLAG:+(with delete)}"

rsync "${RSYNC_ARGS[@]}" "$SRC" "$DST"

echo "Sync complete."
