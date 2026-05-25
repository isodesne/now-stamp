import { MarkdownView, type App } from "obsidian";
import type { EditorView } from "@codemirror/view";
import { isLabelOnlyStamp, readStampMs } from "./stamp-element";
import { formatDynamicLabelOnly, formatDynamicStamp } from "./relative";
import { refreshStampsEffect } from "./stamp-live-preview";
import type DynamicStampPlugin from "./main";

export function processStampsInRoot(
	root: ParentNode,
	plugin: DynamicStampPlugin,
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
	plugin: DynamicStampPlugin,
): void {
	app.workspace.iterateAllLeaves((leaf) => {
		const { view } = leaf;
		if (!(view instanceof MarkdownView)) return;
		if (view.getMode() !== "preview") return;
		processStampsInRoot(view.containerEl, plugin);
	});
}

export function refreshAllLivePreviewStamps(
	app: App,
	plugin: DynamicStampPlugin,
): void {
	app.workspace.iterateAllLeaves((leaf) => {
		const { view } = leaf;
		if (!(view instanceof MarkdownView)) return;
		if (view.getMode() !== "source") return;

		// 1) Direct DOM mutation for HTML-widget-rendered stamps in Live Preview.
		//    Obsidian's inline HTML widget caches its post-processor output; our
		//    CM ViewPlugin replace-decoration may not be the visible layer.
		//    Mutating textContent works regardless. Use containerEl so we cover
		//    any duplicated copies CM6 keeps in measurement/mirror DOM.
		processStampsInRoot(view.containerEl, plugin);

		// 2) Also poke our ViewPlugin so its widget (where it does render)
		//    rebuilds. Obsidian's public `Editor` interface does not expose the
		//    underlying CodeMirror 6 `EditorView`, but it is reachable at runtime
		//    via `editor.cm`. Dispatching a no-op transaction with
		//    `refreshStampsEffect` forces the ViewPlugin's `update()` to re-run
		//    and rebuild decorations against the current date.
		const cm = (view.editor as unknown as { cm?: EditorView }).cm;
		if (cm) {
			cm.dispatch({ effects: refreshStampsEffect.of(null) });
		}
	});
}
