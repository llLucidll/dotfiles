/**
 * Tests for vim-mode pure functions.
 *
 * Run: npx vitest run vim-mode.test.ts
 */

import { describe, expect, it } from "vitest";
import {
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
} from "./vim-core.ts";

// ─── Character classification ────────────────────────────────────────

describe("character classification", () => {
	it("classifies whitespace", () => {
		expect(isWhitespace(" ")).toBeTruthy();
		expect(isWhitespace("\t")).toBeTruthy();
		expect(!isWhitespace("a")).toBeTruthy();
		expect(!isWhitespace(".")).toBeTruthy();
	});

	it("classifies punctuation", () => {
		expect(isPunctuation(".")).toBeTruthy();
		expect(isPunctuation("(")).toBeTruthy();
		expect(isPunctuation("+")).toBeTruthy();
		expect(!isPunctuation("a")).toBeTruthy();
		expect(!isPunctuation(" ")).toBeTruthy();
	});

	it("classifies word characters", () => {
		expect(isWordChar("a")).toBeTruthy();
		expect(isWordChar("Z")).toBeTruthy();
		expect(isWordChar("0")).toBeTruthy();
		expect(isWordChar("_")).toBeTruthy();
		expect(!isWordChar(" ")).toBeTruthy();
		expect(!isWordChar(".")).toBeTruthy();
	});
});

describe("findFirstNonWhitespaceCol", () => {
	it("returns first non-whitespace column", () => {
		expect(findFirstNonWhitespaceCol(["   abc"], 0)).toBe(3);
	});

	it("returns 0 for non-indented line", () => {
		expect(findFirstNonWhitespaceCol(["abc"], 0)).toBe(0);
	});

	it("returns line length for whitespace-only line", () => {
		expect(findFirstNonWhitespaceCol(["   "], 0)).toBe(3);
	});
});

// ─── findNextWordStart (w motion) ────────────────────────────────────

