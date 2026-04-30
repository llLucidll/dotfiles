#!/bin/bash
# setup-linux.sh — Install and configure Neovim + Ghostty configs on Linux (Debian/Ubuntu).
# For other distros, install the equivalent packages manually and the config-linking steps below will still work.
set -e

echo "==> Setting up dotfiles on Linux..."

# Locate the dotfiles repo (the script lives at <repo>/nvim/scripts/setup-linux.sh)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# If we weren't run from a cloned repo, clone it to ~/dotfiles
if [ ! -f "$DOTFILES_DIR/nvim/init.lua" ]; then
  DOTFILES_DIR="$HOME/dotfiles"
  if [ ! -d "$DOTFILES_DIR" ]; then
    echo "==> Cloning dotfiles to $DOTFILES_DIR..."
    git clone https://github.com/llLucidll/dotfiles.git "$DOTFILES_DIR"
  fi
fi

# ---------------------------------------------------------------------------
# Package installation (Debian/Ubuntu via apt)
# ---------------------------------------------------------------------------
if command -v apt-get &>/dev/null; then
  echo "==> Installing packages via apt..."
  sudo apt-get update

  # Ubuntu's default nvim is usually too old for this config; add the unstable PPA.
  if ! command -v add-apt-repository &>/dev/null; then
    sudo apt-get install -y software-properties-common
  fi
  if ! apt-cache policy | grep -q "neovim-ppa/unstable"; then
    sudo add-apt-repository -y ppa:neovim-ppa/unstable
    sudo apt-get update
  fi

  sudo apt-get install -y \
    neovim ripgrep fd-find build-essential nodejs npm git curl unzip \
    fontconfig

  # Debian/Ubuntu ship `fd` as `fdfind` — alias it to `fd`
  mkdir -p ~/.local/bin
  if [ ! -e ~/.local/bin/fd ] && command -v fdfind &>/dev/null; then
    ln -s "$(command -v fdfind)" ~/.local/bin/fd
  fi

  # lazygit has no apt package; grab the latest release tarball
  if ! command -v lazygit &>/dev/null; then
    echo "==> Installing lazygit..."
    LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
    curl -Lo /tmp/lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"
    tar xf /tmp/lazygit.tar.gz -C /tmp lazygit
    sudo install /tmp/lazygit /usr/local/bin
    rm -f /tmp/lazygit /tmp/lazygit.tar.gz
  fi
else
  echo "!! apt-get not found — install these manually for your distro:"
  echo "   neovim ripgrep fd nodejs npm git curl build-essential lazygit"
fi

# ---------------------------------------------------------------------------
# JetBrains Mono Nerd Font
# ---------------------------------------------------------------------------
FONT_DIR="$HOME/.local/share/fonts"
if ! fc-list 2>/dev/null | grep -qi "JetBrainsMono Nerd Font"; then
  echo "==> Installing JetBrains Mono Nerd Font..."
  mkdir -p "$FONT_DIR"
  curl -Lo /tmp/JetBrainsMono.zip \
    https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip
  unzip -o /tmp/JetBrainsMono.zip -d "$FONT_DIR/JetBrainsMono" >/dev/null
  rm -f /tmp/JetBrainsMono.zip
  fc-cache -f "$FONT_DIR"
else
  echo "==> JetBrains Mono Nerd Font already installed."
fi

# ---------------------------------------------------------------------------
# Symlink configs
# ---------------------------------------------------------------------------
mkdir -p ~/.config

# nvim: ~/.config/nvim → dotfiles/nvim
if [ -e ~/.config/nvim ] && [ ! -L ~/.config/nvim ]; then
  echo "==> Backing up existing ~/.config/nvim to ~/.config/nvim.bak..."
  mv ~/.config/nvim ~/.config/nvim.bak
  mv ~/.local/share/nvim ~/.local/share/nvim.bak 2>/dev/null || true
  mv ~/.local/state/nvim ~/.local/state/nvim.bak 2>/dev/null || true
  mv ~/.cache/nvim ~/.cache/nvim.bak 2>/dev/null || true
fi
if [ ! -e ~/.config/nvim ]; then
  echo "==> Linking $DOTFILES_DIR/nvim → ~/.config/nvim"
  ln -s "$DOTFILES_DIR/nvim" ~/.config/nvim
fi

# ghostty: ~/.config/ghostty/config → dotfiles/ghostty/config
# (Ghostty on Linux looks in $XDG_CONFIG_HOME/ghostty/config, i.e. ~/.config/ghostty/config)
mkdir -p ~/.config/ghostty
if [ -e ~/.config/ghostty/config ] && [ ! -L ~/.config/ghostty/config ]; then
  mv ~/.config/ghostty/config ~/.config/ghostty/config.bak
fi
if [ ! -e ~/.config/ghostty/config ]; then
  echo "==> Linking $DOTFILES_DIR/ghostty/config → ~/.config/ghostty/config"
  ln -s "$DOTFILES_DIR/ghostty/config" ~/.config/ghostty/config
fi

# starship: ~/.config/starship.toml → dotfiles/starship/starship.toml
if [ -e ~/.config/starship.toml ] && [ ! -L ~/.config/starship.toml ]; then
  mv ~/.config/starship.toml ~/.config/starship.toml.bak
fi
if [ ! -e ~/.config/starship.toml ]; then
  echo "==> Linking $DOTFILES_DIR/starship/starship.toml → ~/.config/starship.toml"
  ln -s "$DOTFILES_DIR/starship/starship.toml" ~/.config/starship.toml
fi

# ---------------------------------------------------------------------------
# Install plugins headlessly
# ---------------------------------------------------------------------------
if command -v nvim &>/dev/null; then
  echo "==> Installing Neovim plugins..."
  nvim --headless "+Lazy! sync" +qa 2>/dev/null || true
fi

echo ""
echo "==> Linux setup complete!"
echo ""
echo "Notes:"
echo "  - Ghostty itself isn't installed by this script. See https://ghostty.org for install options on your distro."
echo "  - The macOS-specific option 'macos-titlebar-style' in ghostty/config is ignored on Linux — safe to leave."
echo "  - Open nvim and wait for plugins to finish. Then run :Lazy build markdown-preview.nvim and :checkhealth."
echo "  - Set your terminal's font to 'JetBrainsMono Nerd Font'."
