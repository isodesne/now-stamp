import { MarkdownView, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NowStampSettingTab,
	normalizeTriggerPhrase,
	type NowStampSettings,
} from "./settings";
import { registerStampPostProcessor } from "./post-processor";
import {
	processStampsInRoot,
	refreshAllLivePreviewStamps,
	refreshAllReadingStamps,
} from "./stamp-refresh";
import { stampLivePreviewExtension } from "./stamp-live-preview";
import { StampSuggest } from "./stamp-suggest";

export default class NowStampPlugin extends Plugin {
	settings: NowStampSettings = DEFAULT_SETTINGS;
	private midnightTimerId: number | null = null;
	private viewObservers: WeakMap<MarkdownView, MutationObserver> =
		new WeakMap();
	private trackedViews: Set<MarkdownView> = new Set();

	async onload(): Promise<void> {
		await this.loadSettings();
		this.registerEditorSuggest(new StampSuggest(this));
		this.registerEditorExtension(stampLivePreviewExtension(this));
		this.app.workspace.updateOptions();
		registerStampPostProcessor(this);
		this.addSettingTab(new NowStampSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.refreshStampLabels();
				this.rewireViewObservers();
			}),
		);

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.rewireViewObservers();
			}),
		);

		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.refreshStampLabels();
			}),
		);

		this.registerDomEvent(document, "visibilitychange", () => {
			if (document.visibilityState === "visible") {
				this.refreshStampLabels();
			}
		});

		this.app.workspace.onLayoutReady(() => {
			this.refreshStampLabels();
			this.rewireViewObservers();
			this.scheduleMidnightRefresh();
		});

		// Ensure observers are torn down on plugin disable.
		this.register(() => this.disconnectAllObservers());
	}

	onunload(): void {
		if (this.midnightTimerId !== null) {
			window.clearTimeout(this.midnightTimerId);
			this.midnightTimerId = null;
		}
		this.disconnectAllObservers();
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<NowStampSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
		this.settings.triggerPhrase =
			normalizeTriggerPhrase(this.settings.triggerPhrase) ??
			DEFAULT_SETTINGS.triggerPhrase;
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshStampViews();
	}

	refreshStampViews(): void {
		this.refreshStampLabels();
		this.app.workspace.iterateAllLeaves((leaf) => {
			const { view } = leaf;
			if (view instanceof MarkdownView) {
				view.editor.refresh();
			}
		});
	}

	refreshStampLabels(): void {
		refreshAllReadingStamps(this.app, this);
		refreshAllLivePreviewStamps(this.app, this);
	}

	private scheduleMidnightRefresh(): void {
		const now = new Date();
		const next = new Date(now);
		next.setHours(24, 0, 5, 0);
		const delay = Math.max(1000, next.getTime() - now.getTime());
		this.midnightTimerId = window.setTimeout(() => {
			this.midnightTimerId = null;
			this.refreshStampLabels();
			this.scheduleMidnightRefresh();
		}, delay);
	}

	/**
	 * Attach a MutationObserver to each MarkdownView's container so we re-render
	 * stamp labels as soon as Obsidian mounts a `.now-stamp` element (covers
	 * lazy widget render, scroll virtualization, cursor-near re-render, etc.).
	 */
	private rewireViewObservers(): void {
		const seen = new Set<MarkdownView>();
		this.app.workspace.iterateAllLeaves((leaf) => {
			const { view } = leaf;
			if (!(view instanceof MarkdownView)) return;
			seen.add(view);
			if (this.viewObservers.has(view)) return;
			this.attachObserver(view);
			this.trackedViews.add(view);
		});

		// Drop observers for views that no longer exist in workspace.
		for (const view of Array.from(this.trackedViews)) {
			if (seen.has(view)) continue;
			const obs = this.viewObservers.get(view);
			if (obs) obs.disconnect();
			this.viewObservers.delete(view);
			this.trackedViews.delete(view);
		}
	}

	private attachObserver(view: MarkdownView): void {
		let scheduled = false;
		const observer = new MutationObserver((mutations) => {
			let touched = false;
			for (const m of mutations) {
				if (touched) break;
				for (const node of Array.from(m.addedNodes)) {
					if (!(node instanceof HTMLElement)) continue;
					if (
						node.matches?.(".now-stamp") ||
						node.querySelector?.(".now-stamp")
					) {
						touched = true;
						break;
					}
				}
			}
			if (!touched || scheduled) return;
			scheduled = true;
			requestAnimationFrame(() => {
				scheduled = false;
				processStampsInRoot(view.containerEl, this);
			});
		});
		observer.observe(view.containerEl, {
			childList: true,
			subtree: true,
		});
		this.viewObservers.set(view, observer);
	}

	private disconnectAllObservers(): void {
		for (const view of Array.from(this.trackedViews)) {
			const obs = this.viewObservers.get(view);
			if (obs) obs.disconnect();
			this.viewObservers.delete(view);
		}
		this.trackedViews.clear();
	}
}