describe("findNextWordStart", () => {
	it("moves from start of word to start of next word", () => {
		const result = findNextWordStart(["hello world"], 0, 0);
		expect(result).toEqual({ line: 0, col: 6 });
	});

	it("moves from middle of word to start of next word", () => {
		const result = findNextWordStart(["hello world"], 0, 3);
		expect(result).toEqual({ line: 0, col: 6 });
	});

	it("skips multiple spaces", () => {
		const result = findNextWordStart(["foo  bar"], 0, 0);
		expect(result).toEqual({ line: 0, col: 5 });
	});

	it("stops at punctuation boundary", () => {
		const result = findNextWordStart(["foo.bar"], 0, 0);
		expect(result).toEqual({ line: 0, col: 3 });
	});

	it("moves from punctuation to next word", () => {
		const result = findNextWordStart(["foo.bar"], 0, 3);
		expect(result).toEqual({ line: 0, col: 4 });
	});

	it("crosses line boundary from end of word", () => {
		const result = findNextWordStart(["end", "next"], 0, 3);
		expect(result).toEqual({ line: 1, col: 0 });
	});

	it("w from start of only word on line crosses to next line", () => {
		const result = findNextWordStart(["end", "next"], 0, 0);
		// "end" fills the whole line, w skips past it and crosses to next line
		expect(result).toEqual({ line: 1, col: 0 });
	});

	it("skips empty lines", () => {
		const result = findNextWordStart(["hello", "", "world"], 0, 5);
		expect(result).toEqual({ line: 2, col: 0 });
	});

	it("stays at end of last line when no more words", () => {
		const result = findNextWordStart(["hello"], 0, 3);
		expect(result).toEqual({ line: 0, col: 5 });
	});

	it("handles single character words", () => {
		const result = findNextWordStart(["a b c"], 0, 0);
		expect(result).toEqual({ line: 0, col: 2 });
	});

	it("starts from whitespace", () => {
		const result = findNextWordStart(["  hello"], 0, 0);
		expect(result).toEqual({ line: 0, col: 2 });
	});

	it("handles empty lines array", () => {
		const result = findNextWordStart([], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("handles single empty line", () => {
		const result = findNextWordStart([""], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("handles only whitespace", () => {
		const result = findNextWordStart(["   "], 0, 0);
		expect(result).toEqual({ line: 0, col: 3 });
	});
});

// ─── findWordEnd (e motion) ─────────────────────────────────────────

describe("findWordEnd", () => {
	it("from start of word to end of word", () => {
		const result = findWordEnd(["hello world"], 0, 0);
		expect(result).toEqual({ line: 0, col: 4 });
	});

	it("from end of word to end of next word", () => {
		const result = findWordEnd(["hello world"], 0, 4);
		expect(result).toEqual({ line: 0, col: 10 });
	});

	it("stops at word boundary before punctuation", () => {
		const result = findWordEnd(["foo.bar"], 0, 0);
		expect(result).toEqual({ line: 0, col: 2 });
	});

	it("from punctuation to end of next word class", () => {
		// At col 2 (last char of "foo"), e moves forward one, lands on ".",
		// which is punctuation — it's a 1-char class run, so end = col 3
		const result = findWordEnd(["foo.bar"], 0, 2);
		expect(result).toEqual({ line: 0, col: 3 });
	});

	it("crosses line boundary", () => {
		const result = findWordEnd(["hi", "world"], 0, 1);
		expect(result).toEqual({ line: 1, col: 4 });
	});

	it("from mid-word to end of word", () => {
		const result = findWordEnd(["hello"], 0, 1);
		expect(result).toEqual({ line: 0, col: 4 });
	});

	it("handles single char words", () => {
		const result = findWordEnd(["a b c"], 0, 0);
		expect(result).toEqual({ line: 0, col: 2 });
	});

	it("handles empty lines", () => {
		const result = findWordEnd([], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});
});

// ─── findPrevWordStart (b motion) ────────────────────────────────────

describe("findPrevWordStart", () => {
	it("b from start of second word", () => {
		const result = findPrevWordStart(["hello world"], 0, 6);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b from mid-word", () => {
		const result = findPrevWordStart(["hello world"], 0, 8);
		expect(result).toEqual({ line: 0, col: 6 });
	});

	it("b at start of buffer", () => {
		const result = findPrevWordStart(["hello world"], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b skips multiple spaces", () => {
		const result = findPrevWordStart(["foo  bar"], 0, 5);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b stops at punctuation", () => {
		const result = findPrevWordStart(["foo.bar"], 0, 4);
		expect(result).toEqual({ line: 0, col: 3 });
	});

	it("b from punct to prev word", () => {
		const result = findPrevWordStart(["foo.bar"], 0, 3);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b crosses line boundary", () => {
		const result = findPrevWordStart(["first", "second"], 1, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b skips empty lines", () => {
		const result = findPrevWordStart(["first", "", "third"], 2, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b with single-char words", () => {
		const result = findPrevWordStart(["a b c"], 0, 4);
		expect(result).toEqual({ line: 0, col: 2 });
	});

	it("handles empty lines array", () => {
		const result = findPrevWordStart([], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("handles single empty line", () => {
		const result = findPrevWordStart([""], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b from col 1 on first line", () => {
		const result = findPrevWordStart(["hello"], 0, 1);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b crosses line to end of previous word", () => {
		const result = findPrevWordStart(["hello world", "next"], 1, 0);
		expect(result).toEqual({ line: 0, col: 6 });
	});
});

// ─── findPrevWORDStart (B motion) ────────────────────────────────────

describe("findPrevWORDStart", () => {
	it("B from start of second WORD", () => {
		const result = findPrevWORDStart(["hello world"], 0, 6);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("B from mid-WORD", () => {
		const result = findPrevWORDStart(["hello world"], 0, 8);
		expect(result).toEqual({ line: 0, col: 6 });
	});

	it("B treats punctuation as part of WORD (key difference from b)", () => {
		// b would stop at the '.', but B skips over it
		const result = findPrevWORDStart(["foo.bar baz"], 0, 8);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("B from punctuation stays in same WORD", () => {
		// cursor on 'b' at col 4 in "foo.bar", B goes to start of WORD
		const result = findPrevWORDStart(["foo.bar"], 0, 4);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("b stops at punctuation boundary (contrast with B)", () => {
		// b from col 4 ('b') in "foo.bar" stops at '.' (col 3)
		const result = findPrevWordStart(["foo.bar"], 0, 4);
		expect(result).toEqual({ line: 0, col: 3 });
	});

	it("B at start of buffer", () => {
		const result = findPrevWORDStart(["hello"], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("B skips multiple spaces", () => {
		const result = findPrevWORDStart(["foo  bar"], 0, 5);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("B crosses line boundary", () => {
		const result = findPrevWORDStart(["first", "second"], 1, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("B skips empty lines", () => {
		const result = findPrevWORDStart(["first", "", "third"], 2, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("B crosses line to end of previous WORD", () => {
		const result = findPrevWORDStart(["hello world", "next"], 1, 0);
		expect(result).toEqual({ line: 0, col: 6 });
	});

	it("B with mixed punctuation WORD", () => {
		// "a.b+c" is one WORD, "x" is another
		const result = findPrevWORDStart(["a.b+c x"], 0, 6);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("handles empty lines array", () => {
		const result = findPrevWORDStart([], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});

	it("handles single empty line", () => {
		const result = findPrevWORDStart([""], 0, 0);
		expect(result).toEqual({ line: 0, col: 0 });
	});
});

// ─── computeOperatorRange ───────────────────────────────────────────

describe("computeOperatorRange", () => {
	describe("w motion", () => {
		it("dw at start of line", () => {
			const range = computeOperatorRange(["hello world"], 0, 0, "w");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 0, endCol: 6,
				linewise: false,
			});
		});

		it("dw at last word goes to end of line", () => {
			const range = computeOperatorRange(["hello world"], 0, 6, "w");
			expect(range).toEqual({
				startLine: 0, startCol: 6,
				endLine: 0, endCol: 11,
				linewise: false,
			});
		});

		it("d2w deletes two words", () => {
			const range = computeOperatorRange(["one two three"], 0, 0, "w", 2);
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 0, endCol: 8,
				linewise: false,
			});
		});
	});

	describe("e motion", () => {
		it("de at start of word (inclusive)", () => {
			const range = computeOperatorRange(["hello world"], 0, 0, "e");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 0, endCol: 5,
				linewise: false,
			});
		});
	});

	describe("$ motion", () => {
		it("d$ deletes to end of line", () => {
			const range = computeOperatorRange(["hello world"], 0, 6, "$");
			expect(range).toEqual({
				startLine: 0, startCol: 6,
				endLine: 0, endCol: 11,
				linewise: false,
			});
		});
	});

	describe("0 motion", () => {
		it("d0 deletes to start of line", () => {
			const range = computeOperatorRange(["hello world"], 0, 6, "0");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 0, endCol: 6,
				linewise: false,
			});
		});
	});

	describe("^ motion", () => {
		it("d^ deletes to first non-whitespace", () => {
			const range = computeOperatorRange(["   hello world"], 0, 8, "^");
			expect(range).toEqual({
				startLine: 0, startCol: 3,
				endLine: 0, endCol: 8,
				linewise: false,
			});
		});
	});

	describe("linewise (dd, cc)", () => {
		it("dd deletes one line", () => {
			const range = computeOperatorRange(["hello", "world"], 0, 0, "d");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 1, endCol: 0,
				linewise: true,
			});
		});

		it("2dd deletes two lines", () => {
			const range = computeOperatorRange(["a", "b", "c"], 0, 0, "d", 2);
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 2, endCol: 0,
				linewise: true,
			});
		});

		it("dd clamps to end of file", () => {
			const range = computeOperatorRange(["a", "b"], 0, 0, "d", 5);
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 2, endCol: 0,
				linewise: true,
			});
		});

		it("yy yanks one line (linewise)", () => {
			const range = computeOperatorRange(["hello", "world"], 0, 0, "y");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 1, endCol: 0,
				linewise: true,
			});
		});

		it("2yy yanks two lines", () => {
			const range = computeOperatorRange(["a", "b", "c"], 0, 0, "y", 2);
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 2, endCol: 0,
				linewise: true,
			});
		});
	});

	describe("h motion", () => {
		it("dh deletes one char left", () => {
			const range = computeOperatorRange(["hello"], 0, 3, "h");
			expect(range).toEqual({
				startLine: 0, startCol: 2,
				endLine: 0, endCol: 3,
				linewise: false,
			});
		});
	});

	describe("l motion", () => {
		it("dl deletes one char right", () => {
			const range = computeOperatorRange(["hello"], 0, 2, "l");
			expect(range).toEqual({
				startLine: 0, startCol: 2,
				endLine: 0, endCol: 3,
				linewise: false,
			});
		});
	});

	describe("b motion", () => {
		it("db deletes backward one word", () => {
			const range = computeOperatorRange(["hello world"], 0, 6, "b");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 0, endCol: 6,
				linewise: false,
			});
		});

		it("d2b deletes backward two words", () => {
			const range = computeOperatorRange(["one two three"], 0, 8, "b", 2);
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 0, endCol: 8,
				linewise: false,
			});
		});
	});

	describe("B motion", () => {
		it("dB deletes backward one WORD (crosses punctuation)", () => {
			const range = computeOperatorRange(["foo.bar baz"], 0, 8, "B");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 0, endCol: 8,
				linewise: false,
			});
		});

		it("db stops at punctuation (contrast with dB)", () => {
			const range = computeOperatorRange(["foo.bar baz"], 0, 8, "b");
			expect(range).toEqual({
				startLine: 0, startCol: 4,
				endLine: 0, endCol: 8,
				linewise: false,
			});
		});
	});

	describe("j motion", () => {
		it("dj deletes current line and line below (linewise)", () => {
			const range = computeOperatorRange(["a", "b", "c", "d"], 1, 0, "j");
			expect(range).toEqual({
				startLine: 1, startCol: 0,
				endLine: 3, endCol: 0,
				linewise: true,
			});
		});

		it("d2j deletes current line and 2 lines below", () => {
			const range = computeOperatorRange(["a", "b", "c", "d"], 0, 0, "j", 2);
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 3, endCol: 0,
				linewise: true,
			});
		});

		it("dj clamps to end of file", () => {
			const range = computeOperatorRange(["a", "b"], 1, 0, "j");
			expect(range).toEqual({
				startLine: 1, startCol: 0,
				endLine: 2, endCol: 0,
				linewise: true,
			});
		});
	});

	describe("k motion", () => {
		it("dk deletes current line and line above (linewise)", () => {
			const range = computeOperatorRange(["a", "b", "c", "d"], 2, 0, "k");
			expect(range).toEqual({
				startLine: 1, startCol: 0,
				endLine: 3, endCol: 0,
				linewise: true,
			});
		});

		it("d2k deletes current line and 2 lines above", () => {
			const range = computeOperatorRange(["a", "b", "c", "d"], 2, 0, "k", 2);
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 3, endCol: 0,
				linewise: true,
			});
		});

		it("dk clamps to beginning of file", () => {
			const range = computeOperatorRange(["a", "b"], 0, 0, "k");
			expect(range).toEqual({
				startLine: 0, startCol: 0,
				endLine: 1, endCol: 0,
				linewise: true,
			});
		});
	});

	it("returns null for unknown motion", () => {
		const range = computeOperatorRange(["hello"], 0, 0, "z");
		expect(range).toBe(null);
	});
});

// ─── extractRange ───────────────────────────────────────────────────

describe("extractRange", () => {
	it("extracts single-line charwise range", () => {
		const text = extractRange(["hello world"], {
			startLine: 0, startCol: 0,
			endLine: 0, endCol: 5,
			linewise: false,
		});
		expect(text).toBe("hello");
	});

	it("extracts multi-line charwise range", () => {
		const text = extractRange(["abc", "def", "ghi"], {
			startLine: 0, startCol: 1,
			endLine: 2, endCol: 1,
			linewise: false,
		});
		expect(text).toBe("bc\ndef\ng");
	});

	it("extracts linewise range", () => {
		const text = extractRange(["a", "b", "c", "d"], {
			startLine: 1, startCol: 0,
			endLine: 3, endCol: 0,
			linewise: true,
		});
		expect(text).toBe("b\nc");
	});
});

// ─── applyDelete ────────────────────────────────────────────────────

describe("applyDelete", () => {
	it("deletes characters on same line", () => {
		const result = applyDelete(["hello world"], {
			startLine: 0, startCol: 0,
			endLine: 0, endCol: 6,
			linewise: false,
		});
		expect(result.newLines).toEqual(["world"]);
		expect(result.cursorLine).toBe(0);
		expect(result.cursorCol).toBe(0);
	});

	it("deletes to end of line", () => {
		const result = applyDelete(["hello world"], {
			startLine: 0, startCol: 5,
			endLine: 0, endCol: 11,
			linewise: false,
		});
		expect(result.newLines).toEqual(["hello"]);
		expect(result.cursorLine).toBe(0);
		expect(result.cursorCol).toBe(5);
	});

	it("linewise delete of single line", () => {
		const result = applyDelete(["hello", "world"], {
			startLine: 0, startCol: 0,
			endLine: 1, endCol: 0,
			linewise: true,
		});
		expect(result.newLines).toEqual(["world"]);
		expect(result.cursorLine).toBe(0);
		expect(result.cursorCol).toBe(0);
	});

	it("linewise delete of all lines leaves empty line", () => {
		const result = applyDelete(["hello"], {
			startLine: 0, startCol: 0,
			endLine: 1, endCol: 0,
			linewise: true,
		});
		expect(result.newLines).toEqual([""]);
		expect(result.cursorLine).toBe(0);
		expect(result.cursorCol).toBe(0);
	});

	it("linewise delete of multiple lines", () => {
		const result = applyDelete(["a", "b", "c", "d"], {
			startLine: 1, startCol: 0,
			endLine: 3, endCol: 0,
			linewise: true,
		});
		expect(result.newLines).toEqual(["a", "d"]);
		expect(result.cursorLine).toBe(1);
		expect(result.cursorCol).toBe(0);
	});

	it("character delete in middle of line", () => {
		const result = applyDelete(["hello world"], {
			startLine: 0, startCol: 2,
			endLine: 0, endCol: 8,
			linewise: false,
		});
		expect(result.newLines).toEqual(["herld"]);
		expect(result.cursorLine).toBe(0);
		expect(result.cursorCol).toBe(2);
	});

	it("does not mutate original array", () => {
		const lines = ["hello", "world"];
		const range = computeOperatorRange(lines, 0, 0, "d")!;
		applyDelete(lines, range);
		expect(lines).toEqual(["hello", "world"]);
	});

	it("multi-line character delete merges lines", () => {
		const result = applyDelete(["abc", "def", "ghi"], {
			startLine: 0, startCol: 1,
			endLine: 2, endCol: 1,
			linewise: false,
		});
		expect(result.newLines).toEqual(["ahi"]);
		expect(result.cursorLine).toBe(0);
		expect(result.cursorCol).toBe(1);
	});
});

// ─── Integration: operator + motion → delete ────────────────────────

describe("integration: operator + motion → applyDelete", () => {
	it("dw: delete first word and space", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 0, "w")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["world"]);
	});

	it("de: delete to end of word (inclusive)", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 0, "e")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual([" world"]);
	});

	it("d$: delete to end of line", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 5, "$")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["hello"]);
	});

	it("d0: delete to start of line", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 6, "0")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["world"]);
	});

	it("d^: delete to first non-whitespace", () => {
		const lines = ["   hello world"];
		const range = computeOperatorRange(lines, 0, 8, "^")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["    world"]);
	});

	it("dd: delete entire line", () => {
		const lines = ["first", "second", "third"];
		const range = computeOperatorRange(lines, 1, 0, "d")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["first", "third"]);
	});

	it("2dd: delete two lines", () => {
		const lines = ["a", "b", "c", "d"];
		const range = computeOperatorRange(lines, 0, 0, "d", 2)!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["c", "d"]);
	});

	it("d2w: delete next 2 words", () => {
		const lines = ["one two three four"];
		const range = computeOperatorRange(lines, 0, 0, "w", 2)!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["three four"]);
	});

	it("dw on last word of line deletes to end", () => {
		const lines = ["foo bar"];
		const range = computeOperatorRange(lines, 0, 4, "w")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["foo "]);
	});

	it("dw with punctuation", () => {
		const lines = ["foo.bar baz"];
		const range = computeOperatorRange(lines, 0, 0, "w")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual([".bar baz"]);
	});

	it("de with punctuation boundary", () => {
		const lines = ["foo.bar"];
		const range = computeOperatorRange(lines, 0, 0, "e")!;
		const result = applyDelete(lines, range);
		// "e" from col 0 goes to col 2 (end of "foo"), inclusive → delete cols 0-2
		expect(result.newLines).toEqual([".bar"]);
	});

	it("dh: delete one char to the left", () => {
		const lines = ["hello"];
		const range = computeOperatorRange(lines, 0, 3, "h")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["helo"]);
		expect(result.cursorCol).toBe(2);
	});

	it("dl: delete one char to the right", () => {
		const lines = ["hello"];
		const range = computeOperatorRange(lines, 0, 2, "l")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["helo"]);
		expect(result.cursorCol).toBe(2);
	});

	it("d3h: delete 3 chars to the left", () => {
		const lines = ["hello"];
		const range = computeOperatorRange(lines, 0, 4, "h", 3)!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["ho"]);
		expect(result.cursorCol).toBe(1);
	});

	it("dj: delete two lines", () => {
		const lines = ["a", "b", "c", "d"];
		const range = computeOperatorRange(lines, 1, 0, "j")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["a", "d"]);
	});

	it("d2j: delete three lines", () => {
		const lines = ["a", "b", "c", "d"];
		const range = computeOperatorRange(lines, 0, 0, "j", 2)!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["d"]);
	});

	it("dk: delete two lines", () => {
		const lines = ["a", "b", "c", "d"];
		const range = computeOperatorRange(lines, 2, 0, "k")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["a", "d"]);
	});

	it("cc: change (delete) entire line", () => {
		const lines = ["first", "second", "third"];
		const range = computeOperatorRange(lines, 1, 3, "c")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["first", "third"]);
	});
});

