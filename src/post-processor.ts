import { MarkdownRenderChild } from "obsidian";
import { processStampsInRoot } from "./stamp-refresh";
import type NowStampPlugin from "./main";

class StampRenderChild extends MarkdownRenderChild {
	constructor(
		containerEl: HTMLElement,
		private plugin: NowStampPlugin,
	) {
		super(containerEl);
	}

	onload(): void {
		window.setTimeout(() => {
			processStampsInRoot(this.containerEl, this.plugin);
		}, 0);
	}
}

export function registerStampPostProcessor(plugin: NowStampPlugin): void {
	plugin.registerMarkdownPostProcessor((el, ctx) => {
		processStampsInRoot(el, plugin);
		ctx.addChild(new StampRenderChild(el, plugin));
	});
}
