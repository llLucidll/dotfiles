-- Split navigation
vim.keymap.set("n", "<C-h>", "<C-w>h", { silent = true })
vim.keymap.set("n", "<C-j>", "<C-w>j", { silent = true })
vim.keymap.set("n", "<C-k>", "<C-w>k", { silent = true })
vim.keymap.set("n", "<C-l>", "<C-w>l", { silent = true })

-- Splits (using <leader>s prefix to avoid conflicts)
vim.keymap.set("n", "<leader>sv", "<cmd>vsplit<cr>", { desc = "Split right", silent = true })
vim.keymap.set("n", "<leader>sh", "<cmd>split<cr>", { desc = "Split below", silent = true })
vim.keymap.set("n", "<leader>sc", "<cmd>close<cr>", { desc = "Close split", silent = true })

-- Buffers (tabs)
vim.keymap.set("n", "<Tab>", "<cmd>BufferLineCycleNext<cr>", { desc = "Next tab", silent = true })
vim.keymap.set("n", "<S-Tab>", "<cmd>BufferLineCyclePrev<cr>", { desc = "Previous tab", silent = true })
vim.keymap.set("n", "<leader>c", function()
  local buf = vim.api.nvim_get_current_buf()
  vim.cmd("BufferLineCyclePrev")
  vim.cmd("bdelete! " .. buf)
end, { desc = "Close tab", silent = true })

-- Clipboard: always yank to system clipboard
vim.keymap.set("n", "y", '"+y', { desc = "Yank to clipboard", silent = true })
vim.keymap.set("v", "y", '"+y', { desc = "Yank to clipboard", silent = true })
vim.keymap.set("n", "Y", '"+Y', { desc = "Yank line to clipboard", silent = true })
vim.keymap.set("n", "p", '"+p', { desc = "Paste from clipboard", silent = true })
vim.keymap.set("n", "P", '"+P', { desc = "Paste from clipboard before", silent = true })
vim.keymap.set("v", "p", '"+p', { desc = "Paste from clipboard", silent = true })

-- Clipboard (Cmd+C / Cmd+V for GUI/terminals that support it)
vim.keymap.set("n", "<D-c>", '"+y', { desc = "Copy to clipboard", silent = true })
vim.keymap.set("v", "<D-c>", '"+y', { desc = "Copy to clipboard", silent = true })
vim.keymap.set("n", "<D-v>", '"+p', { desc = "Paste from clipboard", silent = true })
vim.keymap.set("i", "<D-v>", "<C-r>+", { desc = "Paste from clipboard", silent = true })
vim.keymap.set("t", "<D-v>", function()
  local clipboard = vim.fn.getreg("+")
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes(clipboard, true, true, true), "t", false)
end, { desc = "Paste from clipboard", silent = true })

-- Redo
vim.keymap.set("n", "<C-r>", "<cmd>redo<cr>", { desc = "Redo", silent = true })

-- Format
vim.keymap.set("n", "<leader>lf", function() vim.lsp.buf.format({ async = true }) end, { desc = "Format file", silent = true })
vim.keymap.set("v", "<leader>lf", function() vim.lsp.buf.format({ async = true }) end, { desc = "Format selection", silent = true })

-- Terminal
vim.keymap.set("n", "<leader>th", "<cmd>belowright split | terminal<cr>", { desc = "Terminal below", silent = true })
vim.keymap.set("n", "<leader>tv", "<cmd>belowright vsplit | terminal<cr>", { desc = "Terminal right", silent = true })
vim.keymap.set("t", "<Esc>", "<Esc>", { silent = true })
vim.keymap.set("t", "<C-n>", [[<C-\><C-n>]], { silent = true })
vim.keymap.set("t", "<C-h>", [[<C-\><C-n><C-w>h]], { silent = true })
vim.keymap.set("t", "<C-j>", [[<C-\><C-n><C-w>j]], { silent = true })
vim.keymap.set("t", "<C-k>", [[<C-\><C-n><C-w>k]], { silent = true })
vim.keymap.set("t", "<C-l>", [[<C-\><C-n><C-w>l]], { silent = true })
