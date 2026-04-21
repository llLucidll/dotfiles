# dotfiles

Personal config for Neovim and Ghostty on macOS.

## Layout

```
dotfiles/
├── nvim/      → ~/.config/nvim
└── ghostty/   → ~/Library/Application Support/com.mitchellh.ghostty
```

## Install

Clone and symlink (backs up any existing configs first):

```bash
git clone git@github.com:llLucidll/dotfiles.git ~/dotfiles

# nvim
[ -e ~/.config/nvim ] && mv ~/.config/nvim ~/.config/nvim.bak
ln -s ~/dotfiles/nvim ~/.config/nvim

# ghostty
GHOSTTY_DIR="$HOME/Library/Application Support/com.mitchellh.ghostty"
[ -e "$GHOSTTY_DIR/config" ] && mv "$GHOSTTY_DIR/config" "$GHOSTTY_DIR/config.bak"
mkdir -p "$GHOSTTY_DIR"
ln -s ~/dotfiles/ghostty/config "$GHOSTTY_DIR/config"
```

Then run the nvim setup script to install dependencies:

```bash
~/dotfiles/nvim/scripts/setup-neovim.sh
```

See [`nvim/README.md`](nvim/README.md) for the full Neovim setup notes.

## Attribution

The Neovim configuration was originally based on [alvina-yang/NeoVim](https://github.com/alvina-yang/NeoVim) and has been customized from there.
