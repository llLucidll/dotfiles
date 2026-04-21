# Neovim Complete Instructions

This document covers every plugin installed, what it does, how to use it, and every keybinding available.

---

## Table of Contents

1. [Neovim Basics](#neovim-basics)
2. [Plugin List](#plugin-list)
3. [Complete Keybinding Reference](#complete-keybinding-reference)
4. [Plugin Details](#plugin-details)
   - [Dashboard (alpha-nvim)](#dashboard-alpha-nvim)
   - [File Explorer (nvim-tree)](#file-explorer-nvim-tree)
   - [Fuzzy Finder (telescope)](#fuzzy-finder-telescope)
   - [LSP (Language Server Protocol)](#lsp-language-server-protocol)
   - [Autocompletion (nvim-cmp)](#autocompletion-nvim-cmp)
   - [Syntax Highlighting (treesitter)](#syntax-highlighting-treesitter)
   - [Git Integration](#git-integration)
   - [Statusline (lualine)](#statusline-lualine)
   - [Buffer Tabs (bufferline)](#buffer-tabs-bufferline)
   - [Flash Jump (flash.nvim)](#flash-jump-flashnvim)
   - [Word Highlighting (vim-illuminate)](#word-highlighting-vim-illuminate)
   - [Comments (Comment.nvim)](#comments-commentnvim)
   - [Todo Comments](#todo-comments)
   - [Surround (nvim-surround)](#surround-nvim-surround)
   - [Autopairs](#autopairs)
   - [Indent Guides (indent-blankline)](#indent-guides-indent-blankline)
   - [Color Highlighter](#color-highlighter)
   - [Diagnostics & Trouble](#diagnostics--trouble)
   - [Session Management (auto-session)](#session-management-auto-session)
   - [Modern UI (noice + notify)](#modern-ui-noice--notify)
   - [Which-key](#which-key)
   - [Dressing](#dressing)
   - [Oil (File Manager)](#oil-file-manager)
   - [Diffview](#diffview)
   - [Markdown Preview](#markdown-preview)
5. [Terminal Mode](#terminal-mode)
6. [Splits and Navigation](#splits-and-navigation)
7. [Customization](#customization)

---

## Neovim Basics

### Modes

| Mode | How to Enter | Purpose |
|------|-------------|---------|
| **Normal** | `Esc` or `Ctrl-n` (from terminal) | Navigate, run commands |
| **Insert** | `i`, `a`, `o` | Type/edit text |
| **Visual** | `v` (char), `V` (line), `Ctrl-v` (block) | Select text |
| **Command** | `:` | Run Neovim commands |
| **Terminal** | Open a terminal buffer | Interact with shell |

### Essential Vim Commands

| Command | Action |
|---------|--------|
| `:w` | Save file |
| `:q` | Quit |
| `:qa!` | Quit all without saving |
| `:e filename` | Open a file |
| `:e!` | Reload file from disk |
| `u` | Undo |
| `Ctrl-r` | Redo |
| `/pattern` | Search forward |
| `n` / `N` | Next/previous search result |
| `yy` | Copy (yank) line |
| `dd` | Delete (cut) line |
| `p` | Paste after cursor |
| `P` | Paste before cursor |

### Copy/Paste with System Clipboard

| Keybind | Mode | Action |
|---------|------|--------|
| `"+y` | Visual | Copy selection to system clipboard |
| `"+yy` | Normal | Copy line to system clipboard |
| `"+p` | Normal | Paste from system clipboard |
| `Cmd+C` | Visual | Copy to clipboard (if terminal supports it) |
| `Cmd+V` | Any | Paste from clipboard (if terminal supports it) |

---

## Plugin List

| # | Plugin | Category | Purpose |
|---|--------|----------|---------|
| 1 | alpha-nvim | UI | Dashboard/greeter on startup |
| 2 | auto-session | Session | Save and restore editing sessions |
| 3 | nvim-autopairs | Editor | Auto-close brackets and quotes |
| 4 | nvim-highlight-colors | Editor | Show color values with actual colors |
| 5 | Comment.nvim | Editor | Toggle code comments |
| 6 | nvim-ts-context-commentstring | Editor | Correct comment style in JSX/Vue/HTML |
| 7 | todo-comments.nvim | Editor | Highlight TODO/FIXME/HACK in code |
| 8 | nvim-surround | Editor | Add/change/delete surrounding chars |
| 9 | indent-blankline.nvim | Editor | Visual indent guide lines |
| 10 | flash.nvim | Navigation | Jump anywhere on screen instantly |
| 11 | vim-illuminate | Editor | Highlight other occurrences of word under cursor |
| 12 | git-blame.nvim | Git | Show who last edited each line |
| 13 | lazygit.nvim | Git | Full git UI inside Neovim |
| 14 | gitsigns.nvim | Git | Git diff markers in the gutter |
| 15 | diffview.nvim | Git | Side-by-side git diff viewer |
| 16 | lualine.nvim | UI | Statusline at the bottom |
| 17 | nvim-tree.lua | Navigation | File explorer sidebar |
| 18 | telescope.nvim | Navigation | Fuzzy finder for files, text, and more |
| 19 | telescope-fzf-native.nvim | Navigation | Faster fuzzy matching for Telescope |
| 20 | nvim-treesitter | Syntax | Better syntax highlighting and code understanding |
| 21 | nvim-ts-autotag | Editor | Auto-close and rename HTML/JSX tags |
| 22 | nvim-lspconfig | LSP | Language server configuration |
| 23 | mason.nvim | LSP | Language server installer |
| 24 | mason-lspconfig.nvim | LSP | Bridge between Mason and lspconfig |
| 25 | nvim-cmp | Completion | Autocompletion engine |
| 26 | cmp-nvim-lsp | Completion | LSP completion source |
| 27 | cmp-buffer | Completion | Buffer word completion source |
| 28 | cmp-path | Completion | File path completion source |
| 29 | LuaSnip | Completion | Snippet engine |
| 30 | cmp_luasnip | Completion | Snippet completion source |
| 31 | trouble.nvim | Diagnostics | Pretty error/diagnostic panel |
| 32 | lsp-progress.nvim | UI | LSP loading progress in statusline |
| 33 | bufferline.nvim | UI | Tab bar at the top for open buffers |
| 34 | noice.nvim | UI | Modern floating command line and popups |
| 35 | nvim-notify | UI | Animated popup notifications |
| 36 | dressing.nvim | UI | Prettier input/select dialogs |
| 37 | which-key.nvim | UI | Shows available keybindings after pressing leader |
| 38 | oil.nvim | Navigation | Edit filesystem like a buffer |
| 39 | markdown-preview.nvim | Tools | Live markdown preview in browser |
| 40 | catppuccin | Theme | Default color scheme (mocha) |
| 41 | kanagawa.nvim | Theme | Alternative color scheme |
| 42 | tokyonight.nvim | Theme | Alternative color scheme |
| 43 | nightfox.nvim | Theme | Alternative color scheme |

---

## Complete Keybinding Reference

**Leader key = `Space`**

### File Navigation

| Keybind | Action |
|---------|--------|
| `Space e` | Toggle file explorer (NvimTree) |
| `Space o` | Open Oil file manager (edit filesystem as text) |
| `Space ff` | Find files in current directory |
| `Space fg` | Live grep (search text in all files) |
| `Space fr` | Find recently opened files |
| `Space fc` | Find string under cursor in all files |
| `Space ft` | Find all TODO/FIXME/HACK comments |

### Buffer Tabs

| Keybind | Action |
|---------|--------|
| `Tab` | Next buffer tab |
| `Shift-Tab` | Previous buffer tab |
| `Space c` | Close current buffer tab |

### Splits

| Keybind | Action |
|---------|--------|
| `Space sv` | Split pane to the right (vertical) |
| `Space sh` | Split pane below (horizontal) |
| `Space sc` | Close current split |
| `Ctrl-h` | Move to left split |
| `Ctrl-j` | Move to split below |
| `Ctrl-k` | Move to split above |
| `Ctrl-l` | Move to right split |

### LSP (Code Intelligence)

| Keybind | Action |
|---------|--------|
| `gd` | Go to definition |
| `gr` | Find all references |
| `K` | Show hover documentation |
| `Space rn` | Rename symbol across files |
| `Space ca` | Show code actions |
| `Space d` | Show diagnostic message in popup |
| `Space q` | Send diagnostics to location list |
| `[d` | Jump to previous diagnostic |
| `]d` | Jump to next diagnostic |

### Diagnostics (Trouble)

| Keybind | Action |
|---------|--------|
| `Space xx` | Toggle diagnostics panel (all files) |
| `Space xd` | Toggle diagnostics panel (current file only) |

### Git

| Keybind | Action |
|---------|--------|
| `Space lg` | Open LazyGit (full git UI) |
| `Space gd` | Open side-by-side diff view |
| `Space gh` | View current file's git history |
| `Space gH` | View entire branch's git history |
| `]h` | Jump to next git hunk (changed block) |
| `[h` | Jump to previous git hunk |
| `Space hp` | Preview git hunk inline |
| `Space hr` | Reset (undo) git hunk |

### Flash (Jump Navigation)

| Keybind | Action |
|---------|--------|
| `s` + type chars | Flash jump: type 1-2 chars, then press the label letter to jump |
| `S` | Flash treesitter: select code blocks (functions, ifs, etc.) |

### Word References (vim-illuminate)

| Keybind | Action |
|---------|--------|
| `]]` | Jump to next occurrence of word under cursor |
| `[[` | Jump to previous occurrence of word under cursor |

### Comments

| Keybind | Action |
|---------|--------|
| `gcc` | Toggle comment on current line |
| `gc` (visual) | Toggle comment on selected lines |
| `gcb` | Toggle block comment |

### Todo Comments

| Keybind | Action |
|---------|--------|
| `]t` | Jump to next TODO/FIXME/HACK comment |
| `[t` | Jump to previous TODO/FIXME/HACK comment |
| `Space ft` | Search all TODO comments with Telescope |

### Surround

| Keybind | Action |
|---------|--------|
| `ysiw"` | Surround word with double quotes |
| `ysiw'` | Surround word with single quotes |
| `ysiw(` | Surround word with parentheses (with spaces) |
| `ysiw)` | Surround word with parentheses (no spaces) |
| `cs"'` | Change surrounding `"` to `'` |
| `ds"` | Delete surrounding `"` |
| `S"` (visual) | Surround selection with `"` |

### Session Management

| Keybind | Action |
|---------|--------|
| `Space ws` | Save current session |
| `Space wr` | Restore last session for current directory |

### Notifications & Messages

| Keybind | Action |
|---------|--------|
| `Space nd` | Dismiss all notifications |
| `Space nm` | View message history |
| `Space nl` | View last message |
| `Space nn` | Search through notifications with Telescope |

### Markdown

| Keybind | Action |
|---------|--------|
| `Space mp` | Toggle live markdown preview in browser |

### Terminal Mode

| Keybind | Action |
|---------|--------|
| `Esc` | Sends Escape to the terminal app (e.g., Claude Code) |
| `Ctrl-n` | Exit terminal mode to Normal mode |
| `i` | Re-enter terminal mode from Normal mode |
| `Ctrl-h/j/k/l` | Navigate splits from terminal mode |

### Autocompletion

| Keybind | Action |
|---------|--------|
| `Tab` | Select next completion item |
| `Shift-Tab` | Select previous completion item |
| `Enter` | Confirm completion |
| `Ctrl-e` | Dismiss completion menu |
| `Ctrl-Space` | Trigger completion manually |
| `Ctrl-b` | Scroll docs up |
| `Ctrl-f` | Scroll docs down |

### Treesitter Incremental Selection

| Keybind | Action |
|---------|--------|
| `Ctrl-Space` | Start selection / expand to next node |
| `Backspace` | Shrink selection to previous node |

---

## Plugin Details

### Dashboard (alpha-nvim)

**What it does:** Shows a welcome screen when you open Neovim without a file. Displays the NEOVIM ASCII logo, quick action buttons, and your 5 most recently opened files.

**How to use:** Just open `nvim` with no arguments. Press the shortcut keys shown on the dashboard:

- `e` — Create new file
- `SPC e` — Open file explorer
- `SPC ff` — Find file
- `SPC fg` — Search text in files
- `SPC fr` — Recent files
- `SPC wr` — Restore last session
- `q` — Quit
- `1`-`5` — Open a recent file

---

### File Explorer (nvim-tree)

**What it does:** A file tree sidebar (like VS Code's explorer) that shows your project files with git status indicators.

**How to use:**

- `Space e` — Toggle the explorer open/closed
- Navigate with `j` (down) and `k` (up)
- `Enter` — Open file or expand/collapse folder
- `a` — Create new file
- `d` — Delete file
- `r` — Rename file
- `c` — Copy file
- `p` — Paste file
- `R` — Refresh tree

**Git indicators in the tree:**
- Green filename = new/untracked file (★)
- Yellow filename = modified file ()
- Light green filename = staged file ()
- Gray italic filename = gitignored file (◌)
- Red filename = deleted file ()

---

### Fuzzy Finder (telescope)

**What it does:** A powerful fuzzy finder that lets you search files, text, git commits, notifications, and more with a live preview.

**Dependencies:** Requires `ripgrep` and `fd` (installed via `brew install ripgrep fd`).

**How to use:**

- `Space ff` — Find files by name
- `Space fg` — Search text in all files (live grep)
- `Space fr` — Recently opened files
- `Space fc` — Search for the word currently under your cursor
- `Space ft` — Find all TODO/FIXME/HACK comments

**Inside Telescope:**
- Type to filter results
- `Ctrl-j` / `Ctrl-k` — Move up/down in results
- `Enter` — Open selected file
- `Ctrl-q` — Send selected items to quickfix list
- `Esc` — Close Telescope

---

### LSP (Language Server Protocol)

**What it does:** Provides IDE-like features: go-to-definition, find references, hover documentation, rename across files, code actions, and real-time error detection.

**Dependencies:** Language servers are installed automatically via Mason. Pre-configured servers:
- `lua_ls` — Lua (for editing Neovim config)
- `pyright` — Python

**How to add more language servers:**
1. Open Neovim and run `:Mason`
2. Search for your language (e.g., `typescript`)
3. Press `i` to install

**How to use:**
- `gd` — Jump to where a function/variable is defined
- `gr` — Find every place a function/variable is used
- `K` — Show documentation popup (like hovering in VS Code)
- `Space rn` — Rename a variable/function everywhere
- `Space ca` — Show available code actions (quick fixes)
- `[d` / `]d` — Jump to previous/next error or warning
- `Space d` — Show the full error message in a popup

---

### Autocompletion (nvim-cmp)

**What it does:** Shows a completion popup as you type with suggestions from LSP, current buffer words, file paths, and snippets.

**How to use:** Completions appear automatically as you type.

- `Tab` — Select next item in the list
- `Shift-Tab` — Select previous item
- `Enter` — Confirm/insert the selected completion
- `Ctrl-e` — Close the completion menu
- `Ctrl-Space` — Manually trigger completions
- `Ctrl-b` / `Ctrl-f` — Scroll the documentation window

**Completion sources (in priority order):**
1. LSP suggestions (functions, variables, types)
2. Snippets (LuaSnip)
3. Buffer words (words from current file)
4. File paths

---

### Syntax Highlighting (treesitter)

**What it does:** Provides vastly better syntax highlighting than Neovim's built-in regex-based highlighting. Understands code structure for accurate coloring, indentation, and code folding.

**Pre-installed parsers:** JSON, JavaScript, TypeScript, TSX, YAML, HTML, CSS, Markdown, Bash, Lua, Vim, Python, Ruby, TOML, C, Dockerfile, Gitignore

**How to add more languages:**
```
:TSInstall <language>
```

**Incremental selection:**
- `Ctrl-Space` — Start selection at cursor, press again to expand (word > expression > statement > function > etc.)
- `Backspace` — Shrink selection back

---

### Git Integration

#### LazyGit (lazygit.nvim)

**What it does:** Opens a full terminal-based git UI inside Neovim. Stage files, commit, push, pull, branch, merge, rebase — all without leaving Neovim.

**Dependency:** Requires `lazygit` (installed via `brew install lazygit`).

**How to use:**
- `Space lg` — Open LazyGit
- Navigate with `h/j/k/l`, `Enter` to select, `q` to quit
- Press `?` inside LazyGit to see all its keybindings

#### Gitsigns (gitsigns.nvim)

**What it does:** Shows git diff markers in the left gutter of every file. Added lines get `+`, changed lines get `~`, deleted lines get `_`.

**How to use:**
- `]h` — Jump to next changed hunk
- `[h` — Jump to previous changed hunk
- `Space hp` — Preview what changed in a hunk (inline diff popup)
- `Space hr` — Reset/undo a hunk (revert to last committed version)

#### Git Blame (git-blame.nvim)

**What it does:** Shows who last edited the current line and when, displayed in the statusline at the bottom.

**How to use:** Automatic — just look at the statusline.

#### Diffview (diffview.nvim)

**What it does:** Opens a side-by-side diff viewer for git changes, similar to VS Code's source control diff.

**How to use:**
- `Space gd` — Open diff view of all uncommitted changes
- `Space gh` — View the full commit history of the current file
- `Space gH` — View the full commit history of the entire branch
- `:DiffviewClose` or `q` — Close the diff view

---

### Statusline (lualine)

**What it does:** A customized statusline at the bottom of the screen showing: mode, branch, diff stats, diagnostics, filename, LSP progress, encoding, file type, and cursor position.

**Theme:** Uses the built-in Catppuccin Mocha lualine theme. Mode colors match the Catppuccin palette automatically.

**How to use:** Automatic — it's always visible at the bottom.

---

### Buffer Tabs (bufferline)

**What it does:** Shows open files as tabs at the top of the screen, like browser tabs or VS Code tabs.

**How to use:**
- `Tab` — Switch to next buffer tab
- `Shift-Tab` — Switch to previous buffer tab
- `Space c` — Close current buffer tab

---

### Flash Jump (flash.nvim)

**What it does:** Lets you jump to any visible location on screen by typing a few characters. Much faster than scrolling or searching.

**How to use:**
1. Press `s` in Normal mode
2. Type 1-2 characters that appear at your target location (e.g., `re` for `require`)
3. Colored label letters appear next to all matches on screen
4. Press the label letter to jump your cursor there instantly

**Treesitter select:**
- Press `S` to select code blocks (functions, if statements, classes, etc.) using treesitter's understanding of code structure

---

### Word Highlighting (vim-illuminate)

**What it does:** Automatically highlights all other visible occurrences of the word under your cursor. Helps you see where variables and functions are used.

**How to use:** Automatic — place cursor on any word and all other occurrences light up.

- `]]` — Jump to next occurrence
- `[[` — Jump to previous occurrence

---

### Comments (Comment.nvim)

**What it does:** Toggle code comments with a single keystroke. Supports every language and uses the correct comment syntax (including JSX/Vue/HTML with context-aware commenting).

**How to use:**
- `gcc` — Toggle comment on current line
- `gc` (in visual mode) — Toggle comment on selected lines
- `gcb` — Toggle block comment
- `gc3j` — Comment current line and 3 lines below

---

### Todo Comments

**What it does:** Highlights TODO, FIXME, HACK, NOTE, WARNING, and similar keywords in comments with distinct colors.

**How to use:**
- `]t` — Jump to next todo comment
- `[t` — Jump to previous todo comment
- `Space ft` — Search all todo comments across the project with Telescope

---

### Surround (nvim-surround)

**What it does:** Quickly add, change, or delete surrounding characters (quotes, brackets, tags, etc.).

**How to use:**

**Add surrounding:**
- `ysiw"` — Surround word with `"` → `"word"`
- `ysiw)` — Surround word with `()` → `(word)`
- `ysiw}` — Surround word with `{}` → `{word}`
- `ys$"` — Surround from cursor to end of line with `"`

**Change surrounding:**
- `cs"'` — Change `"hello"` to `'hello'`
- `cs'<div>` — Change `'hello'` to `<div>hello</div>`

**Delete surrounding:**
- `ds"` — Delete surrounding `"` → `hello`
- `ds(` — Delete surrounding `()` → `hello`

**In visual mode:**
- Select text, then press `S"` to surround with `"`

---

### Autopairs

**What it does:** Automatically inserts closing brackets, quotes, and parentheses when you type the opening one.

**How to use:** Automatic.
- Type `(` → get `()`
- Type `"` → get `""`
- Type `{` → get `{}`
- Works with `[`, `'`, and backticks too

---

### Indent Guides (indent-blankline)

**What it does:** Shows vertical lines at each indentation level, making it easy to see code nesting. Especially useful for Python.

**How to use:** Automatic — visible in every file.

---

### Color Highlighter

**What it does:** Shows color values (hex, RGB, CSS named colors, Tailwind classes) with the actual color as background highlighting.

**How to use:** Automatic. Any color value like `#ff0000` or `red` will be highlighted with its actual color.

---

### Diagnostics & Trouble

**What it does:** Trouble provides a dedicated panel for viewing all errors, warnings, and hints across your project. Better than scrolling through individual files.

**How to use:**
- `Space xx` — Open diagnostics panel for all files
- `Space xd` — Open diagnostics panel for current file only
- Click on any entry to jump to that location
- `q` — Close the panel

**Diagnostic indicators in files:**
- Red background tint on error lines
- Yellow background tint on warning lines
- Red `●` markers in virtual text
- Icons in the gutter: ` ` error, ` ` warning, `󰠠 ` hint, ` ` info

---

### Session Management (auto-session)

**What it does:** Lets you save your current editing session (open files, splits, cursor positions) and restore it later.

**How to use:**
- `Space ws` — Save current session
- `Space wr` — Restore last saved session for the current directory
- Sessions are stored per-directory, so each project has its own session

**Note:** Auto-save and auto-restore are disabled. Sessions are manual only.

---

### Modern UI (noice + notify)

**What it does:**
- **Noice** replaces Neovim's command line with a floating popup at the top. Makes `:commands`, search (`/`), and messages look modern.
- **Notify** shows notifications as animated popups in the top-right corner instead of the bottom status line.

**How to use:**
- `Space nd` — Dismiss all current notifications
- `Space nm` — View full message history
- `Space nl` — View the last message again
- `Space nn` — Search through all notifications with Telescope

**Note:** Notifications are filtered to only show errors (warnings and info are hidden to reduce clutter).

---

### Which-key

**What it does:** Shows a popup of all available keybindings after you press the leader key (`Space`). Helps you discover and remember keybindings.

**How to use:** Press `Space` and wait 300ms. A popup appears showing all available next keys and what they do.

---

### Dressing

**What it does:** Automatically upgrades all of Neovim's input and select dialogs (rename prompts, code action menus, etc.) to look like Telescope pickers with fuzzy matching.

**How to use:** Automatic — you'll notice it when you use `Space rn` (rename) or `Space ca` (code actions).

---

### Oil (File Manager)

**What it does:** Opens the current directory as an editable buffer. Rename files by editing text, delete files by deleting lines, create files by adding new lines.

**How to use:**
- `Space o` — Open Oil
- Edit filenames to rename
- Delete a line to delete a file
- Add a new line to create a file
- Press `-` to go up a directory
- `:w` to apply all changes

---

### Diffview

**What it does:** A side-by-side git diff viewer, similar to VS Code's source control diff tab. Shows added/removed lines with color coding.

**How to use:**
- `Space gd` — View all uncommitted changes
- `Space gh` — View current file's commit history
- `Space gH` — View the branch's full commit history
- `:DiffviewClose` — Close the diff view

---

### Markdown Preview

**What it does:** Opens a live preview of your markdown file in your web browser. Updates in real-time as you type.

**Dependencies:** Requires `node` and `npm` (installed via `brew install node npm`). On first use, run `:Lazy build markdown-preview.nvim`.

**How to use:**
- `Space mp` — Toggle markdown preview in browser
- The preview auto-scrolls to follow your cursor position

---

## Terminal Mode

Neovim has a built-in terminal. You can open it with `:terminal`.

**Key behaviors in this config:**

| Keybind | Action |
|---------|--------|
| `Esc` | Passes Escape to the terminal app (e.g., Claude Code). Does NOT exit terminal mode. |
| `Ctrl-n` | Exit terminal mode → Normal mode |
| `i` | Re-enter terminal mode from Normal mode |
| `Ctrl-h/j/k/l` | Navigate between splits while in terminal mode |

---

## Splits and Navigation

### Creating Splits

| Keybind | Action |
|---------|--------|
| `Space sv` | New vertical split (right) |
| `Space sh` | New horizontal split (bottom) |
| `Space sc` | Close current split |

### Navigating Splits

| Keybind | Action |
|---------|--------|
| `Ctrl-h` | Move to left split |
| `Ctrl-j` | Move to split below |
| `Ctrl-k` | Move to split above |
| `Ctrl-l` | Move to right split |

These work in both Normal mode and Terminal mode.

---

## Customization

### Changing Color Scheme

Available themes: `catppuccin-mocha` (default), `catppuccin-frappe`, `catppuccin-macchiato`, `catppuccin-latte`, `kanagawa`, `tokyonight`, `nightfox`

To switch, edit `lua/plugins/colorscheme.lua` and change:
```lua
vim.cmd("colorscheme catppuccin-mocha")
```
to any of:
```lua
vim.cmd("colorscheme kanagawa")
vim.cmd("colorscheme tokyonight")
vim.cmd("colorscheme nightfox")
```

Or switch temporarily in Neovim: `:colorscheme tokyonight`

### Adding a Language Server

1. Open Neovim
2. Run `:Mason`
3. Search for your language
4. Press `i` to install
5. Open a file of that language — LSP features activate automatically

### Adding a Treesitter Parser

```
:TSInstall <language>
```
Example: `:TSInstall rust`

### Disabling Autosave

Edit `init.lua` and remove or comment out the `InsertLeave, FocusLost, BufLeave` autocmd block.

### Changing Notification Level

Edit `lua/plugins/ui.lua` and change the `level` in nvim-notify setup:
```lua
level = vim.log.levels.ERROR,    -- Only errors (current)
level = vim.log.levels.WARN,     -- Warnings and errors
level = vim.log.levels.INFO,     -- Everything (default)
```