// ─── Integration: b motion (backward word delete) ───────────────────

describe("integration: b motion → applyDelete", () => {
	it("db: delete backward one word", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 6, "b")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["world"]);
	});

	it("d2b: delete backward two words", () => {
		const lines = ["one two three"];
		const range = computeOperatorRange(lines, 0, 8, "b", 2)!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["three"]);
	});

	it("cb: change backward one word (delete, cursor at start)", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 6, "b")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["world"]);
		expect(result.cursorCol).toBe(0);
	});

	it("db with punctuation", () => {
		const lines = ["foo.bar"];
		const range = computeOperatorRange(lines, 0, 4, "b")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["foobar"]);
	});
});

describe("integration: B motion → applyDelete", () => {
	it("dB: delete backward one WORD (crosses punctuation)", () => {
		const lines = ["foo.bar baz"];
		const range = computeOperatorRange(lines, 0, 8, "B")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["baz"]);
		expect(result.cursorCol).toBe(0);
	});

	it("dB vs db with punctuation", () => {
		// db from col 8 stops at 'bar' (col 4), dB goes all the way to col 0
		const lines = ["foo.bar baz"];
		const dbRange = computeOperatorRange(lines, 0, 8, "b")!;
		const dbResult = applyDelete(lines, dbRange);
		expect(dbResult.newLines).toEqual(["foo.baz"]);

		const dBRange = computeOperatorRange(lines, 0, 8, "B")!;
		const dBResult = applyDelete(lines, dBRange);
		expect(dBResult.newLines).toEqual(["baz"]);
	});
});

