# dotfiles

Personal config for Neovim, Ghostty, Starship, and Pi on macOS.

## Layout

```
dotfiles/
├── nvim/                  → ~/.config/nvim
├── ghostty/               → ~/Library/Application Support/com.mitchellh.ghostty (macOS)
│                            ~/.config/ghostty (Linux)
├── starship/starship.toml → ~/.config/starship.toml
└── pi-config/             → ~/.pi/agent Lucid Mode setup kit
```

## Install

```bash
git clone https://github.com/llLucidll/dotfiles.git ~/dotfiles
```

### macOS

```bash
# Installs nvim + deps, backs up any existing ~/.config/nvim, and symlinks the repo copy in.
~/dotfiles/nvim/scripts/setup-neovim.sh

# Installs ghostty, nerd font, shell tools, and writes terminal configs.
~/dotfiles/nvim/scripts/setup-terminal.sh

# Symlink the ghostty config (one-time).
GHOSTTY_DIR="$HOME/Library/Application Support/com.mitchellh.ghostty"
mkdir -p "$GHOSTTY_DIR"
[ -e "$GHOSTTY_DIR/config" ] && [ ! -L "$GHOSTTY_DIR/config" ] && mv "$GHOSTTY_DIR/config" "$GHOSTTY_DIR/config.bak"
ln -sfn ~/dotfiles/ghostty/config "$GHOSTTY_DIR/config"

# Install the Lucid Mode Pi config.
~/dotfiles/pi-config/install.sh
```

### Linux (Debian/Ubuntu)

```bash
~/dotfiles/nvim/scripts/setup-linux.sh
```

This installs nvim (via the `neovim-ppa/unstable` PPA), ripgrep, fd, nodejs, lazygit, and the JetBrains Mono Nerd Font, then symlinks the configs into `~/.config/nvim`, `~/.config/ghostty/config`, and `~/.config/starship.toml`. Ghostty and Starship themselves aren't installed — see [ghostty.org](https://ghostty.org) and [starship.rs](https://starship.rs) for distro-specific install options. For non-apt distros, install the equivalent packages manually; the symlink steps in the script still apply.

See [`nvim/README.md`](nvim/README.md) for the full Neovim setup notes.

## Attribution

The Neovim configuration was originally based on [alvina-yang/NeoVim](https://github.com/alvina-yang/NeoVim) and has been customized from there.
