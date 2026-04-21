return {
  "rmagatti/auto-session",
  config = function()
    require("auto-session").setup({
      auto_restore_enabled = false,
      auto_save_enabled = false,
      auto_session_suppress_dirs = { "~/", "~/Dev/", "~/Downloads", "~/Documents", "~/Desktop/" },
      pre_save_cmds = { "NvimTreeClose" },
    })
    vim.keymap.set("n", "<leader>wr", "<cmd>AutoSession restore<CR>", { desc = "Restore session for cwd" })
    vim.keymap.set("n", "<leader>ws", "<cmd>AutoSession save<CR>", { desc = "Save session for auto session root dir" })
  end,
}