// ─── Repeated motions ───────────────────────────────────────────────

describe("repeated motions (count)", () => {
	it("3w moves 3 words", () => {
		const lines = ["one two three four five"];
		let pos = { line: 0, col: 0 };
		for (let i = 0; i < 3; i++) {
			pos = findNextWordStart(lines, pos.line, pos.col);
		}
		expect(pos).toEqual({ line: 0, col: 14 }); // "four"
	});

	it("2e moves to end of 2nd word", () => {
		const lines = ["one two three"];
		let pos = { line: 0, col: 0 };
		for (let i = 0; i < 2; i++) {
			pos = findWordEnd(lines, pos.line, pos.col);
		}
		expect(pos).toEqual({ line: 0, col: 6 }); // end of "two"
	});

	it("w across multiple lines", () => {
		const lines = ["end", "of", "file"];
		let pos = { line: 0, col: 0 };
		// w from "end" → past word, crosses to "of"
		pos = findNextWordStart(lines, pos.line, pos.col);
		// "end" fills the line → crosses to next line
		expect(pos).toEqual({ line: 1, col: 0 }); // "of"
		pos = findNextWordStart(lines, pos.line, pos.col);
		expect(pos).toEqual({ line: 2, col: 0 }); // "file"
		pos = findNextWordStart(lines, pos.line, pos.col);
		expect(pos).toEqual({ line: 2, col: 4 }); // end of text
	});
});

