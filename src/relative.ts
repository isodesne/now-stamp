import { formatTime } from "./format";
import { stampClassList } from "./stamp-element";
import type { NowStampSettings } from "./settings";

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

const MS_PER_DAY = 86_400_000;

export function startOfLocalDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Calendar days from stamp day to view day (0 = same day, 1 = view is next day). */
export function dayOffset(stamp: Date, view: Date = new Date()): number {
	const stampDay = startOfLocalDay(stamp).getTime();
	const viewDay = startOfLocalDay(view).getTime();
	return Math.round((viewDay - stampDay) / MS_PER_DAY);
}

export function formatRelativeDayLabel(stamp: Date, view: Date = new Date()): string {
	const offset = dayOffset(stamp, view);

	if (offset < 0) {
		return stamp.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: stamp.getFullYear() !== view.getFullYear() ? "numeric" : undefined,
		});
	}
	if (offset === 0) return "Today";
	if (offset === 1) return "Yesterday";
	if (offset >= 2 && offset <= 6) {
		return stamp.toLocaleDateString(undefined, { weekday: "long" });
	}

	const viewYear = view.getFullYear();
	const stampYear = stamp.getFullYear();
	return stamp.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		...(stampYear !== viewYear ? { year: "numeric" } : {}),
	});
}

export function anchorForLabelOnly(label: "Today" | "Yesterday", at: Date = new Date()): Date {
	const day = new Date(at);
	if (label === "Yesterday") {
		day.setDate(day.getDate() - 1);
	}
	return day;
}

export function formatDynamicStamp(
	stamp: Date,
	settings: NowStampSettings,
	view: Date = new Date(),
): string {
	const time = formatTime(stamp, settings.timeFormat);
	if (!settings.includeDayLabel) {
		return time;
	}
	return `${formatRelativeDayLabel(stamp, view)} ${time}`;
}

export function formatDynamicLabelOnly(
	stamp: Date,
	view: Date = new Date(),
): string {
	return `${formatRelativeDayLabel(stamp, view)} `;
}

export function buildDynamicSpan(
	displayText: string,
	stamp: Date,
	settings: NowStampSettings,
	labelOnly = false,
): string {
	const ts = stamp.getTime();
	const classAttr = stampClassList(ts, settings, labelOnly);
	const iso = stamp.toISOString();
	if (labelOnly) {
		return `<span class="${classAttr}">${escapeHtml(displayText)}</span>`;
	}
	// Class ts-* survives Obsidian HTML sanitization; datetime/title are useful for full timestamps.
	return `<span class="${classAttr}" datetime="${iso}" title="${ts}">${escapeHtml(displayText)}</span>`;
}
