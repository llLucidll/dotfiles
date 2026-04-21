-- Diagnostic signs in the gutter
local signs = { Error = " ", Warn = " ", Hint = "󰠠 ", Info = " " }
for type, icon in pairs(signs) do
  local hl = "DiagnosticSign" .. type
  vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = "" })
end

-- Inline virtual text and floating windows
vim.diagnostic.config({
  virtual_text = { prefix = "●" },
  signs = true,
  underlines = true,
  update_in_insert = false,
  severity_sort = true,
  float = { border = "rounded", source = true },
})

-- Highlight error/warning lines with a tinted background
vim.api.nvim_set_hl(0, "DiagnosticLineError", { bg = "#2d0000" })
vim.api.nvim_set_hl(0, "DiagnosticLineWarn", { bg = "#2d2600" })

vim.api.nvim_create_autocmd("DiagnosticChanged", {
  callback = function()
    local ns = vim.api.nvim_create_namespace("diagnostic_lines")
    for _, buf in ipairs(vim.api.nvim_list_bufs()) do
      if vim.api.nvim_buf_is_valid(buf) then
        vim.api.nvim_buf_clear_namespace(buf, ns, 0, -1)
      end
    end
    local buf = vim.api.nvim_get_current_buf()
    local diagnostics = vim.diagnostic.get(buf)
    for _, d in ipairs(diagnostics) do
      local hl = d.severity == vim.diagnostic.severity.ERROR and "DiagnosticLineError"
        or d.severity == vim.diagnostic.severity.WARN and "DiagnosticLineWarn"
        or nil
      if hl and d.lnum < vim.api.nvim_buf_line_count(buf) then
        vim.api.nvim_buf_set_extmark(buf, ns, d.lnum, 0, { line_hl_group = hl, priority = 1 })
      end
    end
  end,
})