// ─── findCharForward (f motion) ─────────────────────────────────────

describe("findCharForward", () => {
	it("finds next occurrence of char", () => {
		const result = findCharForward(["hello world"], 0, 0, "o");
		expect(result).toBe(4);
	});

	it("finds char starting after current col", () => {
		const result = findCharForward(["abcabc"], 0, 0, "b");
		expect(result).toBe(1);
	});

	it("skips char at current col", () => {
		const result = findCharForward(["abcabc"], 0, 1, "b");
		expect(result).toBe(4);
	});

	it("finds nth occurrence with count", () => {
		const result = findCharForward(["abcabcabc"], 0, 0, "a", 2);
		expect(result).toBe(6);
	});

	it("returns -1 when char not found", () => {
		const result = findCharForward(["hello"], 0, 0, "z");
		expect(result).toBe(-1);
	});

	it("returns -1 when count exceeds occurrences", () => {
		const result = findCharForward(["abcabc"], 0, 0, "a", 5);
		expect(result).toBe(-1);
	});

	it("returns -1 at end of line", () => {
		const result = findCharForward(["abc"], 0, 2, "x");
		expect(result).toBe(-1);
	});

	it("finds char on specific line", () => {
		const result = findCharForward(["abc", "def", "ghi"], 1, 0, "f");
		expect(result).toBe(2);
	});

	it("handles empty lines", () => {
		const result = findCharForward([""], 0, 0, "a");
		expect(result).toBe(-1);
	});

	it("finds space character", () => {
		const result = findCharForward(["hello world"], 0, 0, " ");
		expect(result).toBe(5);
	});
});

