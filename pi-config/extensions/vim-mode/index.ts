/**
 * Vim Mode Extension — modal editing with operators, motions, and counts
 *
 * Usage: Installed automatically via `pi install https://github.com/shopify-playground/shop-pi-fy`
 *        Or test standalone: pi --extension ./extensions/vim-mode
 *
 * Normal mode:
 *   v/V        — visual mode (characterwise/linewise selection)
 *   h/l        — horizontal navigation (j/k intentionally do not move the prompt)
 *   w/e        — word motions (with count: 3w, 2e)
 *   b          — back word motion (with count: 3b)
 *   0/^/$      — line start/first non-whitespace/end
 *   f{char}    — jump to next occurrence of char on line (with count: 2fa)
 *   t{char}    — jump to just before next occurrence of char on line
 *   F{char}    — jump to previous occurrence of char on line (backward)
 *   T{char}    — jump to just after previous occurrence of char on line (backward)
 *   gg         — go to first line (or Ngg for line N)
 *   G          — go to last line (or NG for line N)
 *   i/a        — insert mode (a = append after cursor)
 *   I          — insert at first non-whitespace char
 *   A          — append at end of line
 *   o/O        — open line below/above, enter insert
 *   x          — delete char (with count: 3x)
 *   Delete     — delete char under cursor
 *   Backspace  — move cursor left
 *   s          — substitute char (delete + insert)
 *   D          — delete to end of line
 *   C          — change to end of line (delete + insert)
 *   u          — undo
 *   Ctrl+R     — redo
 *   d{motion}  — delete operator (dw, de, d$, d0, d^, db, dB, dd, dj, dk, df, dt, dF, dT)
 *   c{motion}  — change operator (cw, ce, c$, c0, c^, cb, cB, cc, cj, ck, cf, ct, cF, cT)
 *   y{motion}  — yank operator (yw, y$, y0, y^, yb, yB, yy, yj, yk, yf, yt, yF, yT)
 *   p/P        — paste after/before cursor
 *   j/k        — no-op as direct motions; reserved for chat-output scrolling if Pi exposes it later
 *   {count}    — prefix count for motions/operators (3dw, d2w, 2dd)
 *   Escape     — cancel operator-pending, or normal→abort
 *
 * Insert mode:
 *   All keys passed through to default editor
 *   Escape     — back to normal mode
 *   Animated Catppuccin rainbow gradient on typed prompt text
 */

