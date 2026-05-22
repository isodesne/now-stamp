import {
	anchorForLabelOnly,
	buildDynamicSpan,
	formatDynamicLabelOnly,
	formatDynamicStamp,
} from "./relative";
import type { NowStampSettings } from "./settings";

export type TimeFormat = NowStampSettings["timeFormat"];
export type LabelOnly = "Today" | "Yesterday";

export function formatTime(date: Date, timeFormat: TimeFormat): string {
	const minutes = date.getMinutes().toString().padStart(2, "0");

	if (timeFormat === "24h") {
		const hours = date.getHours().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	}

	let hours = date.getHours();
	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12;
	if (hours === 0) hours = 12;
	return `${hours}:${minutes} ${ampm}`;
}

/** Static stamp (legacy / relative dates off). */
export function formatStamp(date: Date, settings: NowStampSettings): string {
	const time = formatTime(date, settings.timeFormat);
	if (settings.includeDayLabel) {
		return `Today ${time}`;
	}
	return time;
}

export function formatLabelOnly(label: LabelOnly): string {
	return `${label} `;
}

export function wrapStamp(text: string, settings: NowStampSettings): string {
	if (!settings.styleTimestamps) {
		return text;
	}
	return `<span class="now-stamp now-stamp--muted">${text}</span>`;
}

export function buildFullStampInsert(date: Date, settings: NowStampSettings): string {
	if (settings.relativeDates) {
		const text = formatDynamicStamp(date, settings);
		return buildDynamicSpan(text, date, settings);
	}
	const text = formatStamp(date, settings);
	return wrapStamp(text, settings);
}

export function buildLabelOnlyInsert(
	label: LabelOnly,
	settings: NowStampSettings,
	at: Date = new Date(),
): string {
	if (label === "Today" && settings.todayTriggerIncludesTime) {
		if (settings.relativeDates) {
			const timeSettings = { ...settings, includeDayLabel: true };
			return `${buildDynamicSpan(formatDynamicStamp(at, timeSettings), at, settings)} `;
		}
		const timeSettings = { ...settings, includeDayLabel: true };
		return `${wrapStamp(formatStamp(at, timeSettings), settings)} `;
	}

	if (settings.relativeDates) {
		const anchor = anchorForLabelOnly(label, at);
		const text = formatDynamicLabelOnly(anchor, at);
		return buildDynamicSpan(text, anchor, settings, true);
	}
	return wrapStamp(formatLabelOnly(label), settings);
}

export function stripHtml(text: string): string {
	return text.replace(/<[^>]+>/g, "");
}

export function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
