/**
 * Catppuccin UI tweaks
 *
 * - Catppuccin Mocha-colored working spinner
 *
 * Vim mode is provided by shop-pi-fy's vim-mode extension, enabled via
 * ~/.pi/agent/extensions/vim-mode -> shop-pi-fy/extensions/vim-mode.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const RESET_FG = "\x1b[39m";

const CATPPUCCIN_MOCHA = {
	pink: "\x1b[38;2;245;194;231m",
	mauve: "\x1b[38;2;203;166;247m",
	red: "\x1b[38;2;243;139;168m",
	peach: "\x1b[38;2;250;179;135m",
	yellow: "\x1b[38;2;249;226;175m",
	green: "\x1b[38;2;166;227;161m",
	teal: "\x1b[38;2;148;226;213m",
	sky: "\x1b[38;2;137;220;235m",
	blue: "\x1b[38;2;137;180;250m",
	lavender: "\x1b[38;2;180;190;254m",
} as const;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_COLORS = [
	CATPPUCCIN_MOCHA.mauve,
	CATPPUCCIN_MOCHA.pink,
	CATPPUCCIN_MOCHA.red,
	CATPPUCCIN_MOCHA.peach,
	CATPPUCCIN_MOCHA.yellow,
	CATPPUCCIN_MOCHA.green,
	CATPPUCCIN_MOCHA.teal,
	CATPPUCCIN_MOCHA.sky,
	CATPPUCCIN_MOCHA.blue,
	CATPPUCCIN_MOCHA.lavender,
];

function colorize(text: string, color: string): string {
	return `${color}${text}${RESET_FG}`;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setWorkingIndicator({
			frames: SPINNER_FRAMES.map((frame, index) => colorize(frame, SPINNER_COLORS[index % SPINNER_COLORS.length]!)),
			intervalMs: 80,
		});
	});
}
