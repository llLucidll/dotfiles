return {
  {
    "ahmedkhalf/project.nvim",
    config = function()
      require("project_nvim").setup({
        manual_mode = true,
        detection_methods = { "pattern", "lsp" },
        patterns = { ".git", "Makefile", "package.json", "Cargo.toml", "go.mod", ".project_root" },
        silent_chdir = true,
      })
    end,
  },
  {
    "goolord/alpha-nvim",
    event = "VimEnter",
    dependencies = { "ahmedkhalf/project.nvim" },
    config = function()
      local alpha = require("alpha")
      local theta = require("alpha.themes.theta")
      local dashboard = require("alpha.themes.dashboard")

      -- Header
      local header = {
        type = "text",
        val = {
          "                                                   ",
          "                                              ___  ",
          "                                           ,o88888 ",
          "                                        ,o8888888' ",
          "                  ,:o:o:oooo.        ,8O88Pd8888\"  ",
          "              ,.::.::o:ooooOoOoO. ,oO8O8Pd888'\"    ",
          "            ,.:.::o:ooOoOoOO8O8OOo.8OOPd8O8O\"      ",
          "           , ..:.::o:ooOoOOOO8OOOOo.FdO8O8\"        ",
          "          , ..:.::o:ooOoOO8O888O8O,COCOO\"          ",
          "         , . ..:.::o:ooOoOOOO8OOOOCOCO\"            ",
          "          . ..:.::o:ooOoOoOO8O8OCCCC\"o             ",
          "             . ..:.::o:ooooOoCoCCC\"o:o             ",
          "             . ..:.::o:o:,cooooCo\"oo:o:            ",
          "          `   . . ..:.:cocoooo\"'o:o:::'            ",
          "          .`   . ..::ccccoc\"'o:o:o:::'             ",
          "         :.:.    ,c:cccc\"':.:.:.:.:.'              ",
          "       ..:.:'`::::c:\"'..:.:.:.:.:.'               ",
          "     ...:.'.:.::::\"'    . . . . .'                 ",
          "    .. . ....:.\"' `   .  . . ''                    ",
          "  . . . ....\"'                                     ",
          "  .. . .\"'                                         ",
          " .                                                 ",
          "",
        },
        opts = { hl = "AlphaHeader", position = "center" },
      }

      -- Helper: pad a string to a given width
      local function pad(str, width)
        local stripped = str:gsub("\027%[[%d;]*m", "") -- strip ANSI if any
        local len = vim.fn.strdisplaywidth(stripped)
        if len >= width then
          return str
        end
        return str .. string.rep(" ", width - len)
      end

      -- Build the two-column section
      local function two_columns()
        -- Left column: action buttons
        local left_items = {
          { key = "n", icon = "󰈔 ", label = "New File" },
          { key = "e", icon = "󰉋 ", label = "File Explorer" },
          { key = "f", icon = "󰱼 ", label = "Find File" },
          { key = "g", icon = "󰊄 ", label = "Find Word" },
          { key = "p", icon = "󰏗 ", label = "Find Project" },
          { key = "s", icon = "󰁯 ", label = "Restore Session" },
          { key = "q", icon = "󰗼 ", label = "Quit" },
        }

        -- Right column: recent projects from project.nvim
        local project_list = {}
        local ok, history = pcall(require, "project_nvim.utils.history")
        if ok then
          local recent_projects = history.get_recent_projects() or {}
          for i = #recent_projects, 1, -1 do
            table.insert(project_list, recent_projects[i])
            if #project_list >= 5 then break end
          end
        end

        local left_col_width = 30
        local gap = "    "
        local right_col_width = 40

        local lines = {}
        local highlights = {}

        -- Column headers
        local left_header = pad("  Actions", left_col_width)
        local right_header = "  Recent Projects"
        table.insert(lines, left_header .. gap .. right_header)
        table.insert(highlights, { "SpecialComment", "SpecialComment" })
        table.insert(lines, "")
        table.insert(highlights, { nil, nil })

        -- Content rows
        local max_rows = math.max(#left_items, #project_list)
        for i = 1, max_rows do
          local left_str = ""
          local left_hl_key = nil
          local right_hl_key = nil

          if i <= #left_items then
            local item = left_items[i]
            left_str = "  " .. item.icon .. " " .. item.key .. "  " .. item.label
            left_hl_key = "action"
          end
          left_str = pad(left_str, left_col_width)

          local right_str = ""
          if i <= #project_list then
            local proj = project_list[i]
            local short = vim.fn.fnamemodify(proj, ":~")
            -- Truncate if too long
            if vim.fn.strdisplaywidth(short) > right_col_width - 8 then
              short = "..." .. short:sub(-(right_col_width - 11))
            end
            right_str = "  " .. tostring(i) .. "  " .. short
            right_hl_key = "project"
          end

          table.insert(lines, left_str .. gap .. right_str)
          table.insert(highlights, { left_hl_key, right_hl_key })
        end

        return lines, highlights, left_items, project_list, left_col_width, gap
      end

      local col_lines, col_highlights, left_items, project_list, left_col_width, gap = two_columns()

      local columns_section = {
        type = "text",
        val = col_lines,
        opts = {
          position = "center",
          hl = {},
        },
      }

      -- Apply highlights per line
      -- We'll do this after setup via autocmd

      -- Layout
      local config = theta.config
      config.layout = {
        { type = "padding", val = 1 },
        header,
        { type = "padding", val = 2 },
        columns_section,
        { type = "padding", val = 2 },
        dashboard.section.footer,
      }

      -- Color highlights
      vim.api.nvim_set_hl(0, "AlphaHeader", { fg = "#89b4fa" })
      vim.api.nvim_set_hl(0, "AlphaActions", { fg = "#a6e3a1" })
      vim.api.nvim_set_hl(0, "AlphaShortcut", { fg = "#f9e2af" })
      vim.api.nvim_set_hl(0, "AlphaProjectHeader", { fg = "#cba6f7" })
      vim.api.nvim_set_hl(0, "AlphaProject", { fg = "#89b4fa" })
      vim.api.nvim_set_hl(0, "AlphaProjectKey", { fg = "#f9e2af" })

      alpha.setup(config)

      -- Set up keybindings for the alpha buffer
      vim.api.nvim_create_autocmd("FileType", {
        pattern = "alpha",
        callback = function(ev)
          local buf = ev.buf
          local kopts = { noremap = true, silent = true, buffer = buf }

          -- Left column action shortcuts
          vim.keymap.set("n", "n", "<cmd>ene<CR>", kopts)
          vim.keymap.set("n", "e", "<cmd>NvimTreeToggle<CR>", kopts)
          vim.keymap.set("n", "f", "<cmd>Telescope find_files<CR>", kopts)
          vim.keymap.set("n", "g", "<cmd>Telescope live_grep<CR>", kopts)
          vim.keymap.set("n", "p", "<cmd>Telescope projects<CR>", kopts)
          vim.keymap.set("n", "s", "<cmd>AutoSession restore<CR>", kopts)
          vim.keymap.set("n", "q", "<cmd>qa<CR>", kopts)

          -- Right column project shortcuts (1-5)
          for i, proj_path in ipairs(project_list) do
            if i > 5 then break end
            vim.keymap.set("n", tostring(i), function()
              vim.cmd("cd " .. vim.fn.fnameescape(proj_path))
              vim.cmd("ene")
              -- Open file explorer or Telescope in the project
              vim.cmd("Telescope find_files")
            end, kopts)
          end
        end,
      })

      vim.cmd([[autocmd FileType alpha setlocal nofoldenable]])
    end,
  },
}
