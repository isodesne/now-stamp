import {
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import {
	buildFullStampInsert,
	buildLabelOnlyInsert,
	escapeRegex,
	stripHtml,
	type LabelOnly,
} from "./format";
import type NowStampPlugin from "./main";

export type TriggerKind = "full" | "label";

export interface StampSuggestion {
	kind: TriggerKind;
	label?: LabelOnly;
}

const FIXED_TRIGGERS: { phrase: string; kind: TriggerKind; label: LabelOnly }[] = [
	{ phrase: "@yesterday", kind: "label", label: "Yesterday" },
	{ phrase: "@today", kind: "label", label: "Today" },
];

function matchEndOfLine(line: string, phrase: string): RegExpMatchArray | null {
	const pattern = new RegExp(`${escapeRegex(phrase)}$`, "i");
	return line.match(pattern);
}

export class StampSuggest extends EditorSuggest<StampSuggestion> {
	plugin: NowStampPlugin;

	constructor(plugin: NowStampPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);

		for (const fixed of FIXED_TRIGGERS) {
			const match = matchEndOfLine(line, fixed.phrase);
			if (match) {
				return {
					start: { line: cursor.line, ch: cursor.ch - match[0].length },
					end: cursor,
					query: match[0],
				};
			}
		}

		const triggerPhrase = this.plugin.settings.triggerPhrase;
		if (!triggerPhrase) return null;

		const match = matchEndOfLine(line, triggerPhrase);
		if (!match) return null;

		return {
			start: { line: cursor.line, ch: cursor.ch - match[0].length },
			end: cursor,
			query: match[0],
		};
	}

	getSuggestions(context: EditorSuggestContext): StampSuggestion[] {
		const query = context.query.toLowerCase();

		for (const fixed of FIXED_TRIGGERS) {
			if (query === fixed.phrase.toLowerCase()) {
				return [{ kind: "label", label: fixed.label }];
			}
		}

		if (query === this.plugin.settings.triggerPhrase.toLowerCase()) {
			return [{ kind: "full" }];
		}

		return [];
	}

	private buildInsert(suggestion: StampSuggestion): string {
		const { settings } = this.plugin;
		const now = new Date();

		if (suggestion.kind === "label" && suggestion.label) {
			return buildLabelOnlyInsert(suggestion.label, settings, now);
		}

		return buildFullStampInsert(now, settings) + " ";
	}

	getDisplayText(suggestion: StampSuggestion): string {
		return stripHtml(this.buildInsert(suggestion));
	}

	renderSuggestion(suggestion: StampSuggestion, el: HTMLElement): void {
		el.setText(this.getDisplayText(suggestion));
	}

	selectSuggestion(suggestion: StampSuggestion, _evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;

		const editor = this.context.editor;
		const insert = this.buildInsert(suggestion);
		editor.replaceRange(insert, this.context.start, this.context.end);
	}
}
