---
summary: Persistent visual banner showing session name and emoji above the editor.
commands: [/title]
tools: [set_session_label]
category: productivity
keywords: [session, banner, identity, naming, emoji]
---

# Session Banner

Persistent visual identity for Pi sessions — know which window is which at a glance.

Local customization: the above-editor banner widget is hidden because the Starship-style footer already shows the session name. The extension still sets terminal titles, session names, `/title`, and `set_session_label`.

## What it does

Shows a colored banner widget above the input editor:

```
──────────────────────────────────────────────────
  🔮  │  fix checkout tax bug
──────────────────────────────────────────────────
```

Three layers of identification:

| Layer | Where visible | What it shows |
|-------|--------------|---------------|
| **Banner widget** | Above the editor (always visible) | emoji │ name |
| **Terminal title** | Ghostty tab bar + Cmd+Tab | `π root //areas/core — 🔮 fix bug` |
| **Session name** | `/resume` session list | `🔮 fix checkout tax bug` |

## Auto-labeling

Registers a `set_session_label` tool that the LLM calls automatically on its first response in an unlabeled session. The LLM picks a short 2-5 word name from context — no manual naming needed.

The banner stays hidden until a label is set, keeping the UI clean for quick one-off sessions.

## Commands

### `/title [text]`

- **With args**: Set the session name directly (e.g., `/title fix checkout tax bug`)
- **Without args**: Ask the LLM to generate a name from the conversation

## Opt-in install

This extension is not auto-loaded. Enable it via `pi config` or add it to your settings:

```json
{
  "source": "https://github.com/shopify-playground/shop-pi-fy",
  "extensions": ["+extensions/session-banner"]
}
```

## World Monorepo Support

Auto-detects the worktree name (`root`, `t1`, `t2`, ...) and zone path from the cwd for the terminal title. Each session gets a random emoji and title color for quick visual identification across multiple windows.
