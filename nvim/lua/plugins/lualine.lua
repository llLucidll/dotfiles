return {
  "nvim-lualine/lualine.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  event = "VimEnter",
  config = function()
    local lazy_status = require("lazy.status")

    require("lualine").setup({
      options = { theme = "catppuccin" },
      sections = {
        lualine_a = { "mode" },
        lualine_b = {
          {
            "branch",
            icon = "",
            fmt = function(str)
              if str == "" or str == nil or str == ".invalid" or str:match("^%.") then
                local handle = io.popen("git rev-parse --abbrev-ref HEAD 2>/dev/null")
                if handle then
                  local result = handle:read("*a"):gsub("%s+$", "")
                  handle:close()
                  if result ~= "" then return result end
                end
              end
              return str
            end,
          },
          "diff",
          "diagnostics",
        },
        lualine_c = { "filename" },
        lualine_x = {
          {
            function() return require("lsp-progress").progress() end,
          },
          {
            lazy_status.updates,
            cond = lazy_status.has_updates,
            color = { fg = "#ff9e64" },
          },
          { "encoding" },
          { "fileformat" },
          { "filetype" },
        },
        lualine_y = { "progress" },
        lualine_z = { "location" },
      },
    })
  end,
}
