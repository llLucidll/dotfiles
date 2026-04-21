# Neovim Configuration

A fully-featured Neovim setup for macOS with LSP, autocompletion, fuzzy finding, git integration, and a modern UI.

> **Platform:** macOS only. These instructions assume you are on a Mac.

## What You Get

- Dashboard greeter with NEOVIM ASCII art and recent projects
- File explorer sidebar with git status colors
- Fuzzy file/text search with Telescope
- LSP-powered autocompletion, go-to-definition, and diagnostics
- Inline git diff markers and LazyGit integration
- Catppuccin Mocha color scheme with a matching statusline
- Autosave on insert leave and focus lost
- Flash jump to navigate anywhere on screen instantly

---

## Quick Setup (Automated)

```bash
# 1. Install Homebrew (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Clone this repo
git clone https://github.com/alvina-yang/NeoVim.git ~/.config/nvim

# 3. Run the setup scripts
~/.config/nvim/scripts/setup-neovim.sh
~/.config/nvim/scripts/setup-terminal.sh
```

If you prefer to set things up manually, follow the steps below.

---

## Manual Setup (Fresh Mac)

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the instructions printed in the terminal to add Homebrew to your PATH:

```bash
echo >> ~/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 2. Clone This Repository

```bash
git clone https://github.com/alvina-yang/NeoVim.git ~/.config/nvim
```

### 3. Install Neovim and Dependencies

```bash
# Neovim (0.11+ required)
brew install neovim

# Required for Telescope fuzzy finder
brew install ripgrep fd

# Required for Treesitter parser compilation
brew install gcc

# Required for markdown-preview.nvim
brew install node npm

# Required for LazyGit (full git UI inside Neovim)
brew install lazygit
```

### 4. Install a Nerd Font (Required for Icons)

```bash
brew install --cask font-jetbrains-mono-nerd-font
```

Set your terminal font to **JetBrainsMono Nerd Font**:
- **Ghostty:** Already configured in `~/.config/ghostty/config` (see [terminal.md](terminal.md))

### 5. Install Ghostty (Recommended Terminal)

```bash
brew install --cask ghostty
```

See [terminal.md](terminal.md) for full Ghostty configuration with Catppuccin Mocha theme.

### 6. Launch Neovim

```bash
nvim
```

On first launch:

1. **Lazy.nvim** will automatically bootstrap itself and install all plugins
2. **Mason** will install language servers (`lua_ls`, `pyright`)
3. **Treesitter** will download and compile language parsers
4. Wait for everything to finish (progress shows in the bottom right)
5. Restart Neovim (`:qa` then `nvim`) after installation completes
6. Run `:Lazy build markdown-preview.nvim` to build the markdown previewer

### 7. Verify Installation

Run these commands inside Neovim:

```
:checkhealth              Check overall health
:Lazy                     Verify all plugins installed (all should be green)
:Mason                    Verify language servers installed
:TSInstallInfo            Verify treesitter parsers installed
```

---

## File Structure

```
~/.config/nvim/
├── init.lua                    Core settings, autosave, bootstrap lazy.nvim
└── lua/
    ├── config/
    │   ├── diagnostics.lua     Diagnostic signs, virtual text, error line highlights
    │   └── keymaps.lua         All keybindings (splits, tabs, clipboard, terminal)
    └── plugins/
        ├── alpha.lua           Dashboard/greeter with two-column layout
        ├── colorscheme.lua     Catppuccin Mocha (default) + extra themes
        ├── editor.lua          Autopairs, comments, surround, indent, flash, illuminate
        ├── git.lua             Git blame, lazygit, gitsigns, diffview
        ├── lsp.lua             LSP, completion, trouble, lsp-progress
        ├── lualine.lua         Statusline with Catppuccin theme
        ├── nvim-tree.lua       File explorer with git status colors
        ├── session.lua         Session save/restore
        ├── telescope.lua       Fuzzy finder with fzf-native + project picker
        ├── tools.lua           Oil file manager, markdown preview
        ├── treesitter.lua      Syntax highlighting + code understanding
        └── ui.lua              Bufferline, noice, notify, dressing, which-key
