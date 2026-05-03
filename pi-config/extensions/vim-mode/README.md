---
summary: Vim-style modal editing for the Pi input editor with horizontal prompt motions, operators, and visual mode.
category: productivity
keywords: [vim, editor, keybindings, modal]
---

# Vim Mode Extension

Local Vim-style modal editing for the Pi input editor. This copy intentionally keeps the prompt conservative: insert mode types normally with an animated Catppuccin rainbow gradient over typed prompt text, normal mode keeps horizontal prompt movement, and direct `j` / `k` do not move through the prompt because they are reserved for chat-output scrolling if Pi exposes that API later.

## What it does

Replaces the default Pi editor with a `ModalEditor` that intercepts keystrokes and interprets them as Vim commands. A mode indicator (NORMAL / INSERT / VISUAL / operator-pending with count) is displayed in the bottom-right corner of the editor border.

The extension uses `CustomEditor` and `setEditorComponent` from the Pi SDK — no patching required.

## Keybindings

### Normal mode

| Key | Action |
|-----|--------|
| `h` / `l` | Move left / right in the prompt |
| `j` / `k` | No-op for now; reserved for main chat-output scrolling if Pi exposes it later |
| `w` / `e` / `b` | Next word start / word end / previous word start |
| `B` | Previous WORD start (whitespace-delimited; punctuation is part of the WORD) |
| `f{char}` | Jump forward to next `{char}` on current line (with count: `2fa`) |
| `t{char}` | Jump forward to just before next `{char}` on current line |
| `F{char}` | Jump backward to previous `{char}` on current line |
| `T{char}` | Jump backward to just after previous `{char}` on current line |
| `0` / `^` / `$` | Line start / first non-whitespace / line end |
| `gg` | Go to first line (or `Ngg` for line N) |
| `G` | Go to last line (or `NG` for line N) |
| `i` | Insert before cursor |
| `a` | Append after cursor |
| `I` | Insert at first non-whitespace character |
| `A` | Append at end of line |
| `o` / `O` | Open line below / above and enter Insert mode |
| `x` | Delete character under cursor (with count: `3x`) |
| `Delete` | Delete character under cursor (like `x`) |
| `Backspace` | Move cursor left (like `h`) |
| `yy` / `y{motion}` | Yank (copy) line or motion range |
| `p` / `P` | Paste after / before cursor (linewise yanks paste as full lines) |
| `s` | Substitute character (delete + enter Insert) |
| `D` | Delete to end of line |
| `C` | Change to end of line (delete + enter Insert) |
| `d{motion}` | Delete operator — `dw`, `de`, `d$`, `d0`, `d^`, `db`, `dB`, `dd`, `dj`, `dk`, `df`, `dt`, `dF`, `dT` |
| `c{motion}` | Change operator — `cw`, `ce`, `c$`, `c0`, `c^`, `cb`, `cB`, `cc`, `cj`, `ck`, `cf`, `ct`, `cF`, `cT` |
| `{count}` | Prefix count for motions/operators — `3dw`, `d2w`, `2dd` |
| `u` | Undo |
| `Ctrl+R` | Redo |
| `Escape` | Cancel operator-pending; in Normal mode, passes through (aborts agent) |

### Visual mode

| Key | Action |
|-----|--------|
| `v` | Enter/exit characterwise visual mode |
| `V` | Enter/exit linewise visual mode |
| `h` / `l`, `w` / `e` / `b` / `B`, `0` / `^` / `$`, `f/t/F/T`, `gg` / `G` | Expand/shrink selection using motions |
| `j` / `k` | No-op |
| `d` / `x` | Delete selected text and return to Normal mode |
| `c` / `s` | Change selected text (delete + enter Insert mode) |
| `y` | Yank selection and return to Normal mode |
| `p` | Replace selection with yanked text |
| `Escape` | Exit visual mode and return to Normal mode |

### Insert mode

| Key | Action |
|-----|--------|
| All keys | Passed through to the default editor |
| Typed text | Animated Catppuccin rainbow gradient while insert mode is active |
| `Escape` | Return to Normal mode |

Double-pressing `Escape` in Normal mode passes through to Pi, which aborts the current agent turn. Unlike the upstream shop-pi-fy default, this local copy does not use `jk` as an insert-mode escape because the user's Neovim config does not define that mapping.

## How it works

The extension hooks into `session_start` and calls `ctx.ui.setEditorComponent()` to replace the default editor with `ModalEditor`, a class extending `CustomEditor`. All Vim logic (word boundary detection, operator ranges, text manipulation) lives in a separate pure-function module (`lib/vim-core.ts`) with no TUI dependencies, making it easy to test.

## Out of scope

- Main transcript scrolling through `j` / `k` until Pi exposes a transcript-scroll API
- Search (`/`, `n`, `N`)
- Text objects (`ciw`, `di"`, etc.)
- Registers
- Dot repeat (`.`)
- Configuration file for custom keybindings / timeout values
