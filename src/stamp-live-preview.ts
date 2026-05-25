import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	WidgetType,
	type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect } from "@codemirror/state";
import { editorLivePreviewField } from "obsidian";

export const refreshStampsEffect = StateEffect.define<null>();
import {
	findStampsInLine,
	formatStampDisplay,
} from "./stamp-markers";
import type NowStampPlugin from "./main";

class StampDisplayWidget extends WidgetType {
	constructor(
		private text: string,
		private muted: boolean,
	) {
		super();
	}

	eq(other: StampDisplayWidget): boolean {
		return other.text === this.text && other.muted === this.muted;
	}

	toDOM(): HTMLElement {
		const el = document.createElement("span");
		el.className = this.muted
			? "now-stamp now-stamp--muted"
			: "now-stamp";
		el.textContent = this.text;
		return el;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

function buildDecorations(
	view: EditorView,
	plugin: NowStampPlugin,
): DecorationSet {
	if (!plugin.settings.relativeDates) {
		return Decoration.none;
	}

	const isLivePreview = view.state.field(editorLivePreviewField);
	if (!isLivePreview) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();
	const viewDate = new Date();

	for (const { from, to } of view.visibleRanges) {
		const startLine = view.state.doc.lineAt(from).number;
		const endLine = view.state.doc.lineAt(to).number;

		for (let lineNo = startLine; lineNo <= endLine; lineNo++) {
			const line = view.state.doc.line(lineNo);
			const stamps = findStampsInLine(line.text);
			for (const stamp of stamps) {
				const lineFrom = line.from + stamp.from;
				const lineTo = line.from + stamp.to;
				const display = formatStampDisplay(
					stamp.ms,
					plugin.settings,
					stamp.labelOnly,
					viewDate,
				);
				builder.add(
					lineFrom,
					lineTo,
					Decoration.replace({
						widget: new StampDisplayWidget(
							display,
							plugin.settings.styleTimestamps,
						),
					}),
				);
			}
		}
	}

	return builder.finish();
}

export function stampLivePreviewExtension(plugin: NowStampPlugin) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, plugin);
			}

			update(update: ViewUpdate): void {
				if (!update.state.field(editorLivePreviewField)) {
					this.decorations = Decoration.none;
					return;
				}
				this.decorations = buildDecorations(update.view, plugin);
			}
		},
		{ decorations: (v) => v.decorations },
	);
}
