const TS_CLASS_PREFIX = "ts-";
const DAY_CLASS_PREFIX = "day-x";
const LEGACY_DAY_CLASS_PREFIX = "day-";

/** Read stored moment from class (primary), datetime, or data-ts (legacy). */
export function readStampMs(el: HTMLElement): number | null {
	for (const name of Array.from(el.classList)) {
		if (name.startsWith(DAY_CLASS_PREFIX)) {
			const ms = Number.parseInt(name.slice(DAY_CLASS_PREFIX.length), 36);
			if (Number.isFinite(ms)) return ms;
		}

		if (name.startsWith(TS_CLASS_PREFIX) || name.startsWith(LEGACY_DAY_CLASS_PREFIX)) {
			const prefix = name.startsWith(TS_CLASS_PREFIX)
				? TS_CLASS_PREFIX
				: LEGACY_DAY_CLASS_PREFIX;
			const ms = Number(name.slice(prefix.length));
			if (Number.isFinite(ms)) return ms;
		}
	}

	const datetime = el.getAttribute("datetime");
	if (datetime) {
		const ms = Date.parse(datetime);
		if (Number.isFinite(ms)) return ms;
	}

	const dataTs = el.getAttribute("data-ts");
	if (dataTs) {
		const ms = Number(dataTs.trim());
		if (Number.isFinite(ms)) return ms;
	}

	return null;
}

export function isLabelOnlyStamp(el: HTMLElement): boolean {
	return (
		el.classList.contains("now-stamp--label-only") ||
		el.hasAttribute("data-label-only")
	);
}

export function stampClassList(
	ts: number,
	settings: { styleTimestamps: boolean },
	labelOnly: boolean,
): string {
	const classes = [
		"now-stamp",
		labelOnly
			? `${DAY_CLASS_PREFIX}${ts.toString(36)}`
			: `${TS_CLASS_PREFIX}${ts}`,
	];
	if (settings.styleTimestamps) {
		classes.push("now-stamp--muted");
	}
	if (labelOnly) {
		classes.push("now-stamp--label-only");
	}
	return classes.join(" ");
}
