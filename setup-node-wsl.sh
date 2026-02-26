#!/usr/bin/env bash
set -euo pipefail

ARCH="$(uname -m)"
if [ "$ARCH" = "x86_64" ]; then
  NODE_ARCH="x64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  NODE_ARCH="arm64"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

mkdir -p "$HOME/.local/node"
LATEST="$(curl -fsSL https://nodejs.org/dist/index.tab | grep '^v20\.' | head -n 1 | cut -f1)"
if [ -z "$LATEST" ]; then
  echo "Could not resolve latest Node 20 version"
  exit 1
fi

FILE="node-${LATEST}-linux-${NODE_ARCH}.tar.xz"
URL="https://nodejs.org/dist/${LATEST}/${FILE}"

curl -fsSL "$URL" -o "/tmp/${FILE}"
rm -rf "$HOME/.local/node/node-${LATEST}-linux-${NODE_ARCH}"
tar -xJf "/tmp/${FILE}" -C "$HOME/.local/node"
ln -sfn "$HOME/.local/node/node-${LATEST}-linux-${NODE_ARCH}" "$HOME/.local/node/current"

PROFILE_LINE='export PATH="$HOME/.local/node/current/bin:$PATH"'
if ! grep -Fq '.local/node/current/bin' "$HOME/.bashrc"; then
  printf '\n%s\n' "$PROFILE_LINE" >> "$HOME/.bashrc"
fi

export PATH="$HOME/.local/node/current/bin:$PATH"
node -v
npm -v
