# Pi config

Lucid Mode: a personal Pi setup kit with Catppuccin Mocha, Starship-inspired chrome, Vim prompt editing, richer diffs, and playful status effects.

## What this installs

- Catppuccin Mocha Pi theme.
- Catppuccin animated working spinner.
- Local Vim mode with:
  - no `jk` escape mapping;
  - normal/visual direct `j` / `k` reserved as no-ops;
  - insert-mode rainbow prompt text.
- Starship-flavoured footer using `~/.config/starship.toml`.
- Footer with Starship on the first line and Pi metrics on the second line.
- Hidden visual session banner while keeping `/title`, terminal title, and session naming.
- Delta side-by-side edit diffs.
- Lucid tool cards for common built-in tools.
- Lucid agent activity radar in the footer meta line.
- Markdown/code block polish via Catppuccin theme colors and a code gutter indent.

## Ideas backlog

- Rainbow sparkle effect for all highlighted text across Pi, not just the insert prompt.
  - Target highlights: markdown inline code, links, bullets, file paths, selected/highlighted terms, and other accent text.
  - Note: full animated transcript-wide highlighting likely needs a Pi renderer/theme hook; keep this as a follow-up unless Pi exposes one.
- Fullscreen latest-diff viewer with `delta`.
- Session cockpit overlay (`:PiStatus`) for model, context, cost, extensions, and edited files.

## Requirements

Recommended tools:

```bash
brew install git-delta starship bat
```

Pi should already be installed and able to load TypeScript extensions.

## Install

From this repo:

```bash
~/dotfiles/pi-config/install.sh
```

Then in Pi:

```text
/reload
```

## Layout

```text
pi-config/
├── extensions/
│   ├── catppuccin-spinner.ts
│   ├── delta-edit-diff.ts
│   ├── lucid-agent-radar.ts
│   ├── lucid-tool-cards.ts
│   ├── session-banner/
│   ├── shopify-footer.ts
│   └── vim-mode/
├── scripts/
├── themes/
│   └── catppuccin-mocha.json
└── install.sh
```

## Notes

The installer uses symlinks for live Pi resources, so editing files in this directory updates Pi after `/reload`.
Existing conflicting files are moved to a timestamped backup directory under `~/.pi/agent/lucid-backups/`.
