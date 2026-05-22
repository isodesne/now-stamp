import { MarkdownView, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NowStampSettingTab,
	normalizeTriggerPhrase,
	type NowStampSettings,
} from "./settings";
import { registerStampPostProcessor } from "./post-processor";
import { refreshAllReadingStamps } from "./stamp-refresh";
import { stampLivePreviewExtension } from "./stamp-live-preview";
import { StampSuggest } from "./stamp-suggest";

export default class NowStampPlugin extends Plugin {
	settings: NowStampSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.registerEditorSuggest(new StampSuggest(this));
		this.registerEditorExtension(stampLivePreviewExtension(this));
		registerStampPostProcessor(this);
		this.addSettingTab(new NowStampSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				refreshAllReadingStamps(this.app, this);
			}),
		);

		this.app.workspace.onLayoutReady(() => {
			refreshAllReadingStamps(this.app, this);
		});
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
		refreshAllReadingStamps(this.app, this);
		this.app.workspace.iterateAllLeaves((leaf) => {
			const { view } = leaf;
			if (view instanceof MarkdownView) {
				view.editor.refresh();
			}
		});
	}
}
