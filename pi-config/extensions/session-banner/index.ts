/**
 * Session Banner — persistent visual identity for Pi sessions.
 *
 * Shows a colored banner widget above the editor with:
 *   emoji │ session name
 *
 * Auto-labels sessions via a tool the LLM calls on its first response.
 * Also sets the terminal/tab title for Ghostty Cmd+Tab identification.
 *
 * Commands:
 *   /title <text>  — manually name the session
 *   /title         — ask the LLM to generate a name from conversation
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

import {
	buildTerminalTitle,
	detectWorldContext,
	fgHex,
	parseSessionName,
	randomEmoji,
	randomTitleColor,
} from "./helpers.js";

export default function (pi: ExtensionAPI) {
	let label = "";
	let emoji = "";
	let titleColor = "";
	let currentCtx: ExtensionContext | null = null;

	// ─── Banner rendering ─────────────────────────────────────────────

	function renderBanner(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;

		const { treeName, zone } = detectWorldContext(ctx.cwd);

		// Terminal / tab title (always set, even without label)
		ctx.ui.setTitle(buildTerminalTitle(treeName, zone, emoji, label));

		// Session name for /resume list
		if (label) {
			pi.setSessionName(`${emoji} ${label}`);
		}

		// The session name is already shown in the Starship-style footer, so keep
		// the original session-banner widget hidden while preserving terminal title,
		// /resume naming, /title, and the set_session_label tool.
		ctx.ui.setWidget("session-banner", undefined);
	}

	// ─── Auto-label tool ──────────────────────────────────────────────

	pi.registerTool({
		name: "set_session_label",
		label: "Set Session Label",
		description:
			"Set a short label for the current session. The label is shown in the terminal title, " +
			"a persistent banner, and the session list. Keep it to 2-5 words. " +
			"IMPORTANT: This tool will REJECT the call if the session already has a label, " +
			"unless force is set to true. Only use force when the user explicitly asks to rename.",
		promptSnippet: "Label the current session with a short 2-5 word description",
		promptGuidelines: [
			"RULES FOR set_session_label (STRICT — NO EXCEPTIONS):\n" +
			"1. ONLY call set_session_label on your VERY FIRST response in a session that has NO label yet.\n" +
			"2. If the session ALREADY HAS a label (from /title, /name, a previous call, or a resumed session), " +
			"do NOT call set_session_label. The tool will reject it anyway.\n" +
			"3. NEVER rename a session. If the user changes topic mid-session, the original name stays.\n" +
			"4. The ONLY exception: the user explicitly says 'rename this session' or 'change the session name'. " +
			"In that case, pass force: true.\n" +
			"5. Do NOT ask the user what to name it — just pick a good 2-5 word name from context.\n" +
			"Examples: 'shipping 3DS refactor', 'fix flaky pagination test', 'breadth resolver migration'.",
		],
		parameters: Type.Object({
			label: Type.String({
				description: "Short 2-5 word session label, e.g. 'fix checkout tax bug'",
			}),
			force: Type.Optional(
				Type.Boolean({
					description:
						"Force-rename even if the session already has a label. " +
						"Only set to true when the user explicitly asks to rename the session.",
				}),
			),
		}),
		async execute(_toolCallId, params) {
			const previousLabel = label;
			label = (params.label || "").trim();

			if (previousLabel && !params.force) {
				label = previousLabel;
				return {
					content: [
						{
							type: "text",
							text: `Session already labeled: ${emoji} ${previousLabel} — not renamed. ` +
								"Use force: true only if the user explicitly asked to rename.",
						},
					],
					details: { label, emoji, rejected: true },
				};
			}

			if (label) {
				emoji = randomEmoji();
				titleColor = randomTitleColor();
				pi.setSessionName(`${emoji} ${label}`);
				if (currentCtx) renderBanner(currentCtx);
			}

			return {
				content: [{ type: "text", text: label ? `Session labeled: ${emoji} ${label}` : "Label cleared" }],
				details: { label, emoji, rejected: false },
			};
		},
	});

	// ─── Lifecycle ────────────────────────────────────────────────────

	function restoreState() {
		const parsed = parseSessionName(pi.getSessionName() || "");
		emoji = parsed.emoji;
		label = parsed.label;
		titleColor = parsed.titleColor;
	}

	pi.on("session_start", async (_event, ctx) => {
		currentCtx = ctx;
		restoreState();
		renderBanner(ctx);
	});

	pi.on("session_switch", async (_event, ctx) => {
		currentCtx = ctx;
		restoreState();
		renderBanner(ctx);
	});

	pi.on("agent_start", async (_event, ctx) => {
		currentCtx = ctx;
	});

	// ─── Commands ─────────────────────────────────────────────────────

	pi.registerCommand("title", {
		description: "Name this session. With args: set directly. Without: LLM generates one.",
		handler: async (args, ctx) => {
			const input = (args || "").trim();

			if (input) {
				label = input;
				emoji = randomEmoji();
				titleColor = randomTitleColor();
				pi.setSessionName(`${emoji} ${label}`);
				renderBanner(ctx);
				ctx.ui.notify(`Session named: ${emoji} ${label}`, "info");
			} else {
				pi.sendUserMessage(
					"Look at our conversation so far and call set_session_label with a short 2-5 word name for this session. " +
					"Use force: true since the user is explicitly requesting a rename. Just call the tool, no other commentary.",
					{ deliverAs: "followUp" },
				);
			}
		},
	});
}
