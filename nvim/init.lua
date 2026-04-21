-- Leader key (must be set before lazy.nvim)
vim.g.mapleader = " "

-- Basic options
vim.opt.termguicolors = true
vim.opt.guicursor = "n-v-c-sm:block-blinkwait300-blinkon200-blinkoff150,i-ci-ve:ver25-blinkwait300-blinkon200-blinkoff150,r-cr-o:hor20-blinkwait300-blinkon200-blinkoff150"
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.timeoutlen = 300
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.softtabstop = 2
vim.opt.expandtab = true
vim.opt.smartindent = true
vim.opt.wrap = false
vim.opt.scrolloff = 8
vim.opt.signcolumn = "yes"
vim.opt.cursorline = true

-- Autosave when leaving insert mode or losing focus
vim.api.nvim_create_autocmd({ "InsertLeave", "FocusLost", "BufLeave" }, {
  callback = function()
    local buf = vim.api.nvim_get_current_buf()
    if vim.bo[buf].modified and vim.bo[buf].modifiable and vim.bo[buf].buftype == "" and vim.fn.expand("%") ~= "" then
      vim.cmd("silent! write")
    end
  end,
})

-- Disable netrw (using nvim-tree instead)
vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

-- Git-blame: show in statusline, not inline
vim.g.gitblame_display_virtual_text = 0

-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Load plugins from lua/plugins/
require("lazy").setup("plugins")

-- Diagnostics
require("config.diagnostics")

-- Keymaps
require("config.keymaps")
