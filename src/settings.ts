import { App, PluginSettingTab, Setting } from "obsidian";
import type DynamicStampPlugin from "./main";

export interface DynamicStampSettings {
	timeFormat: "12h" | "24h";
	includeDayLabel: boolean;
	triggerPhrase: string;
	styleTimestamps: boolean;
	todayTriggerIncludesTime: boolean;
	/** When on, day labels update when you read the note (Today → Yesterday → weekday → date). */
	relativeDates: boolean;
}

export const DEFAULT_SETTINGS: DynamicStampSettings = {
	timeFormat: "12h",
	includeDayLabel: true,
	triggerPhrase: "@now",
	styleTimestamps: true,
	todayTriggerIncludesTime: false,
	relativeDates: true,
};

const RESERVED_TRIGGER_PHRASES = new Set(["@today", "@yesterday"]);

export function normalizeTriggerPhrase(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed.startsWith("@")) return null;
	if (RESERVED_TRIGGER_PHRASES.has(trimmed.toLowerCase())) return null;
	return trimmed;
}

export class DynamicStampSettingTab extends PluginSettingTab {
	plugin: DynamicStampPlugin;

	constructor(app: App, plugin: DynamicStampPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Time format")
			.setDesc("12-hour (11:50 AM) or 24-hour (11:50).")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("12h", "12-hour")
					.addOption("24h", "24-hour")
					.setValue(this.plugin.settings.timeFormat)
					.onChange(async (value: "12h" | "24h") => {
						this.plugin.settings.timeFormat = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Include day label")
			.setDesc('When using the main trigger, prefix with "Today" (e.g. Today 11:50 AM).')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeDayLabel)
					.onChange(async (value) => {
						this.plugin.settings.includeDayLabel = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Main trigger phrase")
			.setDesc(
				'Phrase that inserts a full timestamp (default @now). Must start with @. @yesterday and @today are reserved.',
			)
			.addText((text) =>
				text
					.setPlaceholder("@now")
					.setValue(this.plugin.settings.triggerPhrase)
					.onChange(async (value) => {
						const triggerPhrase = normalizeTriggerPhrase(value);
						if (!triggerPhrase) return;
						this.plugin.settings.triggerPhrase = triggerPhrase;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Relative day labels")
			.setDesc(
				'Stamps remember when you wrote them. "Today 12:19" becomes "Yesterday 12:19" when you read the note on a later day.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.relativeDates)
					.onChange(async (value) => {
						this.plugin.settings.relativeDates = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Add time to @today")
			.setDesc('When on, @today inserts a timestamp like "Today 11:50 AM". @yesterday stays label-only.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.todayTriggerIncludesTime)
					.onChange(async (value) => {
						this.plugin.settings.todayTriggerIncludesTime = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Gray timestamp styling")
			.setDesc("Wrap inserted timestamps in a muted span (best in Live Preview).")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.styleTimestamps)
					.onChange(async (value) => {
						this.plugin.settings.styleTimestamps = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