```

---

## Essential Keybindings

**Leader key = `Space`**

### Navigation
| Keybind | Action |
|---------|--------|
| `Space e` | Toggle file explorer |
| `Space o` | Oil file manager |
| `Space ff` | Find files |
| `Space fg` | Live grep (search text in all files) |
| `Space fr` | Recent files |
| `Space fc` | Find word under cursor |
| `Space fp` | Find projects |
| `Space ft` | Find all TODOs |
| `s` + chars | Flash jump anywhere on screen |
| `]]` / `[[` | Next/previous word occurrence |

### Splits & Tabs
| Keybind | Action |
|---------|--------|
| `Space sv` | Split right (vertical) |
| `Space sh` | Split below (horizontal) |
| `Space sc` | Close split |
| `Space tv` | Terminal right (vertical) |
| `Space th` | Terminal below (horizontal) |
| `Ctrl-h/j/k/l` | Navigate between splits |
| `Tab` / `Shift-Tab` | Next/previous buffer tab |
| `Space c` | Close current buffer tab |

### Code (LSP)
| Keybind | Action |
|---------|--------|
| `gd` | Go to definition |
| `gr` | Find references |
| `K` | Hover docs |
| `Space rn` | Rename symbol |
| `Space ca` | Code action |
| `Space d` | Show diagnostic popup |
| `[d` / `]d` | Previous/next diagnostic |
| `Space xx` | Trouble diagnostics panel |

### Git
| Keybind | Action |
|---------|--------|
| `Space lg` | Open LazyGit (full git UI: stage, commit, push, branch) |
| `Space gd` | Diff view (side-by-side uncommitted changes) |
| `Space gh` | File git history |
| `Space gH` | Branch git history |
| `Space gq` | Close diff view |
| `Space gc` | Browse git commits (Telescope) |
| `Space gb` | Browse git branches (Telescope) |
| `]h` / `[h` | Next/previous git hunk |
| `Space hp` | Preview hunk |
| `Space hr` | Reset hunk |

### Session & Terminal
| Keybind | Action |
|---------|--------|
| `Space ws` | Save session |
| `Space wr` | Restore session |
| `Ctrl-n` | Exit terminal mode to Normal mode |
| `Esc` | Passes Escape to terminal app (e.g. Claude Code) |

### Notifications
| Keybind | Action |
|---------|--------|
| `Space nd` | Dismiss notifications |
| `Space nm` | Message history |
| `Space nn` | Search notifications |

### Other
| Keybind | Action |
|---------|--------|
| `gcc` | Toggle comment on line |
| `gc` (visual) | Toggle comment on selection |
| `ysiw"` | Surround word with quotes |
| `cs"'` | Change surrounding `"` to `'` |
| `]t` / `[t` | Next/previous TODO comment |
| `Space mp` | Toggle markdown preview |

For the **complete keybinding reference and plugin guide**, see [INFO.md](INFO.md).

---

## Updating

```
:Lazy update          Update all plugins
:Mason                Then press U to update language servers
:TSUpdate             Update treesitter parsers
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Icons look broken | Install a Nerd Font and set it as your terminal font |
| Treesitter errors | Run `:TSUpdate` to reinstall parsers |
| LSP not working | Run `:Mason`, press `i` next to missing servers |
| Telescope grep fails | Install ripgrep: `brew install ripgrep` |
| Colors look wrong | Ensure terminal supports true color and uses `xterm-256color` |
| Branch shows `.invalid` | Normal in deep subdirectories, statusline auto-detects the correct branch |

---

## Terminal Setup

For a full terminal customization guide (Ghostty, Starship prompt, CLI tools like eza, bat, fzf, zoxide, thefuck, and more), see [terminal.md](terminal.md).

---

## License

MIT