import { CustomEditor, type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { CURSOR_MARKER, matchesKey, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { wordWrapLine } from "./lib/word-wrap.js";
import {
	type Pos,
	type OperatorRange,
	findNextWordStart,
	findWordEnd,
	findPrevWordStart,
	findPrevWORDStart,
	findCharForward,
	findCharBackward,
	findFirstNonWhitespaceCol,
	computeOperatorRange,
	extractRange,
	applyDelete,
} from "./lib/vim-core.js";

// Re-export pure functions so they remain importable from the extension path
export {
	type Pos,
	type OperatorRange,
	findNextWordStart,
	findWordEnd,
	findPrevWordStart,
	findPrevWORDStart,
	findCharForward,
	findCharBackward,
	findFirstNonWhitespaceCol,
	computeOperatorRange,
	extractRange,
	applyDelete,
	isWhitespace,
	isPunctuation,
	isWordChar,
} from "./lib/vim-core.js";

// ─── Undo/Redo snapshots ─────────────────────────────────────────────

interface Snapshot {
	lines: string[];
	cursorLine: number;
	cursorCol: number;
}

interface LayoutSegment {
	text: string;
	logicalLine: number;
	startCol: number;
	endCol: number;
	hasCursor: boolean;
	cursorPos?: number;
}

interface YankRegister {
	text: string;
	linewise: boolean;
}

const MAX_UNDO_STACK = 100;
const RAINBOW_FRAME_MS = 80;
const ANSI_CSI_REGEX = /^\x1b\[[0-9;:]*[A-Za-z]/;
const RAINBOW_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// Catppuccin Mocha rainbow: red → peach → yellow → green → teal → sapphire → blue → lavender → mauve → pink
const RAINBOW_COLORS: [number, number, number][] = [
	[243, 139, 168],
	[250, 179, 135],
	[249, 226, 175],
	[166, 227, 161],
	[148, 226, 213],
	[116, 199, 236],
	[137, 180, 250],
	[180, 190, 254],
	[203, 166, 247],
	[245, 194, 231],
];

// ─── Vim state ───────────────────────────────────────────────────────

interface VimState {
	mode: "normal" | "insert" | "operator-pending" | "visual" | "visual-line";
	count: string; // accumulated digit prefix
	operator: string | null; // "d" or "c"
	operatorCount: string; // count before operator (e.g., "2" in 2dw)
	pendingCharMotion: string | null; // "f", "t", "F", or "T" — waiting for target char
}

// ─── ModalEditor class ──────────────────────────────────────────────

// Decode Kitty CSI-u printable keys (e.g. shifted symbols like $, ^).
const KITTY_CSI_U_REGEX = /^\x1b\[(\d+)(?::(\d*))?(?::(\d+))?(?:;(\d+))?(?::(\d+))?u$/;
const KITTY_MOD_ALT = 2;
const KITTY_MOD_CTRL = 4;
function decodeKittyPrintable(data: string): string | undefined {
	const match = data.match(KITTY_CSI_U_REGEX);
	if (!match) return undefined;
	const codepoint = Number.parseInt(match[1] ?? "", 10);
	if (!Number.isFinite(codepoint)) return undefined;
	const shiftedKey = match[2] && match[2].length > 0 ? Number.parseInt(match[2], 10) : undefined;
	const modValue = match[4] ? Number.parseInt(match[4], 10) : 1;
	const modifier = Number.isFinite(modValue) ? modValue - 1 : 0;
	if (modifier & (KITTY_MOD_ALT | KITTY_MOD_CTRL)) return undefined;
	let effectiveCodepoint = codepoint;
	if ((modifier & 1) && typeof shiftedKey === "number") {
		effectiveCodepoint = shiftedKey;
	}
	if (!Number.isFinite(effectiveCodepoint) || effectiveCodepoint < 32) return undefined;
	try {
		return String.fromCodePoint(effectiveCodepoint);
	} catch {
		return undefined;
	}
}

function rainbowColor(index: number, frame: number): string {
	const pos = (index / 2.4 + frame * 0.22) % RAINBOW_COLORS.length;
	const left = Math.floor(pos);
	const right = (left + 1) % RAINBOW_COLORS.length;
	const t = pos - left;
	const a = RAINBOW_COLORS[left]!;
	const b = RAINBOW_COLORS[right]!;
	const r = Math.round(a[0] + (b[0] - a[0]) * t);
	const g = Math.round(a[1] + (b[1] - a[1]) * t);
	const blue = Math.round(a[2] + (b[2] - a[2]) * t);
	return `\x1b[38;2;${r};${g};${blue}m`;
}

function stripControlSequences(text: string): string {
	return text
		.replace(new RegExp(CURSOR_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "")
		.replace(/\x1b\[[0-9;:]*[A-Za-z]/g, "");
}

function colorizeRainbowLine(line: string, frame: number, lineOffset: number): string {
	let output = "";
	let i = 0;
	let visibleIndex = lineOffset;

	while (i < line.length) {
		if (line.startsWith(CURSOR_MARKER, i)) {
			output += CURSOR_MARKER;
			i += CURSOR_MARKER.length;
			continue;
		}

		if (line[i] === "\x1b") {
			const match = line.slice(i).match(ANSI_CSI_REGEX);
			if (match) {
				output += match[0];
				i += match[0].length;
				continue;
			}
		}

		const segment = RAINBOW_SEGMENTER.segment(line.slice(i))[Symbol.iterator]().next().value?.segment ?? line[i]!;
		const width = visibleWidth(segment);
		if (width > 0 && !/^\s+$/.test(segment)) {
			output += `${rainbowColor(visibleIndex, frame)}${segment}\x1b[39m`;
		} else {
			output += segment;
		}
		visibleIndex += width;
		i += segment.length;
	}

	return output;
}

function isEditorBorderLine(line: string): boolean {
	const plain = stripControlSequences(line).trim();
	return plain.length > 0 && /^─+(?: [↑↓] \d+ more ─*)?$/.test(plain);
}

class ModalEditor extends CustomEditor {
	private vim: VimState = {
		mode: "insert",
		count: "",
		operator: null,
		operatorCount: "",
		pendingCharMotion: null,
	};
	private pendingCharMotion: string | null = null;
	private pendingG: boolean = false;
	private visualAnchor: Pos | null = null;
	private renderScrollOffset: number = 0;
	private yankRegister: YankRegister = { text: "", linewise: false };
	private vimUndoStack: Snapshot[] = [];
	private vimRedoStack: Snapshot[] = [];
	private rainbowFrame = 0;
	private rainbowTimer: ReturnType<typeof setInterval> | null = null;
	/** Snapshot captured when leaving insert mode — represents state at insert entry */
	private insertEntrySnapshot: Snapshot | null = null;

	dispose(): void {
		this.stopRainbowAnimation();
	}

	private startRainbowAnimation(): void {
		if (this.rainbowTimer) return;
		this.rainbowTimer = setInterval(() => {
			this.rainbowFrame++;
			this.tui.requestRender();
		}, RAINBOW_FRAME_MS);
	}

	private stopRainbowAnimation(): void {
		if (!this.rainbowTimer) return;
		clearInterval(this.rainbowTimer);
		this.rainbowTimer = null;
	}

	private updateRainbowAnimation(): void {
		if (this.vim.mode === "insert" && this.getText().length > 0) {
			this.startRainbowAnimation();
		} else {
			this.stopRainbowAnimation();
		}
	}

	/** Exit insert mode → normal mode */
	private exitInsertMode(): void {
		if (this.insertEntrySnapshot) {
			const current = this.captureSnapshot();
			const prev = this.insertEntrySnapshot;
			if (current.lines.join("\n") !== prev.lines.join("\n") ||
				current.cursorLine !== prev.cursorLine ||
				current.cursorCol !== prev.cursorCol) {
				this.pushUndo(prev);
			}
			this.insertEntrySnapshot = null;
		}
		this.vim.mode = "normal";
		this.vim.count = "";
		this.vim.operator = null;
		this.vim.operatorCount = "";
	}

	private resetVimState(): void {
		this.vim.count = "";
		this.vim.operator = null;
		this.vim.operatorCount = "";
		this.vim.pendingCharMotion = null;
		this.vim.mode = "normal";
		this.pendingG = false;
		this.pendingCharMotion = null;
		this.visualAnchor = null;
	}

	private getEffectiveCount(): number {
		const opCount = this.vim.operatorCount ? parseInt(this.vim.operatorCount, 10) : 1;
		const motionCount = this.vim.count ? parseInt(this.vim.count, 10) : 1;
		return opCount * motionCount;
	}

	/** Capture current editor state as a snapshot */
	private captureSnapshot(): Snapshot {
		const cursor = this.getCursor();
		return {
			lines: this.getLines().slice(),
			cursorLine: cursor.line,
			cursorCol: cursor.col,
		};
	}

	/** Save a snapshot to the undo stack (clears redo stack) */
	private pushUndo(snapshot?: Snapshot): void {
		const snap = snapshot ?? this.captureSnapshot();
		this.vimUndoStack.push(snap);
		if (this.vimUndoStack.length > MAX_UNDO_STACK) {
			this.vimUndoStack.shift();
		}
		this.vimRedoStack.length = 0;
	}

	/** Restore a snapshot into the editor */
	private restoreSnapshot(snap: Snapshot): void {
		this.applyTextChange(snap.lines, snap.cursorLine, snap.cursorCol);
	}

	/** Undo: pop from undo stack, push current to redo, restore */
	private performUndo(): void {
		if (this.vimUndoStack.length === 0) return;
		this.vimRedoStack.push(this.captureSnapshot());
		const snap = this.vimUndoStack.pop()!;
		this.restoreSnapshot(snap);
	}

	/** Redo: pop from redo stack, push current to undo, restore */
	private performRedo(): void {
		if (this.vimRedoStack.length === 0) return;
		this.vimUndoStack.push(this.captureSnapshot());
		const snap = this.vimRedoStack.pop()!;
		this.restoreSnapshot(snap);
	}

	/** Enter insert mode, capturing snapshot for undo */
	private enterInsertMode(): void {
		this.insertEntrySnapshot = this.captureSnapshot();
		this.vim.mode = "insert";
	}

	private enterVisualMode(): void {
		const cursor = this.getCursor();
		this.visualAnchor = { line: cursor.line, col: cursor.col };
		this.vim.mode = "visual";
		this.vim.count = "";
	}

	private enterVisualLineMode(): void {
		const cursor = this.getCursor();
		this.visualAnchor = { line: cursor.line, col: 0 };
		this.vim.mode = "visual-line";
		this.vim.count = "";
	}

	private exitVisualMode(): void {
		this.vim.mode = "normal";
		this.vim.count = "";
		this.pendingCharMotion = null;
		this.visualAnchor = null;
	}

	private getCurrentVisualRange(): OperatorRange | null {
		if (!this.visualAnchor) return null;
		const cursor = this.getCursor();
		if (this.vim.mode === "visual-line") {
			const startLine = Math.min(this.visualAnchor.line, cursor.line);
			const endLine = Math.max(this.visualAnchor.line, cursor.line) + 1;
			return {
				startLine,
				startCol: 0,
				endLine,
				endCol: 0,
				linewise: true,
			};
		}
		const start = this.comparePos(this.visualAnchor, cursor) <= 0 ? this.visualAnchor : cursor;
		const end = this.comparePos(this.visualAnchor, cursor) <= 0 ? cursor : this.visualAnchor;
		return {
			startLine: start.line,
			startCol: start.col,
			endLine: end.line,
			endCol: end.col + 1,
			linewise: false,
		};
	}

	private yankRange(lines: string[], range: OperatorRange): void {
		this.yankRegister = {
			text: extractRange(lines, range),
			linewise: range.linewise,
		};
	}

	private insertRegister(
		lines: string[],
		line: number,
		col: number,
		reg: YankRegister,
		afterCursor: boolean,
	): { newLines: string[]; cursorLine: number; cursorCol: number } {
		if (!reg.text) return { newLines: lines.slice(), cursorLine: line, cursorCol: col };
		const newLines = lines.slice();

		if (reg.linewise) {
			const insertAt = afterCursor ? line + 1 : line;
			const chunks = reg.text.split("\n");
			newLines.splice(insertAt, 0, ...chunks);
			return { newLines, cursorLine: Math.min(insertAt, newLines.length - 1), cursorCol: 0 };
		}

		const currentLine = newLines[line] ?? "";
		const insertCol = afterCursor ? Math.min(currentLine.length, col + 1) : col;
		const chunks = reg.text.split("\n");
		if (chunks.length === 1) {
			newLines[line] = currentLine.slice(0, insertCol) + chunks[0] + currentLine.slice(insertCol);
			const cursorCol = chunks[0]!.length > 0 ? insertCol + chunks[0]!.length - 1 : insertCol;
			return { newLines, cursorLine: line, cursorCol };
		}

		const first = currentLine.slice(0, insertCol) + chunks[0];
		const lastChunk = chunks[chunks.length - 1] ?? "";
		const last = lastChunk + currentLine.slice(insertCol);
		newLines.splice(line, 1, first, ...chunks.slice(1, -1), last);
		const cursorLine = line + chunks.length - 1;
		const cursorCol = Math.max(0, lastChunk.length - 1);
		return { newLines, cursorLine, cursorCol };
	}

	private applyVisualAction(action: "delete" | "change" | "yank" | "paste"): void {
		const range = this.getCurrentVisualRange();
		if (!range) {
			this.exitVisualMode();
			return;
		}

		const lines = this.getLines();
		if (action === "yank") {
			this.yankRange(lines, range);
			this.exitVisualMode();
			return;
		}

		if (action === "paste") {
			if (!this.yankRegister.text) {
				this.exitVisualMode();
				return;
			}
			const pasteReg = { ...this.yankRegister };
			this.pushUndo();
			this.yankRange(lines, range);
			const deleted = applyDelete(lines, range);
			const pasted = this.insertRegister(deleted.newLines, deleted.cursorLine, deleted.cursorCol, pasteReg, false);
			this.applyTextChange(pasted.newLines, pasted.cursorLine, pasted.cursorCol);
			this.exitVisualMode();
			return;
		}

		this.pushUndo();
		this.yankRange(lines, range);
		const result = applyDelete(lines, range);
		this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);
		this.exitVisualMode();
		if (action === "change") {
			this.enterInsertMode();
		}
	}

	handleInput(data: string): void {
		// Escape handling
		if (matchesKey(data, "escape")) {
			if (this.vim.mode === "insert") {
				this.exitInsertMode();
				return;
			}
			if (this.vim.mode === "operator-pending") {
				this.resetVimState();
				return;
			}
			if (this.vim.mode === "visual" || this.vim.mode === "visual-line") {
				this.exitVisualMode();
				return;
			}
			// In normal mode: cancel pending char motion if any, otherwise pass through
			if (this.pendingCharMotion) {
				this.pendingCharMotion = null;
				this.vim.count = "";
				return;
			}
			super.handleInput(data);
			return;
		}

		// Insert mode: match this user's Neovim config — Escape exits insert;
		// printable keys (including "jk") are inserted normally.
		if (this.vim.mode === "insert") {
			super.handleInput(data);
			return;
		}

		// Normal, visual, visual-line, and operator-pending modes
		if (this.vim.mode === "normal" || this.vim.mode === "visual" || this.vim.mode === "visual-line" || this.vim.mode === "operator-pending") {
			this.handleNormalKey(data);
			return;
		}

		// Fallback: pass control sequences
		if (data.length === 1 && data.charCodeAt(0) >= 32) return;
		super.handleInput(data);
	}

	private handleNormalKey(data: string): void {
		// Ctrl+R: redo (must be checked before printable char check)
		if (matchesKey(data, "ctrl+r") && this.vim.mode === "normal") {
			this.vim.count = "";
			this.performRedo();
			return;
		}

		if (this.vim.mode === "normal" && matchesKey(data, "backspace")) {
			const cursor = this.getCursor();
			if (cursor.col > 0) {
				this.moveCursorTo(cursor, { line: cursor.line, col: cursor.col - 1 });
			}
			this.vim.count = "";
			return;
		}

		if (this.vim.mode === "normal" && matchesKey(data, "delete")) {
			this.pushUndo();
			const lines = this.getLines();
			const cursor = this.getCursor();
			const range = computeOperatorRange(lines, cursor.line, cursor.col, "l", 1);
			if (range) {
				const result = applyDelete(lines, range);
				this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);
			}
			this.vim.count = "";
			return;
		}

		// Single printable char (also support Kitty CSI-u encoded printable keys)
		const decodedKitty = decodeKittyPrintable(data);
		const ch = data.length === 1 && data.charCodeAt(0) >= 32 ? data : decodedKitty;
		if (ch !== undefined) {

			// Digit handling: accumulate count (but "0" without preceding digits = line start)
			if (ch >= "1" && ch <= "9") {
				this.vim.count += ch;
				return;
			}
			if (ch === "0" && this.vim.count.length > 0) {
				this.vim.count += ch;
				return;
			}

			// Keep j/k reserved for chat-output scrolling if Pi exposes that in the future.
			// Today the extension API cannot scroll the main transcript, so direct j/k
			// are no-ops instead of moving around inside the prompt.
			if ((ch === "j" || ch === "k") && (this.vim.mode === "normal" || this.vim.mode === "visual" || this.vim.mode === "visual-line")) {
				this.vim.count = "";
				return;
			}

			if (ch === "v" && this.vim.mode === "normal") {
				this.enterVisualMode();
				return;
			}
			if (ch === "v" && this.vim.mode === "visual") {
				this.exitVisualMode();
				return;
			}
			if (ch === "v" && this.vim.mode === "visual-line") {
				this.enterVisualMode();
				return;
			}
			if (ch === "V" && this.vim.mode === "normal") {
				this.enterVisualLineMode();
				return;
			}
			if (ch === "V" && this.vim.mode === "visual-line") {
				this.exitVisualMode();
				return;
			}
			if (ch === "V" && this.vim.mode === "visual") {
				this.enterVisualLineMode();
				return;
			}

			if ((this.vim.mode === "visual" || this.vim.mode === "visual-line") && (ch === "d" || ch === "x")) {
				this.applyVisualAction("delete");
				return;
			}
			if ((this.vim.mode === "visual" || this.vim.mode === "visual-line") && (ch === "c" || ch === "s")) {
				this.applyVisualAction("change");
				return;
			}
			if ((this.vim.mode === "visual" || this.vim.mode === "visual-line") && ch === "y") {
				this.applyVisualAction("yank");
				return;
			}
			if ((this.vim.mode === "visual" || this.vim.mode === "visual-line") && ch === "p") {
				this.applyVisualAction("paste");
				return;
			}

			// Operator keys: d, c, y
			if ((ch === "d" || ch === "c" || ch === "y") && this.vim.mode === "normal") {
				this.vim.mode = "operator-pending";
				this.vim.operator = ch;
				this.vim.operatorCount = this.vim.count;
				this.vim.count = "";
				return;
			}

			// In operator-pending mode, if same key as operator → linewise (dd, cc, yy)
			if (this.vim.mode === "operator-pending" && ch === this.vim.operator) {
				this.executeOperatorLinewise();
				return;
			}

			// Handle `g` for `gg` sequence (in normal/visual modes)
			if (ch === "g" && (this.vim.mode === "normal" || this.vim.mode === "visual" || this.vim.mode === "visual-line")) {
				if (this.pendingG) {
					// Second `g` → execute gg: go to first line (or line N-1 if count given)
					const count = this.vim.count ? parseInt(this.vim.count, 10) : 0;
					this.vim.count = "";
					this.pendingG = false;
					const lines = this.getLines();
					const cursor = this.getCursor();
					const targetLine = count > 0
						? Math.min(count - 1, lines.length - 1)
						: 0;
					this.moveCursorTo(cursor, { line: targetLine, col: 0 });
					return;
				}
				this.pendingG = true;
				return;
			}

			// Any key after pendingG that isn't `g` → reset pendingG and fall through
			if (this.pendingG) {
				this.pendingG = false;
			}

			// If we have a pending char motion (f/t/F/T waiting for target char)
			if (this.pendingCharMotion) {
				const charMotion = this.pendingCharMotion;
				this.pendingCharMotion = null;
				if (this.vim.mode === "operator-pending") {
					this.executeOperatorCharMotion(charMotion, ch);
				} else {
					this.executeCharMotion(charMotion, ch);
				}
				return;
			}

			// f/t/F/T: enter char-pending state (works in both normal and operator-pending)
			if (ch === "f" || ch === "t" || ch === "F" || ch === "T") {
				this.pendingCharMotion = ch;
				return;
			}
			// Motion keys
			if ("wWeEbB0^$hljk".includes(ch)) {
				if (this.vim.mode === "operator-pending") {
					this.executeOperatorMotion(ch);
				} else {
					this.executeMotion(ch);
				}
				return;
			}

			if (ch === "G" && (this.vim.mode === "visual" || this.vim.mode === "visual-line")) {
				const hasCount = this.vim.count.length > 0;
				const count = hasCount ? parseInt(this.vim.count, 10) : 1;
				this.vim.count = "";
				const lines = this.getLines();
				const cursor = this.getCursor();
				const targetLine = hasCount
					? Math.min(count - 1, lines.length - 1)
					: lines.length - 1;
				this.moveCursorTo(cursor, { line: Math.max(0, targetLine), col: 0 });
				return;
			}

			// Simple normal mode commands
			if (this.vim.mode === "normal") {
				const hasCount = this.vim.count.length > 0;
				const count = hasCount ? parseInt(this.vim.count, 10) : 1;
				this.vim.count = "";

				switch (ch) {
					case "i":
						this.enterInsertMode();
						return;
					case "a":
						this.enterInsertMode();
						super.handleInput("\x1b[C"); // right
						return;
					case "A": {
						const lines = this.getLines();
						const cursor = this.getCursor();
						const currentLine = lines[cursor.line] ?? "";
						this.moveCursorTo(cursor, { line: cursor.line, col: currentLine.length });
						this.enterInsertMode();
						return;
					}
					case "I": {
						const lines = this.getLines();
						const cursor = this.getCursor();
						const currentLine = lines[cursor.line] ?? "";
						let targetCol = 0;
						while (targetCol < currentLine.length && /\s/.test(currentLine[targetCol]!)) {
							targetCol++;
						}
						this.moveCursorTo(cursor, { line: cursor.line, col: targetCol });
						this.enterInsertMode();
						return;
					}
					case "u":
						this.performUndo();
						return;
					case "p": {
						if (!this.yankRegister.text) return;
						this.pushUndo();
						const lines = this.getLines();
						const cursor = this.getCursor();
						const pasted = this.insertRegister(lines, cursor.line, cursor.col, this.yankRegister, true);
						this.applyTextChange(pasted.newLines, pasted.cursorLine, pasted.cursorCol);
						return;
					}
					case "P": {
						if (!this.yankRegister.text) return;
						this.pushUndo();
						const lines = this.getLines();
						const cursor = this.getCursor();
						const pasted = this.insertRegister(lines, cursor.line, cursor.col, this.yankRegister, false);
						this.applyTextChange(pasted.newLines, pasted.cursorLine, pasted.cursorCol);
						return;
					}
					case "D": {
						this.pushUndo();
						const lines = this.getLines();
						const cursor = this.getCursor();
						const range = computeOperatorRange(lines, cursor.line, cursor.col, "$");
						if (range) {
							const result = applyDelete(lines, range);
							this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);
						}
						return;
					}
					case "C": {
						this.pushUndo();
						const lines = this.getLines();
						const cursor = this.getCursor();
						const range = computeOperatorRange(lines, cursor.line, cursor.col, "$");
						if (range) {
							const result = applyDelete(lines, range);
							this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);
						}
						this.enterInsertMode();
						return;
					}
					case "s": {
						this.pushUndo();
						const lines = this.getLines();
						const cursor = this.getCursor();
						const range = computeOperatorRange(lines, cursor.line, cursor.col, "l", count);
						if (range) {
							const result = applyDelete(lines, range);
							this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);
						}
						this.enterInsertMode();
						return;
					}
					case "x": {
						this.pushUndo();
						const lines = this.getLines();
						const cursor = this.getCursor();
						const range = computeOperatorRange(lines, cursor.line, cursor.col, "l", count);
						if (range) {
							const result = applyDelete(lines, range);
							this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);
						}
						return;
					}
					case "o":
						this.openLineBelow();
						return;
					case "O":
						this.openLineAbove();
						return;
					case "G": {
						const lines = this.getLines();
						const cursor = this.getCursor();
						const targetLine = hasCount
							? Math.min(count - 1, lines.length - 1)
							: lines.length - 1;
						this.moveCursorTo(cursor, { line: Math.max(0, targetLine), col: 0 });
						return;
					}
					default:
						// Unknown key in normal mode — ignore
						return;
				}
			}

			return;
		}

		// Non-printable: pass control sequences (ctrl+c, etc.) to super
		super.handleInput(data);
	}

	/** Execute a pure motion (no operator) */
	private executeMotion(motion: string): void {
		const count = this.getEffectiveCount();
		const keepVisual = this.vim.mode === "visual" || this.vim.mode === "visual-line";
		this.vim.count = "";
		this.vim.operator = null;
		this.vim.operatorCount = "";
		this.vim.pendingCharMotion = null;
		this.pendingG = false;
		this.pendingCharMotion = null;
		if (!keepVisual) {
			this.vim.mode = "normal";
			this.visualAnchor = null;
		}

		const lines = this.getLines();
		const cursor = this.getCursor();

		let target: Pos;
		switch (motion) {
			case "w":
			case "W": {
				let pos: Pos = { line: cursor.line, col: cursor.col };
				for (let i = 0; i < count; i++) {
					pos = findNextWordStart(lines, pos.line, pos.col);
				}
				target = pos;
				break;
			}
			case "e":
			case "E": {
				let pos: Pos = { line: cursor.line, col: cursor.col };
				for (let i = 0; i < count; i++) {
					pos = findWordEnd(lines, pos.line, pos.col);
				}
				target = pos;
				break;
			}
			case "b": {
				let pos: Pos = { line: cursor.line, col: cursor.col };
				for (let i = 0; i < count; i++) {
					pos = findPrevWordStart(lines, pos.line, pos.col);
				}
				target = pos;
				break;
			}
			case "B": {
				let pos: Pos = { line: cursor.line, col: cursor.col };
				for (let i = 0; i < count; i++) {
					pos = findPrevWORDStart(lines, pos.line, pos.col);
				}
				target = pos;
				break;
			}
			case "0":
				target = { line: cursor.line, col: 0 };
				break;
			case "^":
				target = { line: cursor.line, col: findFirstNonWhitespaceCol(lines, cursor.line) };
				break;
			case "$":
				target = { line: cursor.line, col: (lines[cursor.line] ?? "").length };
				break;
			case "h":
				target = { line: cursor.line, col: Math.max(0, cursor.col - count) };
				break;
			case "l":
				target = { line: cursor.line, col: Math.min((lines[cursor.line] ?? "").length, cursor.col + count) };
				break;
			case "j":
				target = { line: Math.min(lines.length - 1, cursor.line + count), col: cursor.col };
				break;
			case "k":
				target = { line: Math.max(0, cursor.line - count), col: cursor.col };
				break;
			default:
				return;
		}

		this.moveCursorTo(cursor, target);
	}

	/** Move the editor cursor from current pos to target pos using escape sequences */
	private moveCursorTo(from: Pos, to: Pos): void {
		if (from.line === to.line && from.col === to.col) return;

		// For simple same-line horizontal movement, use arrow keys directly
		if (from.line === to.line) {
			const diff = to.col - from.col;
			if (diff > 0) {
				for (let i = 0; i < diff; i++) super.handleInput("\x1b[C");
			} else {
				for (let i = 0; i < -diff; i++) super.handleInput("\x1b[D");
			}
			return;
		}

		// Vertical movement
		if (to.line < from.line) {
			for (let i = 0; i < from.line - to.line; i++) super.handleInput("\x1b[A");
		} else {
			for (let i = 0; i < to.line - from.line; i++) super.handleInput("\x1b[B");
		}

		// After vertical move, go to correct column
		// Go to line start first, then right
		super.handleInput("\x01"); // Ctrl-A
		for (let i = 0; i < to.col; i++) super.handleInput("\x1b[C");
	}

	/** Execute operator with a linewise double-press (dd, cc, yy) */
	private executeOperatorLinewise(): void {
		const operator = this.vim.operator!;
		const count = this.getEffectiveCount();
		this.resetVimState();

		const lines = this.getLines();
		const cursor = this.getCursor();
		const range = computeOperatorRange(lines, cursor.line, cursor.col, operator, count);
		if (!range) return;
		if (operator === "y") {
			this.yankRange(lines, range);
			return;
		}

		this.pushUndo();
		this.yankRange(lines, range);
		const result = applyDelete(lines, range);
		this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);

		if (operator === "c") {
			// cc clears the line content — cursor is already at col 0
			this.enterInsertMode();
		}
	}

	/** Execute operator + motion (dw, ce, y$, etc.) */
	private executeOperatorMotion(motion: string): void {
		const operator = this.vim.operator!;
		const count = this.getEffectiveCount();
		this.resetVimState();

		const lines = this.getLines();
		const cursor = this.getCursor();
		const range = computeOperatorRange(lines, cursor.line, cursor.col, motion, count);
		if (!range) return;

		if (operator === "y") {
			this.yankRange(lines, range);
			return;
		}

		this.pushUndo();
		this.yankRange(lines, range);
		const result = applyDelete(lines, range);
		this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);

		if (operator === "c") {
			this.enterInsertMode();
		}
	}

	/** Execute a char-search motion (f/t/F/T) as a pure motion (no operator) */
	private executeCharMotion(charMotion: string, targetChar: string): void {
		const count = this.getEffectiveCount();
		const keepVisual = this.vim.mode === "visual" || this.vim.mode === "visual-line";
		this.vim.count = "";
		this.vim.operator = null;
		this.vim.operatorCount = "";
		this.vim.pendingCharMotion = null;
		this.pendingG = false;
		this.pendingCharMotion = null;
		if (!keepVisual) {
			this.vim.mode = "normal";
			this.visualAnchor = null;
		}

		const lines = this.getLines();
		const cursor = this.getCursor();

		let targetCol: number;

		if (charMotion === "f") {
			const found = findCharForward(lines, cursor.line, cursor.col, targetChar, count);
			if (found === -1) return;
			targetCol = found;
		} else if (charMotion === "t") {
			const found = findCharForward(lines, cursor.line, cursor.col, targetChar, count);
			if (found === -1) return;
			if (found - 1 <= cursor.col) return; // can't move (char is immediately next)
			targetCol = found - 1;
		} else if (charMotion === "F") {
			const found = findCharBackward(lines, cursor.line, cursor.col, targetChar, count);
			if (found === -1) return;
			targetCol = found;
		} else if (charMotion === "T") {
			const found = findCharBackward(lines, cursor.line, cursor.col, targetChar, count);
			if (found === -1) return;
			if (found + 1 >= cursor.col) return; // can't move (char is immediately before)
			targetCol = found + 1;
		} else {
			return;
		}

		this.moveCursorTo(cursor, { line: cursor.line, col: targetCol });
	}

	/** Execute operator + char-search motion (df, ct, yF, etc.) */
	private executeOperatorCharMotion(charMotion: string, targetChar: string): void {
		const operator = this.vim.operator!;
		const count = this.getEffectiveCount();
		this.resetVimState();

		const lines = this.getLines();
		const cursor = this.getCursor();
		const range = computeOperatorRange(lines, cursor.line, cursor.col, charMotion, count, targetChar);
		if (!range) return;

		if (operator === "y") {
			this.yankRange(lines, range);
			return;
		}

		this.pushUndo();
		this.yankRange(lines, range);
		const result = applyDelete(lines, range);
		this.applyTextChange(result.newLines, result.cursorLine, result.cursorCol);

		if (operator === "c") {
			this.enterInsertMode();
		}
	}

	/** Apply a text change: setText then reposition cursor */
	private applyTextChange(newLines: string[], targetLine: number, targetCol: number): void {
		const newText = newLines.join("\n");
		this.setText(newText);

		// setText puts cursor at end of text. We need to reposition.
		// Figure out where the cursor is after setText
		const endLine = newLines.length - 1;
		const endCol = (newLines[endLine] ?? "").length;

		// Move from end position to target position
		if (endLine !== targetLine || endCol !== targetCol) {
			// Move up to target line
			if (endLine > targetLine) {
				for (let i = 0; i < endLine - targetLine; i++) super.handleInput("\x1b[A");
			}
			// Go to start of line, then right to target col
			super.handleInput("\x01"); // Ctrl-A
			for (let i = 0; i < targetCol; i++) super.handleInput("\x1b[C");
		}
	}

	/** o: open new line below, enter insert mode */
	private openLineBelow(): void {
		this.vim.count = "";
		this.enterInsertMode();
		super.handleInput("\x05"); // Ctrl-E (end of line)
		super.handleInput("\n"); // newline
	}

	/** O: open new line above, enter insert mode */
	private openLineAbove(): void {
		this.vim.count = "";
		this.enterInsertMode();
		super.handleInput("\x01"); // Ctrl-A (start of line)
		super.handleInput("\n"); // newline
		super.handleInput("\x1b[A"); // up arrow
	}

	private buildLayoutSegments(contentWidth: number): LayoutSegment[] {
		const lines = this.getLines();
		const cursor = this.getCursor();
		const segments: LayoutSegment[] = [];

		if (lines.length === 0 || (lines.length === 1 && (lines[0] ?? "") === "")) {
			segments.push({
				text: "",
				logicalLine: 0,
				startCol: 0,
				endCol: 0,
				hasCursor: true,
				cursorPos: 0,
			});
			return segments;
		}

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i] ?? "";
			const isCurrentLine = i === cursor.line;
			if (visibleWidth(line) <= contentWidth) {
				segments.push({
					text: line,
					logicalLine: i,
					startCol: 0,
					endCol: line.length,
					hasCursor: isCurrentLine,
					cursorPos: isCurrentLine ? cursor.col : undefined,
				});
				continue;
			}

			const chunks = wordWrapLine(line, contentWidth);
			for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
				const chunk = chunks[chunkIndex]!;
				const isLastChunk = chunkIndex === chunks.length - 1;
				let hasCursor = false;
				let cursorPos: number | undefined;
				if (isCurrentLine) {
					if (isLastChunk) {
						hasCursor = cursor.col >= chunk.startIndex;
						cursorPos = Math.max(0, cursor.col - chunk.startIndex);
					} else if (cursor.col >= chunk.startIndex && cursor.col < chunk.endIndex) {
						hasCursor = true;
						cursorPos = Math.max(0, Math.min(chunk.text.length, cursor.col - chunk.startIndex));
					}
				}
				segments.push({
					text: chunk.text,
					logicalLine: i,
					startCol: chunk.startIndex,
					endCol: chunk.endIndex,
					hasCursor,
					cursorPos,
				});
			}
		}

		return segments;
	}

	private comparePos(a: Pos, b: Pos): number {
		if (a.line !== b.line) return a.line - b.line;
		return a.col - b.col;
	}

	private isSelected(line: number, col: number, start: Pos, end: Pos): boolean {
		const p = { line, col };
		return this.comparePos(p, start) >= 0 && this.comparePos(p, end) <= 0;
	}

	private applyInsertRainbow(lines: string[]): void {
		if (this.vim.mode !== "insert" || this.getText().length === 0) return;

		// super.render() returns top border, prompt content lines, bottom border,
		// and possibly autocomplete rows. Only colorize the prompt content rows.
		const bottomBorderIndex = lines.findIndex((line, index) => index > 0 && isEditorBorderLine(line));
		const contentEnd = bottomBorderIndex === -1 ? lines.length - 1 : bottomBorderIndex;
		for (let i = 1; i < contentEnd; i++) {
			lines[i] = colorizeRainbowLine(lines[i]!, this.rainbowFrame, i * 3);
		}
	}

	render(width: number): string[] {
		const lines = super.render(width);
		if (lines.length === 0) return lines;

		this.updateRainbowAnimation();
		this.applyInsertRainbow(lines);

		if ((this.vim.mode === "visual" || this.vim.mode === "visual-line") && this.visualAnchor) {
			const maxPadding = Math.max(0, Math.floor((width - 1) / 2));
			const paddingX = Math.min(this.getPaddingX(), maxPadding);
			const contentWidth = Math.max(1, width - paddingX * 2);
			const layoutWidth = Math.max(1, contentWidth - (paddingX ? 0 : 1));
			const allSegments = this.buildLayoutSegments(layoutWidth);

			const terminalRows = this.tui.terminal.rows;
			const maxVisibleLines = Math.max(5, Math.floor(terminalRows * 0.3));
			let cursorLineIndex = allSegments.findIndex((s) => s.hasCursor);
			if (cursorLineIndex === -1) cursorLineIndex = 0;
			if (cursorLineIndex < this.renderScrollOffset) {
				this.renderScrollOffset = cursorLineIndex;
			} else if (cursorLineIndex >= this.renderScrollOffset + maxVisibleLines) {
				this.renderScrollOffset = cursorLineIndex - maxVisibleLines + 1;
			}
			const maxScrollOffset = Math.max(0, allSegments.length - maxVisibleLines);
			this.renderScrollOffset = Math.max(0, Math.min(this.renderScrollOffset, maxScrollOffset));
			const visibleSegments = allSegments.slice(this.renderScrollOffset, this.renderScrollOffset + maxVisibleLines);

			const cursorPos = this.getCursor();
			const selectionStart = this.comparePos(this.visualAnchor, cursorPos) <= 0
				? this.visualAnchor
				: cursorPos;
			const selectionEnd = this.comparePos(this.visualAnchor, cursorPos) <= 0
				? cursorPos
				: this.visualAnchor;
			const lineStart = Math.min(this.visualAnchor.line, cursorPos.line);
			const lineEnd = Math.max(this.visualAnchor.line, cursorPos.line);

			const leftPadding = " ".repeat(paddingX);
			const rightPadding = leftPadding;
			const contentBase = 1;
			for (let i = 0; i < visibleSegments.length && contentBase + i < lines.length; i++) {
				const seg = visibleSegments[i]!;
				let rendered = "";
				for (let col = 0; col < seg.text.length; col++) {
					const ch = seg.text[col]!;
					const logicalCol = seg.startCol + col;
					const isCursorChar = seg.hasCursor && seg.cursorPos === col;
					const selected = this.vim.mode === "visual-line"
						? seg.logicalLine >= lineStart && seg.logicalLine <= lineEnd
						: this.isSelected(seg.logicalLine, logicalCol, selectionStart, selectionEnd);
					if (isCursorChar) {
						rendered += `\x1b[1;7m${ch}\x1b[0m`;
					} else if (selected) {
						rendered += `\x1b[7m${ch}\x1b[0m`;
					} else {
						rendered += ch;
					}
				}

				if (seg.hasCursor && (seg.cursorPos ?? 0) >= seg.text.length) {
					const logicalCol = seg.startCol + (seg.cursorPos ?? 0);
					const selected = this.vim.mode === "visual-line"
						? seg.logicalLine >= lineStart && seg.logicalLine <= lineEnd
						: this.isSelected(seg.logicalLine, logicalCol, selectionStart, selectionEnd);
					rendered += selected ? "\x1b[1;7m \x1b[0m" : "\x1b[1;7m \x1b[0m";
				}

				const plain = rendered.replace(/\x1b\[[0-9;]*m/g, "");
				const padding = " ".repeat(Math.max(0, contentWidth - visibleWidth(plain)));
				lines[contentBase + i] = `${leftPadding}${rendered}${padding}${rightPadding}`;
			}
		}

		// Build mode label
		let label: string;
		if (this.vim.mode === "insert") {
			label = " INSERT ";
		} else if (this.vim.mode === "operator-pending") {
			const opCount = this.vim.operatorCount || "";
			const motionCount = this.vim.count || "";
			const charMotion = this.pendingCharMotion || "";
			label = ` NORMAL ${opCount}${this.vim.operator}${motionCount}${charMotion} `;
		} else if (this.vim.mode === "visual") {
			const pending = this.vim.count || "";
			const charMotion = this.pendingCharMotion || "";
			const extra = `${pending}${charMotion}`;
			label = extra ? ` VISUAL ${extra} ` : " VISUAL ";
		} else if (this.vim.mode === "visual-line") {
			const pending = this.vim.count || "";
			const charMotion = this.pendingCharMotion || "";
			const extra = `${pending}${charMotion}`;
			label = extra ? ` V-LINE ${extra} ` : " V-LINE ";
		} else {
			const pending = this.vim.count || "";
			const charMotion = this.pendingCharMotion || "";
			const extra = `${pending}${charMotion}`;
			label = extra ? ` NORMAL ${extra} ` : " NORMAL ";
		}

		const last = lines.length - 1;
		if (visibleWidth(lines[last]!) >= label.length) {
			lines[last] = truncateToWidth(lines[last]!, width - label.length, "") + label;
		}
		return lines;
	}
}

export default function (pi: ExtensionAPI) {
	let currentEditor: ModalEditor | null = null;

	pi.on("session_start", (_event, ctx) => {
		currentEditor?.dispose();
		ctx.ui.setEditorComponent((tui, theme, kb) => {
			const editor = new ModalEditor(tui, theme, kb);
			currentEditor = editor;
			return editor;
		});
	});

	pi.on("session_shutdown", async () => {
		currentEditor?.dispose();
		currentEditor = null;
	});
}
