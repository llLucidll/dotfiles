/**
 * Lucid Tool Cards
 *
 * Catppuccin powerline-flavoured renderers for common built-in tools.
 * Execution still delegates to Pi's built-in tools; this only changes TUI rendering.
 */

import type { BashToolDetails, ExtensionAPI, ReadToolDetails, ToolRenderContext } from "@mariozechner/pi-coding-agent";
import { createBashTool, createReadTool, createWriteTool } from "@mariozechner/pi-coding-agent";
import { Text, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

const RESET = "\x1b[0m";
const CATPPUCCIN = {
	crust: "#11111b",
	base: "#1e1e2e",
	text: "#cdd6f4",
	subtext0: "#a6adc8",
	overlay1: "#7f849c",
	red: "#f38ba8",
	peach: "#fab387",
	yellow: "#f9e2af",
	green: "#a6e3a1",
	teal: "#94e2d5",
	sapphire: "#74c7ec",
	blue: "#89b4fa",
	lavender: "#b4befe",
	mauve: "#cba6f7",
	pink: "#f5c2e7",
};

type Accent = keyof typeof CATPPUCCIN;

function rgb(hex: string): string {
	const clean = hex.replace(/^#/, "");
	const r = Number.parseInt(clean.slice(0, 2), 16);
	const g = Number.parseInt(clean.slice(2, 4), 16);
	const b = Number.parseInt(clean.slice(4, 6), 16);
	return `${r};${g};${b}`;
}

function fg(hex: string, text: string): string {
	return `\x1b[38;2;${rgb(hex)}m${text}${RESET}`;
}

function fgBg(foreground: string, background: string, text: string): string {
	return `\x1b[38;2;${rgb(foreground)}m\x1b[48;2;${rgb(background)}m${text}${RESET}`;
}

function dim(text: string): string {
	return fg(CATPPUCCIN.overlay1, text);
}

function shortenPath(raw: unknown, cwd?: string): string {
	if (typeof raw !== "string" || raw.length === 0) return "—";
	const home = process.env.HOME || process.env.USERPROFILE;
	let value = raw;
	if (cwd && value.startsWith(cwd)) value = value.slice(cwd.length).replace(/^\//, "");
	if (home && value.startsWith(home)) value = `~${value.slice(home.length)}`;
	return value || ".";
}

function firstText(result: { content?: Array<{ type: string; text?: string }> }): string {
	return result.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("\n") ?? "";
}

function lineCount(text: string): number {
	if (!text) return 0;
	return text.split("\n").filter((line) => line.length > 0).length;
}

function card(tool: string, detail: string, accent: Accent, icon = ""): string {
	const bg = CATPPUCCIN[accent];
	return [
		fg(bg, icon),
		fgBg(CATPPUCCIN.crust, bg, ` ${tool} `),
		fgBg(bg, CATPPUCCIN.base, ""),
		fgBg(CATPPUCCIN.text, CATPPUCCIN.base, ` ${detail} `),
		fg(CATPPUCCIN.base, ""),
	].join("");
}

function statusLine(status: string, accent: Accent, details?: string): string {
	const marker = accent === "red" ? "✗" : accent === "peach" ? "◌" : "✓";
	return `  ${fg(CATPPUCCIN[accent], marker)} ${fg(CATPPUCCIN.text, status)}${details ? dim(` · ${details}`) : ""}`;
}

function previewLines(text: string, maxLines: number, width: number): string[] {
	return text
		.split("\n")
		.filter((line) => line.length > 0)
		.slice(0, maxLines)
		.map((line) => `  ${dim(truncateToWidth(line, Math.max(10, width - 2), "…"))}`);
}

function renderTextBlock(lines: string[]): Text {
	return new Text(lines.join("\n"), 0, 0);
}

export default function (pi: ExtensionAPI) {
	const cwd = process.cwd();

	const readTool = createReadTool(cwd);
	pi.registerTool({
		name: "read",
		label: readTool.label ?? "read",
		description: readTool.description,
		parameters: readTool.parameters,
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			return readTool.execute(toolCallId, params, signal, onUpdate, ctx);
		},
		renderCall(args, _theme, context: ToolRenderContext<any, any>) {
			const parts = [];
			if (args.offset) parts.push(`@${args.offset}`);
			if (args.limit) parts.push(`≤${args.limit}`);
			const suffix = parts.length ? ` ${parts.join(" ")}` : "";
			return new Text(card("read", shortenPath(args.path, context.cwd) + suffix, "sapphire"), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, _theme, context) {
			if (isPartial) return renderTextBlock([statusLine("reading", "peach")]);
			if (context.isError) return renderTextBlock([statusLine(firstText(result).split("\n")[0] || "read failed", "red")]);

			const text = firstText(result);
			const details = result.details as ReadToolDetails | undefined;
			const summary = details?.truncation?.truncated
				? `${lineCount(text)} shown · truncated from ${details.truncation.totalLines}`
				: `${lineCount(text)} lines`;
			const lines = [statusLine("loaded", "green", summary)];
			if (expanded) lines.push(...previewLines(text, 14, 100));
			return renderTextBlock(lines);
		},
	});

	const bashTool = createBashTool(cwd);
	pi.registerTool({
		name: "bash",
		label: bashTool.label ?? "bash",
		description: bashTool.description,
		parameters: bashTool.parameters,
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			return bashTool.execute(toolCallId, params, signal, onUpdate, ctx);
		},
		renderCall(args, _theme) {
			const command = truncateToWidth(args.command ?? "", 110, "…");
			const suffix = args.timeout ? ` timeout=${args.timeout}s` : "";
			return new Text(card("bash", command + suffix, "peach"), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, _theme, context) {
			if (isPartial) return renderTextBlock([statusLine("running", "peach")]);
			const text = firstText(result);
			const exitMatch = text.match(/(?:exit code|code):\s*(\d+)/i) ?? text.match(/Command exited with code (\d+)/i);
			const exitCode = exitMatch ? Number.parseInt(exitMatch[1]!, 10) : context.isError ? 1 : 0;
			const details = result.details as BashToolDetails | undefined;
			const truncated = details?.truncation?.truncated ? " · truncated" : "";
			const lines = [exitCode === 0
				? statusLine("done", "green", `${lineCount(text)} lines${truncated}`)
				: statusLine(`exit ${exitCode}`, "red", `${lineCount(text)} lines${truncated}`)];
			if (expanded) lines.push(...previewLines(text, 20, 100));
			return renderTextBlock(lines);
		},
	});

	const writeTool = createWriteTool(cwd);
	pi.registerTool({
		name: "write",
		label: writeTool.label ?? "write",
		description: writeTool.description,
		parameters: writeTool.parameters,
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			return writeTool.execute(toolCallId, params, signal, onUpdate, ctx);
		},
		renderCall(args, _theme, context: ToolRenderContext<any, any>) {
			const lines = typeof args.content === "string" ? args.content.split("\n").length : "?";
			return new Text(card("write", `${shortenPath(args.path, context.cwd)} · ${lines} lines`, "lavender"), 0, 0);
		},
		renderResult(result, { isPartial }, _theme, context) {
			if (isPartial) return renderTextBlock([statusLine("writing", "peach")]);
			if (context.isError) return renderTextBlock([statusLine(firstText(result).split("\n")[0] || "write failed", "red")]);
			return renderTextBlock([statusLine("written", "green")]);
		},
	});
}