// ─── findCharBackward (F motion) ────────────────────────────────────

describe("findCharBackward", () => {
	it("finds previous occurrence of char", () => {
		const result = findCharBackward(["hello world"], 0, 10, "o");
		expect(result).toBe(7);
	});

	it("skips char at current col", () => {
		const result = findCharBackward(["abcabc"], 0, 4, "b");
		expect(result).toBe(1);
	});

	it("finds nth occurrence backward with count", () => {
		const result = findCharBackward(["abcabcabc"], 0, 8, "a", 2);
		expect(result).toBe(3);
	});

	it("returns -1 when char not found", () => {
		const result = findCharBackward(["hello"], 0, 4, "z");
		expect(result).toBe(-1);
	});

	it("returns -1 when count exceeds occurrences", () => {
		const result = findCharBackward(["abcabc"], 0, 5, "a", 5);
		expect(result).toBe(-1);
	});

	it("returns -1 at start of line", () => {
		const result = findCharBackward(["abc"], 0, 0, "a");
		expect(result).toBe(-1);
	});

	it("finds char on specific line", () => {
		const result = findCharBackward(["abc", "def", "ghi"], 1, 2, "d");
		expect(result).toBe(0);
	});

	it("handles empty lines", () => {
		const result = findCharBackward([""], 0, 0, "a");
		expect(result).toBe(-1);
	});
});

