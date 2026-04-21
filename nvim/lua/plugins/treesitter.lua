return {
  "nvim-treesitter/nvim-treesitter",
  event = { "BufReadPre", "BufNewFile" },
  build = ":TSUpdate",
  dependencies = { "windwp/nvim-ts-autotag" },
  config = function()
    local ok, configs = pcall(require, "nvim-treesitter.configs")
    if ok then
      configs.setup({
        highlight = { enable = true },
        indent = { enable = true },
        autotag = { enable = true },
        ensure_installed = {
          "json", "javascript", "typescript", "tsx", "yaml", "html", "css",
          "markdown", "markdown_inline", "bash", "lua", "vim", "vimdoc",
          "python", "ruby", "toml", "c", "query", "dockerfile", "gitignore",
        },
        incremental_selection = {
          enable = true,
          keymaps = {
            init_selection = "<C-space>",
            node_incremental = "<C-space>",
            scope_incremental = false,
            node_decremental = "<bs>",
          },
        },
      })
    else
      require("nvim-treesitter").setup({
        ensure_installed = {
          "json", "javascript", "typescript", "tsx", "yaml", "html", "css",
          "markdown", "markdown_inline", "bash", "lua", "vim", "vimdoc",
          "python", "ruby", "toml", "c", "query", "dockerfile", "gitignore",
        },
        auto_install = true,
      })
    end
  end,
}
