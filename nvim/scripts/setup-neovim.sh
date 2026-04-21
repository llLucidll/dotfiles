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

# Backup existing config
if [ -d ~/.config/nvim ] && [ ! -f ~/.config/nvim/init.lua ]; then
  echo "==> Backing up existing Neovim config..."
  mv ~/.config/nvim ~/.config/nvim.bak 2>/dev/null || true
  mv ~/.local/share/nvim ~/.local/share/nvim.bak 2>/dev/null || true
  mv ~/.local/state/nvim ~/.local/state/nvim.bak 2>/dev/null || true
  mv ~/.cache/nvim ~/.cache/nvim.bak 2>/dev/null || true
fi

# Clone config if not already present
if [ ! -f ~/.config/nvim/init.lua ]; then
  echo "==> Cloning Neovim configuration..."
  git clone https://github.com/alvina-yang/NeoVim.git ~/.config/nvim
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
