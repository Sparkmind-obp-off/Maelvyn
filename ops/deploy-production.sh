#!/usr/bin/env bash
# MAELVYN — Production Pages deployment (Wrangler CLI only).
#
# Why this script exists: `wrangler pages deploy` rejects `--config <custom-path>`
# ("Pages does not support custom paths for the Wrangler configuration file").
# Pages only reads a root `wrangler.jsonc`. So we temporarily stage the Production
# configuration as the root config, deploy, and always restore the Development
# configuration — including on failure or interrupt.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="maelvyn-production"
BRANCH="${1:-main}"
ROOT_CONFIG="wrangler.jsonc"
PROD_CONFIG="wrangler.production.jsonc"
BACKUP="$(mktemp)"
DEPLOYED=0

if [ ! -f "$PROD_CONFIG" ]; then echo "missing $PROD_CONFIG" >&2; exit 1; fi

# Fail fast: never deploy a config that points at Development resources.
if grep -Eq 'maelvyn-dev|ad21e923|accounts\.dev|pk_test' "$PROD_CONFIG"; then
  echo "REFUSING: $PROD_CONFIG references Development resources" >&2
  exit 1
fi

restore() {
  if [ "$DEPLOYED" = "1" ]; then
    cp "$BACKUP" "$ROOT_CONFIG"
    rm -f "$BACKUP"
    echo "restored Development $ROOT_CONFIG"
  fi
}
trap restore EXIT INT TERM

cp "$ROOT_CONFIG" "$BACKUP"
cp "$PROD_CONFIG" "$ROOT_CONFIG"
DEPLOYED=1

echo "== deploying $PROJECT (branch $BRANCH) with Production configuration"
npx wrangler pages deploy dist --project-name "$PROJECT" --branch "$BRANCH"
