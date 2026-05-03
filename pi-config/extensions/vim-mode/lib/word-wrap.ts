/**
 * Re-export wordWrapLine from pi-tui's internal editor module.
 *
 * pi-tui exports wordWrapLine from editor.ts but does not re-export it from
 * the package index, and subpath imports are blocked (no "exports" map in
 * package.json).  We try to require it at runtime via path manipulation; if
 * that fails (e.g. module resolution differs in the nix runtime) we fall back
 * to a local copy of the upstream algorithm.
 *
 * If pi-tui ever adds wordWrapLine to its public exports, replace this file
 * with a direct re-export.
 *
 * Upstream: https://github.com/badlogic/pi-mono/blob/main/packages/tui/src/components/editor.ts
 */

import { visibleWidth } from "@mariozechner/pi-tui";

export interface TextChunk {
	text: string;
	startIndex: number;
	endIndex: number;
}

// ---------------------------------------------------------------------------
// Try the real thing first
// ---------------------------------------------------------------------------
type WordWrapFn = (line: string, maxWidth: number, preSegmented?: Intl.SegmentData[]) => TextChunk[];

let _wordWrapLine: WordWrapFn | undefined;
try {
	// resolve the package entry, then swap index.js → components/editor.js
	const resolved = require.resolve("@mariozechner/pi-tui");
	const editorPath = resolved.replace(/index\.js$/, "components/editor.js");
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const mod = require(editorPath);
	if (typeof mod.wordWrapLine === "function") {
		_wordWrapLine = mod.wordWrapLine as WordWrapFn;
	}
} catch {
	// fall through to local implementation
}

// ---------------------------------------------------------------------------
// Local fallback (faithful copy of upstream)
// ---------------------------------------------------------------------------
if (!_wordWrapLine) {
	const PASTE_MARKER_SINGLE = /^\[paste #(\d+)( (\+\d+ lines|\d+ chars))?\]$/;
	const isPasteMarker = (s: string) => s.length >= 10 && PASTE_MARKER_SINGLE.test(s);
	const isWs = (c: string) => c.length === 1 && (c === " " || c === "\t" || c === "\n" || c === "\r");
	const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });

	const localWrap: WordWrapFn = (line, maxWidth, preSegmented?) => {
		if (!line || maxWidth <= 0) return [{ text: "", startIndex: 0, endIndex: 0 }];
		if (visibleWidth(line) <= maxWidth) return [{ text: line, startIndex: 0, endIndex: line.length }];

		const chunks: TextChunk[] = [];
		const segments = preSegmented ?? [...seg.segment(line)];
		let currentWidth = 0, chunkStart = 0, wrapOppIndex = -1, wrapOppWidth = 0;

		for (let i = 0; i < segments.length; i++) {
			const s = segments[i]!;
			const grapheme = s.segment, gWidth = visibleWidth(grapheme), charIndex = s.index;
			const whitespace = !isPasteMarker(grapheme) && isWs(grapheme);

			if (currentWidth + gWidth > maxWidth) {
				if (wrapOppIndex >= 0 && currentWidth - wrapOppWidth + gWidth <= maxWidth) {
					chunks.push({ text: line.slice(chunkStart, wrapOppIndex), startIndex: chunkStart, endIndex: wrapOppIndex });
					chunkStart = wrapOppIndex; currentWidth -= wrapOppWidth;
				} else if (chunkStart < charIndex) {
					chunks.push({ text: line.slice(chunkStart, charIndex), startIndex: chunkStart, endIndex: charIndex });
					chunkStart = charIndex; currentWidth = 0;
				}
				wrapOppIndex = -1;
			}

			if (gWidth > maxWidth) {
				const subChunks = localWrap(grapheme, maxWidth);
				for (let j = 0; j < subChunks.length - 1; j++) {
					const sc = subChunks[j]!;
					chunks.push({ text: sc.text, startIndex: charIndex + sc.startIndex, endIndex: charIndex + sc.endIndex });
				}
				const last = subChunks[subChunks.length - 1]!;
				chunkStart = charIndex + last.startIndex;
				currentWidth = visibleWidth(last.text);
				wrapOppIndex = -1;
				continue;
			}

			currentWidth += gWidth;
			const next = segments[i + 1];
			if (whitespace && next && (isPasteMarker(next.segment) || !isWs(next.segment))) {
				wrapOppIndex = next.index; wrapOppWidth = currentWidth;
			}
		}

		chunks.push({ text: line.slice(chunkStart), startIndex: chunkStart, endIndex: line.length });
		return chunks;
	};

	_wordWrapLine = localWrap;
}

export const wordWrapLine: WordWrapFn = _wordWrapLine;
