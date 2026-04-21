return {
  {
    "vyfor/cord.nvim",
    build = "cargo build --release",
    event = "VeryLazy",
    opts = {
      usercmds = true,
      timer = {
        enable = true,
        interval = 1500,
        reset_on_idle = false,
        reset_on_change = false,
      },
      editor = {
        tooltip = "Neovim",
      },
      display = {
        show_time = true,
        show_repository = false,
        show_cursor_position = false,
      },
      text = {
        editing = function(opts) return 'Editing a file' end,
        viewing = function(opts) return 'Viewing a file' end,
        workspace = '',
      },
      idle = {
        enable = true,
        timeout = 300000,
        show_status = true,
      },
    },
  },
}