// ─── computeOperatorRange with f/t/F/T ──────────────────────────────

describe("computeOperatorRange: f motion", () => {
	it("df{char}: range from cursor to found char (inclusive)", () => {
		const range = computeOperatorRange(["hello world"], 0, 0, "f", 1, "o");
		expect(range).toEqual({
			startLine: 0, startCol: 0,
			endLine: 0, endCol: 5, // inclusive of 'o' at col 4
			linewise: false,
		});
	});

	it("d2f{char}: finds the 2nd occurrence", () => {
		const range = computeOperatorRange(["abcabcabc"], 0, 0, "f", 2, "a");
		expect(range).toEqual({
			startLine: 0, startCol: 0,
			endLine: 0, endCol: 7, // 2nd 'a' at col 6, inclusive
			linewise: false,
		});
	});

	it("df{char}: returns null when char not found", () => {
		const range = computeOperatorRange(["hello"], 0, 0, "f", 1, "z");
		expect(range).toBe(null);
	});

	it("df{char}: returns null without targetChar", () => {
		const range = computeOperatorRange(["hello"], 0, 0, "f");
		expect(range).toBe(null);
	});
});

describe("computeOperatorRange: t motion", () => {
	it("dt{char}: range from cursor up to (not including) found char", () => {
		const range = computeOperatorRange(["hello world"], 0, 0, "t", 1, "o");
		expect(range).toEqual({
			startLine: 0, startCol: 0,
			endLine: 0, endCol: 4, // up to but not including 'o' at col 4
			linewise: false,
		});
	});

	it("dt{char}: returns null when char is immediately next", () => {
		// 'e' is at col 1, immediately next to cursor at col 0
		const range = computeOperatorRange(["hello"], 0, 0, "t", 1, "e");
		expect(range).toBe(null);
	});

	it("dt{char}: works when there is a gap", () => {
		// cursor at 0, 'l' at col 2 — gap of 1
		const range = computeOperatorRange(["hello"], 0, 0, "t", 1, "l");
		expect(range).toEqual({
			startLine: 0, startCol: 0,
			endLine: 0, endCol: 2, // up to but not including 'l' at col 2
			linewise: false,
		});
	});

	it("dt{char}: returns null when char not found", () => {
		const range = computeOperatorRange(["hello"], 0, 0, "t", 1, "z");
		expect(range).toBe(null);
	});
});

