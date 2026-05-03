/**
 * Vim mode pure logic — word boundary, operator range, and text manipulation functions.
 * No TUI dependencies — safe to import from tests.
 */

/** Position in the text buffer */
export interface Pos {
	line: number;
	col: number;
}

const PUNCTUATION_REGEX = /[(){}[\]<>.,;:'"!?+\-=*/\\|&%^$#@~`]/;

export function isWhitespace(ch: string): boolean {
	return /\s/.test(ch);
}

export function isPunctuation(ch: string): boolean {
	return PUNCTUATION_REGEX.test(ch);
}

export function isWordChar(ch: string): boolean {
	return !isWhitespace(ch) && !isPunctuation(ch);
}

/**
 * Classify a character into word class:
 *   0 = whitespace, 1 = punctuation, 2 = word
 */
function charClass(ch: string): number {
	if (isWhitespace(ch)) return 0;
	if (isPunctuation(ch)) return 1;
	return 2;
}

/**
 * Vim `w` motion: move to the start of the next word.
 *
 * From the current position:
 * 1. Skip past the current word (same char class)
 * 2. Skip whitespace (including line breaks)
 * 3. Land on the first char of the next word
 *
 * If at end of text, returns the same position.
 */
export function findNextWordStart(lines: string[], line: number, col: number): Pos {
	const totalLines = lines.length;
	if (totalLines === 0) return { line, col };

	let l = line;
	let c = col;
	const currentLine = lines[l] ?? "";

	// If at or past end of current line, jump to next line start
	if (c >= currentLine.length) {
		if (l < totalLines - 1) {
			l++;
			c = 0;
			// Skip leading whitespace on new line
			const newLine = lines[l] ?? "";
			while (c < newLine.length && isWhitespace(newLine[c]!)) c++;
			if (c < newLine.length) return { line: l, col: c };
			// If entire line is whitespace, keep going
			return findNextWordStart(lines, l, c);
		}
		return { line: l, col: currentLine.length };
	}

	// Step 1: Skip current class run
	const cls = charClass(currentLine[c]!);
	if (cls === 0) {
		// On whitespace: skip whitespace, then we're at next word
		while (c < currentLine.length && isWhitespace(currentLine[c]!)) c++;
		if (c < currentLine.length) return { line: l, col: c };
		// Ran off the line
	} else {
		// On word or punct: skip same-class chars
		while (c < currentLine.length && charClass(currentLine[c]!) === cls) c++;
		// Now skip whitespace
		while (c < currentLine.length && isWhitespace(currentLine[c]!)) c++;
		if (c < currentLine.length) return { line: l, col: c };
		// Ran off the line
	}

	// Crossed line boundary: advance to next line
	if (l < totalLines - 1) {
		l++;
		c = 0;
		const newLine = lines[l] ?? "";
		while (c < newLine.length && isWhitespace(newLine[c]!)) c++;
		if (c < newLine.length) return { line: l, col: c };
		// Empty/whitespace-only line? Keep searching
		return findNextWordStart(lines, l, c);
	}

	// At end of text
	return { line: l, col: (lines[l] ?? "").length };
}

/**
 * Vim `e` motion: move to the end of the current/next word.
 *
 * If already at the end of a word (next char is different class or EOL),
 * skip whitespace and go to end of next word. Otherwise go to end of current word.
 */
export function findWordEnd(lines: string[], line: number, col: number): Pos {
	const totalLines = lines.length;
	if (totalLines === 0) return { line, col };

	let l = line;
	let c = col;

	// Move at least one character forward
	c++;
	const currentLine = lines[l] ?? "";

	// If past end of line, go to next line
	if (c >= currentLine.length) {
		if (l < totalLines - 1) {
			l++;
			c = 0;
		} else {
			return { line: l, col: Math.max(0, currentLine.length - 1) };
		}
	}

	// Skip whitespace (including crossing lines)
	while (true) {
		const ln = lines[l] ?? "";
		if (c >= ln.length) {
			if (l < totalLines - 1) {
				l++;
				c = 0;
				continue;
			}
			return { line: l, col: Math.max(0, ln.length - 1) };
		}
		if (isWhitespace(ln[c]!)) {
			c++;
		} else {
			break;
		}
	}

	// Now skip same-class chars to find end of word
	const ln = lines[l] ?? "";
	const cls = charClass(ln[c]!);
	while (c + 1 < ln.length && charClass(ln[c + 1]!) === cls) c++;

	return { line: l, col: c };
}

/**
 * Vim `b` motion: move to the start of the previous word.
 *
 * From the current position:
 * 1. Move one character backward
 * 2. Skip whitespace backward (including crossing line boundaries)
 * 3. Determine the char class at the landing position
 * 4. Skip backward over same-class characters
 * 5. Return the position of the first character of that word
 *
 * If at beginning of buffer, returns {line: 0, col: 0}.
 */
export function findPrevWordStart(lines: string[], line: number, col: number): Pos {
	const totalLines = lines.length;
	if (totalLines === 0) return { line: 0, col: 0 };

	let l = line;
	let c = col;

	// Step 1: Move one character backward
	c--;
	if (c < 0) {
		if (l > 0) {
			l--;
			c = (lines[l] ?? "").length - 1;
		} else {
			return { line: 0, col: 0 };
		}
	}

	// Step 2: Skip whitespace backward (including crossing line boundaries)
	while (true) {
		const ln = lines[l] ?? "";
		if (ln.length === 0) {
			// Empty line — skip upward
			if (l > 0) {
				l--;
				c = (lines[l] ?? "").length - 1;
				if (c < 0) continue; // previous line also empty
				continue;
			}
			return { line: 0, col: 0 };
		}
		if (c < 0) {
			if (l > 0) {
				l--;
				c = (lines[l] ?? "").length - 1;
				continue;
			}
			return { line: 0, col: 0 };
		}
		if (isWhitespace(ln[c]!)) {
			c--;
			continue;
		}
		break;
	}

	// Step 3 & 4: Determine char class and skip backward over same-class chars
	const ln = lines[l] ?? "";
	const cls = charClass(ln[c]!);
	while (c > 0 && charClass(ln[c - 1]!) === cls) {
		c--;
	}

	return { line: l, col: c };
}

/**
 * Vim `B` motion: move to the start of the previous WORD.
 * A WORD is any sequence of non-whitespace characters (punctuation is NOT a boundary).
 * Only whitespace separates WORDs.
 *
 * If at beginning of buffer, returns {line: 0, col: 0}.
 */
export function findPrevWORDStart(lines: string[], line: number, col: number): Pos {
	const totalLines = lines.length;
	if (totalLines === 0) return { line: 0, col: 0 };

	let l = line;
	let c = col;

	// Step 1: Move one character backward
	c--;
	if (c < 0) {
		if (l > 0) {
			l--;
			c = (lines[l] ?? "").length - 1;
		} else {
			return { line: 0, col: 0 };
		}
	}

	// Step 2: Skip whitespace backward (including crossing line boundaries)
	while (true) {
		const ln = lines[l] ?? "";
		if (ln.length === 0) {
			if (l > 0) {
				l--;
				c = (lines[l] ?? "").length - 1;
				if (c < 0) continue;
				continue;
			}
			return { line: 0, col: 0 };
		}
		if (c < 0) {
			if (l > 0) {
				l--;
				c = (lines[l] ?? "").length - 1;
				continue;
			}
			return { line: 0, col: 0 };
		}
		if (isWhitespace(ln[c]!)) {
			c--;
			continue;
		}
		break;
	}

	// Step 3: Skip backward over all non-whitespace chars (the entire WORD)
	const ln = lines[l] ?? "";
	while (c > 0 && !isWhitespace(ln[c - 1]!)) {
		c--;
	}

	return { line: l, col: c };
}

/**
 * Find the nth occurrence of `char` forward on the current line, starting after `col`.
 * Returns the column index, or -1 if not found.
 */
export function findCharForward(lines: string[], line: number, col: number, char: string, count: number = 1): number {
	const ln = lines[line] ?? "";
	let found = 0;
	for (let c = col + 1; c < ln.length; c++) {
		if (ln[c] === char) {
			found++;
			if (found === count) return c;
		}
	}
	return -1;
}

/**
 * Find the nth occurrence of `char` backward on the current line, starting before `col`.
 * Returns the column index, or -1 if not found.
 */
export function findCharBackward(lines: string[], line: number, col: number, char: string, count: number = 1): number {
	const ln = lines[line] ?? "";
	let found = 0;
	for (let c = col - 1; c >= 0; c--) {
		if (ln[c] === char) {
			found++;
			if (found === count) return c;
		}
	}
	return -1;
}

/** Find first non-whitespace column on a line (Vim `^` motion). */
export function findFirstNonWhitespaceCol(lines: string[], line: number): number {
	const ln = lines[line] ?? "";
	let c = 0;
	while (c < ln.length && isWhitespace(ln[c]!)) c++;
	return c;
}

/** Range for an operator to act on */
export interface OperatorRange {
	startLine: number;
	startCol: number;
	endLine: number;
	endCol: number; // exclusive
	linewise: boolean;
}

/**
 * Compute the range that an operator+motion acts on.
 * For character motions (w, e, h, l, 0, $, f, t, F, T), returns a char range.
 * For linewise motions (dd, cc), returns a linewise range.
 *
 * @param count number of repetitions
 * @param targetChar target character for f/t/F/T motions
 */
export function computeOperatorRange(
	lines: string[],
	line: number,
	col: number,
	motion: string,
	count: number = 1,
	targetChar?: string,
): OperatorRange | null {
	if (motion === "d" || motion === "c" || motion === "y") {
		// dd, cc, yy: linewise, count lines
		const endLine = Math.min(line + count, lines.length);
		return {
			startLine: line,
			startCol: 0,
			endLine,
			endCol: 0,
			linewise: true,
		};
	}

	if (motion === "w") {
		let pos: Pos = { line, col };
		for (let i = 0; i < count; i++) {
			pos = findNextWordStart(lines, pos.line, pos.col);
		}
		// If we crossed a line, for dw behavior delete to end of current line
		if (pos.line > line) {
			const currentLine = lines[line] ?? "";
			return {
				startLine: line,
				startCol: col,
				endLine: line,
				endCol: currentLine.length,
				linewise: false,
			};
		}
		return {
			startLine: line,
			startCol: col,
			endLine: pos.line,
			endCol: pos.col,
			linewise: false,
		};
	}

	if (motion === "e") {
		let pos: Pos = { line, col };
		for (let i = 0; i < count; i++) {
			pos = findWordEnd(lines, pos.line, pos.col);
		}
		// `e` is inclusive: include the char at pos
		return {
			startLine: line,
			startCol: col,
			endLine: pos.line,
			endCol: pos.col + 1,
			linewise: false,
		};
	}

	if (motion === "b") {
		let pos: Pos = { line, col };
		for (let i = 0; i < count; i++) {
			pos = findPrevWordStart(lines, pos.line, pos.col);
		}
		return {
			startLine: pos.line,
			startCol: pos.col,
			endLine: line,
			endCol: col,
			linewise: false,
		};
	}

	if (motion === "B") {
		let pos: Pos = { line, col };
		for (let i = 0; i < count; i++) {
			pos = findPrevWORDStart(lines, pos.line, pos.col);
		}
		return {
			startLine: pos.line,
			startCol: pos.col,
			endLine: line,
			endCol: col,
			linewise: false,
		};
	}

	if (motion === "$") {
		const currentLine = lines[line] ?? "";
		return {
			startLine: line,
			startCol: col,
			endLine: line,
			endCol: currentLine.length,
			linewise: false,
		};
	}

	if (motion === "0") {
		return {
			startLine: line,
			startCol: 0,
			endLine: line,
			endCol: col,
			linewise: false,
		};
	}

	if (motion === "^") {
		return {
			startLine: line,
			startCol: findFirstNonWhitespaceCol(lines, line),
			endLine: line,
			endCol: col,
			linewise: false,
		};
	}

	if (motion === "h") {
		const newCol = Math.max(0, col - count);
		return {
			startLine: line,
			startCol: newCol,
			endLine: line,
			endCol: col,
			linewise: false,
		};
	}

	if (motion === "l") {
		const currentLine = lines[line] ?? "";
		const newCol = Math.min(currentLine.length, col + count);
		return {
			startLine: line,
			startCol: col,
			endLine: line,
			endCol: newCol,
			linewise: false,
		};
	}

	if (motion === "j") {
		const endLine = Math.min(line + count + 1, lines.length);
		return {
			startLine: line,
			startCol: 0,
			endLine,
			endCol: 0,
			linewise: true,
		};
	}

	if (motion === "k") {
		const startLine = Math.max(0, line - count);
		return {
			startLine,
			startCol: 0,
			endLine: line + 1,
			endCol: 0,
			linewise: true,
		};
	}

	if (motion === "f" && targetChar) {
		const foundCol = findCharForward(lines, line, col, targetChar, count);
		if (foundCol === -1) return null;
		return {
			startLine: line,
			startCol: col,
			endLine: line,
			endCol: foundCol + 1, // f is inclusive: include the found char
			linewise: false,
		};
	}

	if (motion === "t" && targetChar) {
		const foundCol = findCharForward(lines, line, col, targetChar, count);
		if (foundCol === -1) return null;
		if (foundCol <= col + 1) return null; // t needs at least one char gap
		return {
			startLine: line,
			startCol: col,
			endLine: line,
			endCol: foundCol, // t is exclusive of the found char
			linewise: false,
		};
	}

	if (motion === "F" && targetChar) {
		const foundCol = findCharBackward(lines, line, col, targetChar, count);
		if (foundCol === -1) return null;
		return {
			startLine: line,
			startCol: foundCol,
			endLine: line,
			endCol: col, // F is exclusive of cursor position (like b)
			linewise: false,
		};
	}

	if (motion === "T" && targetChar) {
		const foundCol = findCharBackward(lines, line, col, targetChar, count);
		if (foundCol === -1) return null;
		if (foundCol >= col - 1) return null; // T needs at least one char gap
		return {
			startLine: line,
			startCol: foundCol + 1, // T is exclusive of the found char
			endLine: line,
			endCol: col, // exclusive of cursor position
			linewise: false,
		};
	}

	return null;
}

/**
 * Extract text for an operator range (used for yank/register operations).
 */
export function extractRange(lines: string[], range: OperatorRange): string {
	if (range.linewise) {
		return lines.slice(range.startLine, range.endLine).join("\n");
	}

	if (range.startLine === range.endLine) {
		const line = lines[range.startLine] ?? "";
		return line.slice(range.startCol, range.endCol);
	}

	const out: string[] = [];
	const first = lines[range.startLine] ?? "";
	out.push(first.slice(range.startCol));
	for (let l = range.startLine + 1; l < range.endLine; l++) {
		out.push(lines[l] ?? "");
	}
	const last = lines[range.endLine] ?? "";
	out.push(last.slice(0, range.endCol));
	return out.join("\n");
}

/**
 * Apply a delete operation to text lines.
 * Returns { newLines, cursorLine, cursorCol }.
 */
export function applyDelete(
	lines: string[],
	range: OperatorRange,
): { newLines: string[]; cursorLine: number; cursorCol: number } {
	const newLines = lines.map((l) => l); // shallow copy

	if (range.linewise) {
		const count = range.endLine - range.startLine;
		newLines.splice(range.startLine, count);
		if (newLines.length === 0) newLines.push("");
		const cursorLine = Math.min(range.startLine, newLines.length - 1);
		const cursorCol = 0;
		return { newLines, cursorLine, cursorCol };
	}

	// Character-wise delete
	if (range.startLine === range.endLine) {
		// Same line
		const line = newLines[range.startLine] ?? "";
		newLines[range.startLine] = line.slice(0, range.startCol) + line.slice(range.endCol);
		return { newLines, cursorLine: range.startLine, cursorCol: range.startCol };
	}

	// Multi-line character delete
	const startLine = newLines[range.startLine] ?? "";
	const endLine = newLines[range.endLine] ?? "";
	const merged = startLine.slice(0, range.startCol) + endLine.slice(range.endCol);
	newLines.splice(range.startLine, range.endLine - range.startLine + 1, merged);
	return { newLines, cursorLine: range.startLine, cursorCol: range.startCol };
}
