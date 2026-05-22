import { MarkdownView, type App } from "obsidian";
import { isLabelOnlyStamp, readStampMs } from "./stamp-element";
import { formatDynamicLabelOnly, formatDynamicStamp } from "./relative";
import type NowStampPlugin from "./main";

export function processStampsInRoot(
	root: ParentNode,
	plugin: NowStampPlugin,
): void {
	if (!plugin.settings.relativeDates) return;

	const viewDate = new Date();
	const stamps = root.querySelectorAll<HTMLElement>(
		"span.now-stamp, time.now-stamp",
	);

	stamps.forEach((stampEl) => {
		const ms = readStampMs(stampEl);
		if (ms === null) return;

		const stamp = new Date(ms);
		const labelOnly = isLabelOnlyStamp(stampEl);
		const display = labelOnly
			? formatDynamicLabelOnly(stamp, viewDate)
			: formatDynamicStamp(stamp, plugin.settings, viewDate);

		stampEl.textContent = display;
	});
}

export function refreshAllReadingStamps(
	app: App,
	plugin: NowStampPlugin,
): void {
	app.workspace.iterateAllLeaves((leaf) => {
		const { view } = leaf;
		if (!(view instanceof MarkdownView)) return;
		if (view.getMode() !== "preview") return;
		processStampsInRoot(view.containerEl, plugin);
	});
}
