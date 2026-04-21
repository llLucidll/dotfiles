return {
  -- Git blame
  {
    "f-person/git-blame.nvim",
    lazy = false,
    config = function()
      require("gitblame").setup({ enabled = true })
    end,
  },

  -- LazyGit
  {
    "kdheepak/lazygit.nvim",
    cmd = { "LazyGit", "LazyGitConfig", "LazyGitCurrentFile", "LazyGitFilter", "LazyGitFilterCurrentFile" },
    dependencies = { "nvim-lua/plenary.nvim" },
    keys = {
      { "<leader>lg", "<cmd>LazyGit<cr>", desc = "LazyGit" },
    },
  },

  -- Gitsigns: inline diff markers in the gutter
  {
    "lewis6991/gitsigns.nvim",
    event = "BufReadPre",
    config = function()
      require("gitsigns").setup({
        signs = {
          add = { text = "+" },
          change = { text = "~" },
          delete = { text = "_" },
          topdelete = { text = "‾" },
          changedelete = { text = "~" },
        },
        on_attach = function(bufnr)
          local gs = package.loaded.gitsigns
          local map = function(keys, func, desc)
            vim.keymap.set("n", keys, func, { buffer = bufnr, desc = desc })
          end
          map("]h", gs.next_hunk, "Next hunk")
          map("[h", gs.prev_hunk, "Previous hunk")
          map("<leader>hp", gs.preview_hunk, "Preview hunk")
          map("<leader>hr", gs.reset_hunk, "Reset hunk")
        end,
      })
    end,
  },

  -- Diffview: side-by-side git diff viewer
  {
    "sindrets/diffview.nvim",
    cmd = { "DiffviewOpen", "DiffviewFileHistory" },
    keys = {
      { "<leader>gd", "<cmd>DiffviewOpen<cr>", desc = "Git diff view" },
      { "<leader>gh", "<cmd>DiffviewFileHistory %<cr>", desc = "File git history" },
      { "<leader>gH", "<cmd>DiffviewFileHistory<cr>", desc = "Branch git history" },
      { "<leader>gq", "<cmd>DiffviewClose<cr>", desc = "Close diff view" },
    },
    config = function()
      require("diffview").setup()
    end,
  },
}
