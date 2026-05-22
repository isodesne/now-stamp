import { formatDynamicLabelOnly, formatDynamicStamp } from "./relative";
import type { NowStampSettings } from "./settings";

export interface StampMatch {
	from: number;
	to: number;
	ms: number;
	labelOnly: boolean;
}

const STAMP_TAG_RE =
	/<(?:time|span)([^>]*)\bnow-stamp\b([^>]*)>([^<]*)<\/(?:time|span)>/gi;

export function parseMsFromStampAttrs(attrs: string): number | null {
	const dayClass = attrs.match(/\bday-x([0-9a-z]+)\b/i);
	if (dayClass?.[1]) {
		const ms = Number.parseInt(dayClass[1], 36);
		if (Number.isFinite(ms)) return ms;
	}

	const timestampClass = attrs.match(/\b(?:ts|day)-(\d+)\b/);
	if (timestampClass) {
		const ms = Number(timestampClass[1]);
		if (Number.isFinite(ms)) return ms;
	}

	const dataTs = attrs.match(/\bdata-ts="(\d+)"/);
	if (dataTs) {
		const ms = Number(dataTs[1]);
		if (Number.isFinite(ms)) return ms;
	}

	const datetime = attrs.match(/\bdatetime="([^"]+)"/);
	if (datetime?.[1]) {
		const ms = Date.parse(datetime[1]);
		if (Number.isFinite(ms)) return ms;
	}

	const title = attrs.match(/\btitle="(\d+)"/);
	if (title) {
		const ms = Number(title[1]);
		if (Number.isFinite(ms)) return ms;
	}

	return null;
}

export function findStampsInLine(lineText: string): StampMatch[] {
	const matches: StampMatch[] = [];
	STAMP_TAG_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = STAMP_TAG_RE.exec(lineText)) !== null) {
		const attrs = `${m[1]}${m[2]}`;
		const ms = parseMsFromStampAttrs(attrs);
		if (ms === null) continue;
		const labelOnly =
			/\bnow-stamp--label-only\b/.test(attrs) ||
			/\bdata-label-only\b/.test(attrs);
		matches.push({
			from: m.index,
			to: m.index + m[0].length,
			ms,
			labelOnly,
		});
	}
	return matches;
}

export function formatStampDisplay(
	ms: number,
	settings: NowStampSettings,
	labelOnly: boolean,
	view: Date = new Date(),
): string {
	const stamp = new Date(ms);
	if (labelOnly) {
		return formatDynamicLabelOnly(stamp, view);
	}
	return formatDynamicStamp(stamp, settings, view);
}
