# Terminal Setup Guide

Complete guide to setting up a customized, productive terminal environment on macOS. Uses a Catppuccin Mocha dark theme to match the Neovim configuration.

---

## Quick Setup (Automated)

Run the setup script to install and configure everything automatically:

```bash
./scripts/setup-terminal.sh
```

For Neovim setup:

```bash
./scripts/setup-neovim.sh
```

---

## 1. Install Ghostty

Ghostty is a fast, native terminal emulator with GPU acceleration.

```bash
brew install --cask ghostty
```

## 2. Install a Nerd Font

Nerd Fonts include icons used by many CLI tools (eza, starship, etc).

```bash
brew install --cask font-jetbrains-mono-nerd-font
```

## 3. Ghostty Configuration

On macOS, the config file is at `~/Library/Application Support/com.mitchellh.ghostty/config` (Ghostty creates it on first launch). Edit it with:

```
# Theme
theme = Catppuccin Mocha

# Font
font-family = JetBrainsMono Nerd Font
font-size = 14

# Window
macos-titlebar-style = transparent
window-padding-x = 8
window-padding-y = 4
background-opacity = 0.95
background-blur-radius = 20

# Cursor
cursor-style = bar
cursor-style-blink = true

# Scrollback
scrollback-limit = 10000

# Shell integration
shell-integration = zsh

# Mouse
mouse-hide-while-typing = true

# Clipboard
clipboard-read = allow
clipboard-write = allow
copy-on-select = true
```

Ghostty ships with Catppuccin Mocha built in — no manual color import needed.

### Ghostty Keybindings

| Keybind | Action |
|---------|--------|
| `Cmd+D` | Split right |
| `Cmd+Shift+D` | Split down |
| `Cmd+T` | New tab |
| `Cmd+W` | Close split/tab |
| `Cmd+[` / `Cmd+]` | Navigate splits |
| `Cmd+,` | Open config |

## 4. Shell Prompt (Starship)

A fast, customizable, cross-shell prompt with git status, language versions, and icons.

```bash
brew install starship
```

Add to `~/.zshrc`:

```bash
eval "$(starship init zsh)"
```

Generate the Catppuccin powerline theme:

```bash
starship preset catppuccin-powerline -o ~/.config/starship.toml
```

This creates a Catppuccin-themed powerline prompt that matches the rest of your setup automatically.

## 5. Shell Tools

### Install Everything

```bash
brew install starship eza bat fd ripgrep zoxide fzf git-delta lazygit btop tldr thefuck zsh-autosuggestions zsh-syntax-highlighting
```

### Tool Overview

| Tool | Replaces | Description |
|------|----------|-------------|
| **starship** | pure/oh-my-zsh prompt | Fast, customizable shell prompt with git status, language versions, icons |
| **eza** | `ls` | Modern file listing with colors, icons, git status, tree view |
| **bat** | `cat` | File viewer with syntax highlighting and line numbers |
| **fd** | `find` | Fast, user-friendly file search |
| **ripgrep** | `grep` | Extremely fast content search across files |
| **zoxide** | `cd` | Smart directory jumper that learns your most-used paths |
| **fzf** | — | Fuzzy finder for files, history, and anything else |
| **git-delta** | git's default pager | Syntax-highlighted, side-by-side git diffs |
| **lazygit** | — | Terminal UI for git with an intuitive interface |
| **btop** | `htop`/`top` | Beautiful system resource monitor |
| **tldr** | `man` | Simplified, example-based command documentation |
| **thefuck** | — | Auto-corrects your previous mistyped command |
| **zsh-autosuggestions** | — | Suggests commands as you type based on history |
| **zsh-syntax-highlighting** | — | Colors valid/invalid commands in real-time |

### Tool Commands

```bash
# eza — modern ls
eza --icons --git              # list files with icons and git status
eza --icons --git -la          # long listing, all files
eza --icons --git --tree       # tree view

# bat — syntax-highlighted cat
bat file.py                    # view file with highlighting
bat --diff file.py             # show git diff for file

# fd — fast find
fd "pattern"                   # find files matching pattern
fd -e py                       # find all .py files
fd -e js --exec wc -l          # find .js files and count lines

# ripgrep — fast grep
rg "pattern"                   # search file contents
rg "pattern" -t py             # search only python files
rg "pattern" -l                # list matching files only

# zoxide — smart cd
z projects                     # jump to most-used dir matching "projects"
z foo bar                      # jump to dir matching "foo" and "bar"
zi                             # interactive directory picker with fzf

# fzf — fuzzy finder
Ctrl+R                         # fuzzy search command history
Ctrl+T                         # fuzzy search files
Alt+C                          # fuzzy cd into subdirectory
vim $(fzf)                     # open fzf-selected file in vim

# git-delta — better diffs (automatic, configured as git pager)
git diff                       # shows syntax-highlighted diff
git log -p                     # shows highlighted patches
git show                       # highlighted commit details

# lazygit
lazygit                        # open the git TUI

# btop
btop                           # open system monitor

# tldr
tldr tar                       # show simplified examples for tar
tldr git-rebase                # show simplified examples for git-rebase

# thefuck — auto-correct mistakes
fuck                           # re-run previous command with correction
```

## 6. Zsh Configuration

Add the following to `~/.zshrc`:

```bash
# Starship prompt
eval "$(starship init zsh)"

# Zoxide (smart cd)
eval "$(zoxide init zsh)"

# fzf keybindings & completion (Ctrl+R history, Ctrl+T files)
source <(fzf --zsh)

# thefuck (corrects previous command)
eval $(thefuck --alias)

# Zsh plugins
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source $(brew --prefix)/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# Better CLI aliases
alias ls="eza --icons --git"
alias ll="eza --icons --git -la"
alias la="eza --icons --git -a"
alias lt="eza --icons --git --tree --level=2"
alias cat="bat"
alias cd="z"
```

## 7. Git Delta Configuration

Configure git to use delta as its pager:

```bash
git config --global core.pager delta
git config --global interactive.diffFilter "delta --color-only"
git config --global delta.navigate true
git config --global delta.dark true
git config --global delta.line-numbers true
git config --global delta.syntax-theme "Catppuccin Mocha"
git config --global merge.conflictstyle diff3
git config --global diff.colorMoved default
```

## 8. Bat Configuration

Create `~/.config/bat/config`:

```
--theme="Catppuccin Mocha"
```

This sets the default syntax highlighting theme for bat to match the Catppuccin Mocha aesthetic.
