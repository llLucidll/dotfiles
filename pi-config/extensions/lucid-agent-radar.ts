/**
 * Lucid Agent Radar
 *
 * Small Catppuccin activity chip for the footer meta line.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

const RESET = "\x1b[0m";
const CATPPUCCIN = {
	pink: "#f5c2e7",
	mauve: "#cba6f7",
	red: "#f38ba8",
	peach: "#fab387",
	yellow: "#f9e2af",
	green: "#a6e3a1",
	teal: "#94e2d5",
	sapphire: "#74c7ec",
	blue: "#89b4fa",
	lavender: "#b4befe",
	subtext0: "#a6adc8",
	overlay1: "#7f849c",
};

type Color = keyof typeof CATPPUCCIN;

const FRAMES = ["◦", "•", "●", "•"];
const STATUS_KEY = "00-lucid-radar";

interface Activity {
	icon: string;
	label: string;
	color: Color;
	startedAt: number;
	sticky?: boolean;
}

function rgb(hex: string): string {
	const clean = hex.replace(/^#/, "");
	const r = Number.parseInt(clean.slice(0, 2), 16);
	const g = Number.parseInt(clean.slice(2, 4), 16);
	const b = Number.parseInt(clean.slice(4, 6), 16);
	return `${r};${g};${b}`;
}

function fg(color: Color, text: string): string {
	return `\x1b[38;2;${rgb(CATPPUCCIN[color])}m${text}${RESET}`;
}

function toolActivity(toolName: string, args: any): Activity {
	const path = typeof args?.path === "string" ? args.path.split("/").pop() : undefined;
	const detail = path ? ` ${path}` : "";
	switch (toolName) {
		case "read":
			return { icon: "󰆍", label: `reading${detail}`, color: "sapphire", startedAt: Date.now() };
		case "edit":
			return { icon: "󰏫", label: `editing${detail}`, color: "green", startedAt: Date.now() };
		case "write":
			return { icon: "󰆓", label: `writing${detail}`, color: "lavender", startedAt: Date.now() };
		case "bash":
			return { icon: "󰒋", label: "running shell", color: "peach", startedAt: Date.now() };
		case "subagent":
			return { icon: "󰚩", label: "subagent", color: "pink", startedAt: Date.now() };
		default:
			return { icon: "󰆧", label: toolName, color: "teal", startedAt: Date.now() };
	}
}

function renderActivity(activity: Activity, frameIndex: number): string {
	const frame = activity.sticky ? "" : `${fg(activity.color, FRAMES[frameIndex % FRAMES.length]!)} `;
	return `${frame}${fg(activity.color, activity.icon)} ${fg("subtext0", activity.label)}`;
}

export default function (pi: ExtensionAPI) {
	let activity: Activity = { icon: "󰁔", label: "idle", color: "overlay1", sticky: true, startedAt: Date.now() };
	let frameIndex = 0;
	let interval: ReturnType<typeof setInterval> | undefined;
	let activeTools = 0;
	let lastCtx: ExtensionContext | undefined;

	function setActivity(ctx: ExtensionContext, next: Activity): void {
		lastCtx = ctx;
		activity = next;
		ctx.ui.setStatus(STATUS_KEY, renderActivity(activity, frameIndex));
	}

	function refresh(): void {
		if (!lastCtx) return;
		frameIndex++;
		lastCtx.ui.setStatus(STATUS_KEY, renderActivity(activity, frameIndex));
	}

	function idleSoon(ctx: ExtensionContext): void {
		setTimeout(() => {
			if (activeTools === 0 && Date.now() - activity.startedAt > 900) {
				setActivity(ctx, { icon: "󰁔", label: "idle", color: "overlay1", sticky: true, startedAt: Date.now() });
			}
		}, 1200);
	}

	pi.on("session_start", async (_event, ctx) => {
		lastCtx = ctx;
		setActivity(ctx, activity);
		interval = setInterval(refresh, 280);
	});

	pi.on("turn_start", async (_event, ctx) => {
		setActivity(ctx, { icon: "󰚩", label: "thinking", color: "mauve", startedAt: Date.now() });
	});

	pi.on("message_update", async (_event, ctx) => {
		if (activeTools === 0) setActivity(ctx, { icon: "󱜙", label: "streaming", color: "teal", startedAt: Date.now() });
	});

	pi.on("tool_execution_start", async (event, ctx) => {
		activeTools++;
		setActivity(ctx, toolActivity(event.toolName, event.args));
	});

	pi.on("tool_execution_end", async (event, ctx) => {
		activeTools = Math.max(0, activeTools - 1);
		setActivity(ctx, event.isError
			? { icon: "", label: `${event.toolName} failed`, color: "red", sticky: true, startedAt: Date.now() }
			: { icon: "✓", label: `${event.toolName} done`, color: "green", sticky: true, startedAt: Date.now() });
		idleSoon(ctx);
	});

	pi.on("turn_end", async (_event, ctx) => {
		activeTools = 0;
		setActivity(ctx, { icon: "✓", label: "ready", color: "green", sticky: true, startedAt: Date.now() });
		idleSoon(ctx);
	});

	pi.on("session_shutdown", async () => {
		if (interval) clearInterval(interval);
		interval = undefined;
		lastCtx?.ui.setStatus(STATUS_KEY, undefined);
	});
}
