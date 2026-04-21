#!/bin/bash
# setup-neovim.sh — Install and configure Neovim with all plugins and dependencies
set -e

echo "==> Setting up Neovim..."

# Check for Homebrew
if ! command -v brew &>/dev/null; then
  echo "Error: Homebrew is required. Install it first:"
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi

# Install Neovim and dependencies
echo "==> Installing Neovim and dependencies..."
brew install neovim ripgrep fd gcc node npm lazygit

# Install Nerd Font
echo "==> Installing JetBrains Mono Nerd Font..."
brew install --cask font-jetbrains-mono-nerd-font

# Locate the dotfiles repo (the script lives at <repo>/nvim/scripts/setup-neovim.sh)
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

# Back up an existing ~/.config/nvim if it isn't already our symlink
mkdir -p ~/.config
if [ -e ~/.config/nvim ] && [ ! -L ~/.config/nvim ]; then
  echo "==> Backing up existing Neovim config to ~/.config/nvim.bak..."
  mv ~/.config/nvim ~/.config/nvim.bak
  mv ~/.local/share/nvim ~/.local/share/nvim.bak 2>/dev/null || true
  mv ~/.local/state/nvim ~/.local/state/nvim.bak 2>/dev/null || true
  mv ~/.cache/nvim ~/.cache/nvim.bak 2>/dev/null || true
fi

# Symlink the repo's nvim/ into ~/.config/nvim
if [ ! -e ~/.config/nvim ]; then
  echo "==> Linking $DOTFILES_DIR/nvim → ~/.config/nvim"
  ln -s "$DOTFILES_DIR/nvim" ~/.config/nvim
fi

# Install plugins headlessly
echo "==> Installing plugins..."
nvim --headless "+Lazy! sync" +qa 2>/dev/null || true

echo ""
echo "==> Neovim setup complete!"
echo ""
echo "Next steps:"
echo "  1. Open nvim and wait for all plugins to finish installing"
echo "  2. Restart Neovim after first launch"
echo "  3. Run :Lazy build markdown-preview.nvim"
echo "  4. Run :checkhealth to verify everything works"
echo "  5. Set your terminal font to JetBrainsMono Nerd Font (Ghostty config handles this automatically)"
