return {
  "nvim-tree/nvim-tree.lua",
  dependencies = "nvim-tree/nvim-web-devicons",
  lazy = false,
  keys = {
    { "<leader>e", "<cmd>NvimTreeToggle<cr>", desc = "Toggle file explorer" },
  },
  config = function()
    -- Close any conflicting NvimTree buffers before setup
    for _, buf in ipairs(vim.api.nvim_list_bufs()) do
      local name = vim.api.nvim_buf_get_name(buf)
      if name:match("NvimTree") then
        pcall(vim.api.nvim_buf_delete, buf, { force = true })
      end
    end

    require("nvim-tree").setup({
      view = { width = 35, relativenumber = true },
      update_focused_file = { enable = true },
      renderer = {
        highlight_git = "name",
        indent_markers = { enable = true },
        icons = {
          git_placement = "after",
          show = { git = true },
          glyphs = {
            folder = { arrow_closed = "", arrow_open = "" },
            git = {
              unstaged = "", staged = "", unmerged = "",
              renamed = "➜", untracked = "★", deleted = "", ignored = "◌",
            },
          },
        },
      },
      actions = { open_file = { window_picker = { enable = false } } },
      filters = { custom = { ".DS_Store" } },
      git = { ignore = false },
    })

    -- Git colors in NvimTree
    vim.api.nvim_set_hl(0, "NvimTreeGitIgnored", { fg = "#6b727f", italic = true })
    vim.api.nvim_set_hl(0, "NvimTreeGitNew", { fg = "#73daca" })
    vim.api.nvim_set_hl(0, "NvimTreeGitDirty", { fg = "#e0af68" })
    vim.api.nvim_set_hl(0, "NvimTreeGitStaged", { fg = "#9ece6a" })
    vim.api.nvim_set_hl(0, "NvimTreeGitDeleted", { fg = "#f7768e" })
  end,
}
