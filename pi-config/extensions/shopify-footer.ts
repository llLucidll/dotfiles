/**
 * Starship-flavoured Pi footer
 *
 * First line: user's real Starship prompt (from ~/.config/starship.toml)
 * Second line: Pi session metrics rendered as Catppuccin powerline segments
 */

import { execFile } from "node:child_process";
import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

const RESET = "\x1b[0m";
const STARSHIP_CACHE_TTL_MS = 5_000;
const STARSHIP_TIMEOUT_MS = 2_000;

const CATPPUCCIN = {
	rosewater: "#f5e0dc",
	pink: "#f5c2e7",
	red: "#f38ba8",
	peach: "#fab387",
	yellow: "#f9e2af",
	green: "#a6e3a1",
	teal: "#94e2d5",
	sapphire: "#74c7ec",
	blue: "#89b4fa",
	lavender: "#b4befe",
	text: "#cdd6f4",
	subtext0: "#a6adc8",
	overlay1: "#7f849c",
	surface1: "#45475a",
	crust: "#11111b",
};

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

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

function formatDuration(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m ${s}s`;
	return `${s}s`;
}

function sanitizeStatusText(text: string): string {
	return text
		.replace(/[\r\n\t]/g, " ")
		.replace(/ +/g, " ")
		.trim();
}

function shortenPath(cwd: string): string {
	const home = process.env.HOME || process.env.USERPROFILE;
	if (home && cwd.startsWith(home)) return `~${cwd.slice(home.length)}`;
	return cwd;
}

function normalizeStarshipOutput(stdout: string): string {
	let prompt = stdout
		.replace(/\x1b\[J/g, "")
		.replace(/%\{%\}/g, "")
		.replace(/\\\[\\\]/g, "")
		.replace(/\r?\n/g, " ")
		.trim();

	// Your shell prompt includes the final Starship character (❯/❮). In Pi this is
	// a status bar, not a shell prompt, so strip that final character segment.
	const promptCharIndex = Math.max(prompt.lastIndexOf("❯"), prompt.lastIndexOf("❮"));
	if (promptCharIndex >= 0 && visibleWidth(prompt.slice(promptCharIndex)) <= 4) {
		prompt = prompt.slice(0, promptCharIndex).trimEnd();
	}

	return prompt ? `${prompt}${RESET}` : "";
}

function fallbackStarshipPrompt(cwd: string, branch?: string): string {
	const path = shortenPath(cwd);
	const user = process.env.USER || process.env.LOGNAME || "user";
	const branchText = branch ? `  ${branch} ` : "";
	return [
		fg(CATPPUCCIN.red, ""),
		fgBg(CATPPUCCIN.crust, CATPPUCCIN.red, `󰀵 ${user} `),
		fgBg(CATPPUCCIN.red, CATPPUCCIN.peach, ""),
		fgBg(CATPPUCCIN.crust, CATPPUCCIN.peach, ` ${path} `),
		branchText ? fgBg(CATPPUCCIN.peach, CATPPUCCIN.yellow, "") : fg(CATPPUCCIN.peach, ""),
		branchText ? fgBg(CATPPUCCIN.crust, CATPPUCCIN.yellow, branchText) : "",
		branchText ? fg(CATPPUCCIN.yellow, "") : "",
	].join("");
}

interface PowerlineSegment {
	text: string;
	bg: string;
	fg?: string;
}

function powerline(segments: PowerlineSegment[]): string {
	if (segments.length === 0) return "";
	const [first, ...rest] = segments;
	let output = fg(first.bg, "") + fgBg(first.fg ?? CATPPUCCIN.crust, first.bg, first.text);
	let previousBg = first.bg;

	for (const segment of rest) {
		output += fgBg(previousBg, segment.bg, "");
		output += fgBg(segment.fg ?? CATPPUCCIN.crust, segment.bg, segment.text);
		previousBg = segment.bg;
	}

	output += fg(previousBg, "");
	return output;
}

function modelShortName(modelId: string): string {
	const pieces = modelId.split("/");
	return pieces[pieces.length - 1] || modelId;
}

function usageCost(usage: any): number {
	if (typeof usage?.cost === "number") return usage.cost;
	if (typeof usage?.cost?.total === "number") return usage.cost.total;
	return 0;
}

function getThinkingLevelSafe(pi: ExtensionAPI): string {
	try {
		return pi.getThinkingLevel() || "off";
	} catch {
		return "off";
	}
}

export default function (pi: ExtensionAPI) {
	let turnCount = 0;
	let sessionStart = Date.now();
	const subagentUsageMap = new Map<string, { tokens: number; cost: number }>();

	function extractSubagentUsage(details: any): { tokens: number; cost: number } {
		let tokens = 0;
		let cost = 0;
		if (!details?.results) return { tokens, cost };
		for (const result of details.results) {
			if (result.usage) {
				tokens += (result.usage.input || 0) + (result.usage.output || 0);
				cost += usageCost(result.usage);
			}
		}
		return { tokens, cost };
	}

	const resetState = () => {
		turnCount = 0;
		sessionStart = Date.now();
		subagentUsageMap.clear();
	};

	pi.on("turn_end", async () => {
		turnCount++;
	});

	pi.on("session_switch", async (event) => {
		if (event.reason === "new") resetState();
	});

	pi.on("tool_execution_update", async (event) => {
		if (event.toolName !== "subagent") return;
		const usage = extractSubagentUsage((event as any).partialResult?.details);
		if (usage.tokens > 0 || usage.cost > 0) {
			subagentUsageMap.set(event.toolCallId, usage);
		}
	});

	pi.on("tool_result", async (event) => {
		if (event.toolName !== "subagent") return;
		const usage = extractSubagentUsage(event.details);
		if (usage.tokens > 0 || usage.cost > 0) {
			subagentUsageMap.set(event.toolCallId, usage);
		}
	});

	pi.on("session_start", async (_event, ctx) => {
		resetState();

		ctx.ui.setFooter((tui, _theme, footerData) => {
			const starshipCache = {
				key: "",
				pendingKey: "" as string | undefined,
				value: "",
				lastCompleted: 0,
			};

			const requestStarshipPrompt = (width: number): string => {
				const terminalWidth = Math.max(40, width);
				const key = `${ctx.cwd}|${terminalWidth}`;
				const now = Date.now();
				if (starshipCache.key === key && starshipCache.value && now - starshipCache.lastCompleted < STARSHIP_CACHE_TTL_MS) {
					return starshipCache.value;
				}

				if (starshipCache.pendingKey !== key) {
					starshipCache.pendingKey = key;
					execFile(
						process.env.STARSHIP_BIN || "starship",
						[
							"prompt",
							"--path",
							ctx.cwd,
							"--terminal-width",
							String(terminalWidth),
							"--keymap",
							"viins",
						],
						{
							cwd: ctx.cwd,
							timeout: STARSHIP_TIMEOUT_MS,
							env: {
								...process.env,
								STARSHIP_SHELL: "fish",
								STARSHIP_LOG: "error",
							},
						},
						(error, stdout) => {
							if (!error) {
								const normalized = normalizeStarshipOutput(stdout);
								if (normalized) starshipCache.value = normalized;
							} else if (!starshipCache.value) {
								starshipCache.value = fallbackStarshipPrompt(ctx.cwd, footerData.getGitBranch());
							}
							starshipCache.key = key;
							starshipCache.lastCompleted = Date.now();
							starshipCache.pendingKey = undefined;
							tui.requestRender();
						},
					);
				}

				return starshipCache.value || fallbackStarshipPrompt(ctx.cwd, footerData.getGitBranch());
			};

			const branchUnsub = footerData.onBranchChange(() => {
				starshipCache.lastCompleted = 0;
				tui.requestRender();
			});
			const timer = setInterval(() => tui.requestRender(), 1000);

			return {
				dispose: () => {
					branchUnsub();
					clearInterval(timer);
				},
				invalidate() {},
				render(width: number): string[] {
					let totalInput = 0;
					let totalOutput = 0;
					let totalCost = 0;

					for (const entry of ctx.sessionManager.getEntries()) {
						if (entry.type === "message" && entry.message.role === "assistant") {
							const message = entry.message as AssistantMessage;
							totalInput += message.usage.input;
							totalOutput += message.usage.output;
							totalCost += message.usage.cost.total;
						}
					}

					let subagentTokens = 0;
					let subagentCost = 0;
					for (const usage of subagentUsageMap.values()) {
						subagentTokens += usage.tokens;
						subagentCost += usage.cost;
					}

					const totalTokens = totalInput + totalOutput + subagentTokens;
					const totalCostCombined = totalCost + subagentCost;
					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextPercent = contextUsage?.percent;
					const contextTokens = contextUsage?.tokens;
					const percentLabel = contextPercent !== null && contextPercent !== undefined
						? `${contextPercent.toFixed(1)}%`
						: "?%";
					const contextLabel = `${percentLabel} (${contextTokens != null ? formatTokens(contextTokens) : "?"}/${contextWindow ? formatTokens(contextWindow) : "?"})`;
					const contextBg = (contextPercent ?? 0) > 90
						? CATPPUCCIN.red
						: (contextPercent ?? 0) > 70
							? CATPPUCCIN.yellow
							: CATPPUCCIN.green;
					const provider = ctx.model?.provider ?? "—";
					const model = modelShortName(ctx.model?.id ?? "no-model");
					const thinking = ctx.model?.reasoning ? getThinkingLevelSafe(pi) : "off";
					const elapsed = formatDuration(Date.now() - sessionStart);

					const piBar = powerline([
						{ text: ` ${formatTokens(totalTokens)} tok `, bg: CATPPUCCIN.peach },
						{ text: ` $${totalCostCombined.toFixed(3)} `, bg: CATPPUCCIN.teal },
						{ text: ` ${contextLabel} `, bg: contextBg },
						{ text: ` ${provider} · ${model} `, bg: CATPPUCCIN.sapphire },
						{ text: ` ${thinking} `, bg: CATPPUCCIN.lavender },
						{ text: ` ${turnCount}t · ${elapsed} `, bg: CATPPUCCIN.surface1, fg: CATPPUCCIN.text },
					]);

					const starship = requestStarshipPrompt(width);
					const lines = [
						truncateToWidth(starship, width, "…"),
						truncateToWidth(piBar, width, ""),
					];

					const sessionName = ctx.sessionManager.getSessionName();
					const extensionStatuses = Array.from(footerData.getExtensionStatuses().entries())
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([, text]) => sanitizeStatusText(text))
						.filter(Boolean);

					const metaParts = [];
					if (sessionName) metaParts.push(sessionName);
					metaParts.push(...extensionStatuses);
					if (metaParts.length > 0) {
						const meta = fg(CATPPUCCIN.green, "◆ shopify") + dim(" · ") + fg(CATPPUCCIN.subtext0, metaParts.join(" · "));
						lines.push(truncateToWidth(meta, width, "…"));
					}

					return lines;
				},
			};
		});
	});
}
