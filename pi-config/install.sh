#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PI_AGENT_DIR="${PI_AGENT_DIR:-$HOME/.pi/agent}"
EXT_DIR="$PI_AGENT_DIR/extensions"
THEME_DIR="$PI_AGENT_DIR/themes"
BACKUP_DIR="$PI_AGENT_DIR/lucid-backups/$(date +%Y%m%d-%H%M%S)"

mkdir -p "$EXT_DIR" "$THEME_DIR"

backup_if_needed() {
  local dest="$1"
  local src="$2"

  if [ -L "$dest" ]; then
    local current
    current="$(readlink "$dest")"
    if [ "$current" = "$src" ]; then
      rm "$dest"
      return 0
    fi
    mkdir -p "$BACKUP_DIR"
    mv "$dest" "$BACKUP_DIR/$(basename "$dest")"
    return 0
  fi

  if [ -e "$dest" ]; then
    mkdir -p "$BACKUP_DIR"
    mv "$dest" "$BACKUP_DIR/$(basename "$dest")"
  fi
}

link_resource() {
  local src="$1"
  local dest="$2"
  backup_if_needed "$dest" "$src"
  ln -s "$src" "$dest"
  printf 'linked %s -> %s\n' "$dest" "$src"
}

link_resource "$ROOT/extensions/catppuccin-spinner.ts" "$EXT_DIR/catppuccin-spinner.ts"
link_resource "$ROOT/extensions/delta-edit-diff.ts" "$EXT_DIR/delta-edit-diff.ts"
link_resource "$ROOT/extensions/lucid-agent-radar.ts" "$EXT_DIR/lucid-agent-radar.ts"
link_resource "$ROOT/extensions/lucid-tool-cards.ts" "$EXT_DIR/lucid-tool-cards.ts"
link_resource "$ROOT/extensions/session-banner" "$EXT_DIR/session-banner"
link_resource "$ROOT/extensions/shopify-footer.ts" "$EXT_DIR/shopify-footer.ts"
link_resource "$ROOT/extensions/vim-mode" "$EXT_DIR/vim-mode"
link_resource "$ROOT/themes/catppuccin-mocha.json" "$THEME_DIR/catppuccin-mocha.json"

SETTINGS="$PI_AGENT_DIR/settings.json"
mkdir -p "$(dirname "$SETTINGS")"
if [ ! -f "$SETTINGS" ]; then
  printf '{}\n' > "$SETTINGS"
fi

python3 - "$SETTINGS" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
try:
    data = json.loads(path.read_text())
except json.JSONDecodeError:
    backup = path.with_suffix(path.suffix + ".lucid-backup")
    backup.write_text(path.read_text())
    data = {}

data["theme"] = "catppuccin-mocha"
markdown = data.setdefault("markdown", {})
markdown["codeBlockIndent"] = "  │ "

path.write_text(json.dumps(data, indent=2) + "\n")
PY

if [ -d "$BACKUP_DIR" ]; then
  printf '\nBacked up replaced resources to %s\n' "$BACKUP_DIR"
fi

printf '\nLucid Pi config installed. Open Pi and run /reload.\n'
