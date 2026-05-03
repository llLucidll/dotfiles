/**
 * Delta Edit Diff
 *
 * Re-renders Pi's built-in edit tool result with delta. The edit behavior is
 * unchanged; only the TUI rendering is customized.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import type { Component } from "@mariozechner/pi-tui";
import {
	createEditToolDefinition,
	type EditToolDetails,
	type ExtensionAPI,
	type ToolRenderContext,
} from "@mariozechner/pi-coding-agent";
import { Text, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

const DEFAULT_DELTA_BIN = process.env.PI_DELTA_BIN || process.env.DELTA_BIN || "delta";
const DEFAULT_DELTA_THEME = process.env.PI_DELTA_THEME || "Catppuccin Mocha";
const SIDE_BY_SIDE_MIN_WIDTH = Number(process.env.PI_DELTA_SIDE_BY_SIDE_MIN_WIDTH || 120);
const MAX_BUFFER_BYTES = 10 * 1024 * 1024;
const RESET = "\x1b[0m";
const CATPPUCCIN = {
	crust: "#11111b",
	base: "#1e1e2e",
	text: "#cdd6f4",
	green: "#a6e3a1",
	red: "#f38ba8",
	mauve: "#cba6f7",
};

interface ParsedDiffLine {
	prefix: "+" | "-" | " ";
	lineNum?: number;
	content: string;
}

function shortenPath(filePath: string): string {
	const home = process.env.HOME || process.env.USERPROFILE;
	if (home && filePath.startsWith(home)) return `~${filePath.slice(home.length)}`;
	return filePath;
}

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

function editCard(filePath: string): string {
	return [
		fg(CATPPUCCIN.mauve, ""),
		fgBg(CATPPUCCIN.crust, CATPPUCCIN.mauve, " edit "),
		fgBg(CATPPUCCIN.mauve, CATPPUCCIN.base, ""),
		fgBg(CATPPUCCIN.text, CATPPUCCIN.base, ` ${shortenPath(filePath)} `),
		fg(CATPPUCCIN.base, ""),
	].join("");
}

function countChanges(diff: string): { additions: number; removals: number } {
	let additions = 0;
	let removals = 0;
	for (const line of diff.split("\n")) {
		if (line.startsWith("+") && /^\+\s*\d+\s/.test(line)) additions++;
		if (line.startsWith("-") && /^-\s*\d+\s/.test(line)) removals++;
	}
	return { additions, removals };
}

function parsePiDiffLine(line: string): ParsedDiffLine | undefined {
	const match = line.match(/^([+\- ])(\s*\d*)\s(.*)$/);
	if (!match) return undefined;
	const rawNum = match[2]?.trim();
	return {
		prefix: match[1] as ParsedDiffLine["prefix"],
		lineNum: rawNum ? Number.parseInt(rawNum, 10) : undefined,
		content: match[3] ?? "",
	};
}

function toUnifiedGitDiff(piDiff: string, filePath: string): string {
	const records: ParsedDiffLine[] = [];
	for (const rawLine of piDiff.split("\n")) {
		if (rawLine.length === 0) continue;
		const parsed = parsePiDiffLine(rawLine);
		records.push(parsed ?? { prefix: " ", content: rawLine });
	}

	const firstOld = records.find((line) => line.prefix !== "+" && line.lineNum !== undefined)?.lineNum;
	const firstNew = records.find((line) => line.prefix !== "-" && line.lineNum !== undefined)?.lineNum;
	const firstRemoved = records.find((line) => line.prefix === "-" && line.lineNum !== undefined)?.lineNum;
	const firstAdded = records.find((line) => line.prefix === "+" && line.lineNum !== undefined)?.lineNum;
	const oldStart = firstOld ?? firstRemoved ?? Math.max(1, (firstNew ?? firstAdded ?? 1) - 1);
	const newStart = firstNew ?? firstAdded ?? oldStart;
	const oldCount = Math.max(0, records.filter((line) => line.prefix !== "+").length);
	const newCount = Math.max(0, records.filter((line) => line.prefix !== "-").length);
	const displayPath = filePath || "edited-file";

	const body = records.map((line) => `${line.prefix}${line.content}`).join("\n");
	return [
		`diff --git a/${displayPath} b/${displayPath}`,
		`--- a/${displayPath}`,
		`+++ b/${displayPath}`,
		`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`,
		body,
		"",
	].join("\n");
}

function renderFallback(diff: string, width: number, theme: any): string[] {
	const lines: string[] = [];
	for (const line of diff.split("\n")) {
		let rendered: string;
		if (line.startsWith("+") && /^\+\s*\d+\s/.test(line)) {
			rendered = theme.fg("toolDiffAdded", line);
		} else if (line.startsWith("-") && /^-\s*\d+\s/.test(line)) {
			rendered = theme.fg("toolDiffRemoved", line);
		} else {
			rendered = theme.fg("toolDiffContext", line);
		}
		lines.push(truncateToWidth(rendered, width, "…"));
	}
	return lines;
}

function runDelta(gitDiff: string, width: number, sideBySide: boolean): string | undefined {
	const baseArgs = [
		"--paging=never",
		"--line-numbers",
		`--width=${Math.max(40, width)}`,
		"--tabs=3",
		`--syntax-theme=${DEFAULT_DELTA_THEME}`,
	];
	const args = sideBySide ? ["--side-by-side", ...baseArgs] : baseArgs;
	const result = spawnSync(DEFAULT_DELTA_BIN, args, {
		input: gitDiff,
		encoding: "utf8",
		maxBuffer: MAX_BUFFER_BYTES,
		env: {
			...process.env,
			CLICOLOR_FORCE: "1",
			COLORTERM: process.env.COLORTERM || "truecolor",
			TERM: process.env.TERM || "xterm-256color",
		},
	});

	if (result.status === 0 && result.stdout.trim()) return result.stdout.replace(/\s+$/g, "");

	// If the named theme is missing on another machine, retry with delta defaults.
	const fallbackArgs = args.filter((arg) => !arg.startsWith("--syntax-theme="));
	const fallback = spawnSync(DEFAULT_DELTA_BIN, fallbackArgs, {
		input: gitDiff,
		encoding: "utf8",
		maxBuffer: MAX_BUFFER_BYTES,
		env: {
			...process.env,
			CLICOLOR_FORCE: "1",
			COLORTERM: process.env.COLORTERM || "truecolor",
			TERM: process.env.TERM || "xterm-256color",
		},
	});
	if (fallback.status === 0 && fallback.stdout.trim()) return fallback.stdout.replace(/\s+$/g, "");

	return undefined;
}

class DeltaDiffComponent implements Component {
	private cacheKey = "";
	private cachedLines: string[] = [];

	constructor(
		private readonly diff: string,
		private readonly filePath: string,
		private readonly theme: any,
	) {}

	render(width: number): string[] {
		const renderWidth = Math.max(40, width);
		const sideBySide = renderWidth >= SIDE_BY_SIDE_MIN_WIDTH;
		const key = `${renderWidth}:${sideBySide}:${this.filePath}:${this.diff}`;
		if (this.cacheKey === key) return this.cachedLines;

		const gitDiff = toUnifiedGitDiff(this.diff, this.filePath);
		const deltaOutput = runDelta(gitDiff, renderWidth, sideBySide);
		const modeLabel = sideBySide ? "side-by-side" : "inline";
		const header = this.theme.fg("dim", `delta ${modeLabel} · ${shortenPath(this.filePath)}`);

		if (deltaOutput) {
			this.cachedLines = [
				header,
				...deltaOutput.split("\n").map((line) => visibleWidth(line) > renderWidth ? truncateToWidth(line, renderWidth, "") : line),
			];
		} else {
			this.cachedLines = [
				header + this.theme.fg("warning", " · delta unavailable; using fallback"),
				...renderFallback(this.diff, renderWidth, this.theme),
			];
		}
		this.cacheKey = key;
		return this.cachedLines;
	}

	invalidate(): void {
		this.cacheKey = "";
		this.cachedLines = [];
	}
}

function getPathFromArgs(args: unknown, cwd: string): string {
	const raw = typeof args === "object" && args !== null
		? (args as { path?: unknown; file_path?: unknown }).path ?? (args as { path?: unknown; file_path?: unknown }).file_path
		: undefined;
	const value = typeof raw === "string" && raw.length > 0 ? raw : "edited-file";
	return path.isAbsolute(value) ? path.relative(cwd, value) || path.basename(value) : value;
}

export default function (pi: ExtensionAPI) {
	const cwd = process.cwd();
	const baseEdit = createEditToolDefinition(cwd);

	pi.registerTool({
		...baseEdit,
		renderShell: "self",

		renderCall(args, _theme, _context) {
			const filePath = getPathFromArgs(args, cwd);
			return new Text(editCard(filePath), 0, 0);
		},

		renderResult(result, { isPartial }, theme, context: ToolRenderContext<any, any>) {
			if (isPartial) return new Text(theme.fg("warning", "Editing..."), 0, 0);

			const contentText = result.content
				.filter((content) => content.type === "text")
				.map((content) => content.text || "")
				.join("\n");
			if (context.isError || contentText.startsWith("Error")) {
				return new Text(theme.fg("error", contentText.split("\n")[0] || "Edit failed"), 0, 0);
			}

			const details = result.details as EditToolDetails | undefined;
			if (!details?.diff) {
				return new Text(theme.fg("success", contentText || "Applied"), 0, 0);
			}

			const filePath = getPathFromArgs(context.args, context.cwd);
			const changes = countChanges(details.diff);
			const summary = new Text(
				`  ${fg(CATPPUCCIN.green, `+${changes.additions}`)}${theme.fg("dim", " / ")}${fg(CATPPUCCIN.red, `-${changes.removals}`)}`,
				0,
				0,
			);
			const component = context.lastComponent instanceof DeltaDiffComponent
				? context.lastComponent
				: new DeltaDiffComponent(details.diff, filePath, theme);

			return {
				render(width: number) {
					return [
						...summary.render(width),
						"",
						...component.render(width),
					];
				},
				invalidate() {
					component.invalidate();
				},
			};
		},
	});
}
