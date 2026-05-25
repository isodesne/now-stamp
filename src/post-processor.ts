import { MarkdownRenderChild } from "obsidian";
import { processStampsInRoot } from "./stamp-refresh";
import type DynamicStampPlugin from "./main";

class StampRenderChild extends MarkdownRenderChild {
	constructor(
		containerEl: HTMLElement,
		private plugin: DynamicStampPlugin,
	) {
		super(containerEl);
	}

	onload(): void {
		window.setTimeout(() => {
			processStampsInRoot(this.containerEl, this.plugin);
		}, 0);
	}
}

export function registerStampPostProcessor(plugin: DynamicStampPlugin): void {
	plugin.registerMarkdownPostProcessor((el, ctx) => {
		processStampsInRoot(el, plugin);
		ctx.addChild(new StampRenderChild(el, plugin));
	});
}