describe("computeOperatorRange: F motion", () => {
	it("dF{char}: range from found char to cursor (exclusive of cursor)", () => {
		const range = computeOperatorRange(["hello world"], 0, 7, "F", 1, "l");
		expect(range).toEqual({
			startLine: 0, startCol: 3, // 'l' found at col 3
			endLine: 0, endCol: 7, // exclusive of cursor at col 7
			linewise: false,
		});
	});

	it("d2F{char}: finds the 2nd occurrence backward", () => {
		const range = computeOperatorRange(["abcabcabc"], 0, 8, "F", 2, "a");
		expect(range).toEqual({
			startLine: 0, startCol: 3, // 2nd 'a' backward at col 3
			endLine: 0, endCol: 8,
			linewise: false,
		});
	});

	it("dF{char}: returns null when char not found", () => {
		const range = computeOperatorRange(["hello"], 0, 4, "F", 1, "z");
		expect(range).toBe(null);
	});
});

describe("computeOperatorRange: T motion", () => {
	it("dT{char}: range from after found char to cursor (exclusive of both)", () => {
		// cursor at 7, find 'l' backward at col 3. T excludes found char → startCol = 4
		const range = computeOperatorRange(["hello world"], 0, 7, "T", 1, "l");
		expect(range).toEqual({
			startLine: 0, startCol: 4, // after 'l' at col 3
			endLine: 0, endCol: 7, // exclusive of cursor
			linewise: false,
		});
	});

	it("dT{char}: returns null when char is immediately before cursor", () => {
		// cursor at 2, 'e' at col 1 → T target = col 2 = cursor, no movement
		const range = computeOperatorRange(["hello"], 0, 2, "T", 1, "e");
		expect(range).toBe(null);
	});

	it("dT{char}: works when there is a gap", () => {
		// cursor at 4, 'e' at col 1. T target = col 2, range [2, 4)
		const range = computeOperatorRange(["hello"], 0, 4, "T", 1, "e");
		expect(range).toEqual({
			startLine: 0, startCol: 2,
			endLine: 0, endCol: 4,
			linewise: false,
		});
	});

	it("dT{char}: returns null when char not found", () => {
		const range = computeOperatorRange(["hello"], 0, 4, "T", 1, "z");
		expect(range).toBe(null);
	});
});

// ─── Integration: f/t/F/T operator + motion → delete ────────────────

describe("integration: f/t/F/T → applyDelete", () => {
	it("dfo: delete from cursor through next 'o' (inclusive)", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 0, "f", 1, "o")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual([" world"]);
		expect(result.cursorCol).toBe(0);
	});

	it("dto: delete from cursor up to (not including) 'o'", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 0, "t", 1, "o")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["o world"]);
		expect(result.cursorCol).toBe(0);
	});

	it("dFl: delete backward from 'l' to cursor (exclusive of cursor char)", () => {
		// cursor at col 7 ('o'), F finds 'l' at col 3
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 7, "F", 1, "l")!;
		const result = applyDelete(lines, range);
		// deletes cols 3-6 ("lo w"), keeps col 0-2 ("hel") and col 7+ ("orld")
		expect(result.newLines).toEqual(["helorld"]);
		expect(result.cursorCol).toBe(3);
	});

	it("dTl: delete backward from after 'l' to cursor (exclusive of both)", () => {
		// cursor at col 7, T finds 'l' at col 3, start at col 4
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 7, "T", 1, "l")!;
		const result = applyDelete(lines, range);
		// deletes cols 4-6 ("o w"), keeps "hell" and "orld"
		expect(result.newLines).toEqual(["hellorld"]);
		expect(result.cursorCol).toBe(4);
	});

	it("d2fo: delete through 2nd 'o'", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 0, "f", 2, "o")!;
		const result = applyDelete(lines, range);
		// 2nd 'o' is at col 7, delete [0, 8)
		expect(result.newLines).toEqual(["rld"]);
		expect(result.cursorCol).toBe(0);
	});

	it("dfa: does nothing when char not found", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 0, "f", 1, "z");
		expect(range).toBe(null);
	});

	it("cf{char}: change through found char (delete + enter insert)", () => {
		const lines = ["hello world"];
		const range = computeOperatorRange(lines, 0, 0, "f", 1, " ")!;
		const result = applyDelete(lines, range);
		expect(result.newLines).toEqual(["world"]);
		expect(result.cursorCol).toBe(0);
	});
});
