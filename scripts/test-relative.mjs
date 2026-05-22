import esbuild from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const tempDir = await mkdtemp(path.join(tmpdir(), "now-stamp-test-"));
const bundledModule = path.join(tempDir, "now-stamp-source.mjs");

await esbuild.build({
	stdin: {
		contents: [
			"export * from './src/format.ts';",
			"export * from './src/relative.ts';",
			"export * from './src/settings.ts';",
			"export * from './src/stamp-markers.ts';",
		].join("\n"),
		resolveDir: process.cwd(),
		sourcefile: "test-entry.ts",
		loader: "ts",
	},
	bundle: true,
	format: "esm",
	logLevel: "silent",
	outfile: bundledModule,
	platform: "browser",
	plugins: [
		{
			name: "obsidian-test-stub",
			setup(build) {
				build.onResolve({ filter: /^obsidian$/ }, () => ({
					namespace: "obsidian-test-stub",
					path: "obsidian",
				}));
				build.onLoad(
					{ filter: /^obsidian$/, namespace: "obsidian-test-stub" },
					() => ({
						contents: [
							"export class PluginSettingTab {}",
							"export class Setting {}",
						].join("\n"),
						loader: "js",
					}),
				);
			},
		},
	],
});

const mod = await import(pathToFileURL(bundledModule).href);

const settings = {
	timeFormat: "12h",
	includeDayLabel: true,
	triggerPhrase: "@now",
	styleTimestamps: true,
	relativeDates: true,
	todayTriggerIncludesTime: false,
};

let failures = 0;

function expect(name, got, want) {
	if (Object.is(got, want)) {
		console.log(`OK ${name}`);
		return;
	}
	failures += 1;
	console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

function expectTrue(name, value) {
	expect(name, Boolean(value), true);
}

try {
	const view = new Date("2026-05-22T12:00:00");

	expect(
		"same day label",
		mod.formatRelativeDayLabel(new Date("2026-05-22T00:01:00"), view),
		"Today",
	);
	expect(
		"yesterday label",
		mod.formatRelativeDayLabel(new Date("2026-05-21T23:59:00"), view),
		"Yesterday",
	);
	expect(
		"weekday label",
		mod.formatRelativeDayLabel(new Date("2026-05-16T12:00:00"), view),
		"Saturday",
	);
	expect(
		"old same-year label",
		mod.formatRelativeDayLabel(new Date("2026-05-15T12:00:00"), view),
		"May 15",
	);
	expect(
		"future same-year label",
		mod.formatRelativeDayLabel(new Date("2026-05-23T12:00:00"), view),
		"May 23",
	);
	expect(
		"future next-year label",
		mod.formatRelativeDayLabel(new Date("2027-01-02T12:00:00"), view),
		"Jan 2, 2027",
	);

	expect(
		"spring DST adjacent day",
		mod.dayOffset(
			new Date("2026-03-29T00:30:00"),
			new Date("2026-03-30T00:30:00"),
		),
		1,
	);
	expect(
		"fall DST adjacent day",
		mod.dayOffset(
			new Date("2026-10-25T00:30:00"),
			new Date("2026-10-26T00:30:00"),
		),
		1,
	);
	expect(
		"yesterday label-only preserves time",
		mod.anchorForLabelOnly("Yesterday", new Date("2026-05-22T13:18:00")).getHours(),
		13,
	);

	expect("midnight 12h", mod.formatTime(new Date("2026-05-22T00:05:00"), "12h"), "12:05 AM");
	expect("noon 12h", mod.formatTime(new Date("2026-05-22T12:05:00"), "12h"), "12:05 PM");
	expect("24h padding", mod.formatTime(new Date("2026-05-22T03:07:00"), "24h"), "03:07");

	const span = mod.buildDynamicSpan(
		'Today <x> & "q"',
		new Date("2026-05-22T12:00:00Z"),
		settings,
	);
	expectTrue("dynamic span escapes HTML", span.includes("Today &lt;x&gt; &amp; &quot;q&quot;"));
	expectTrue("dynamic span stores ts class", /\bts-\d+\b/.test(span));

	const labelOnlySpan = mod.buildDynamicSpan(
		"Yesterday ",
		new Date("2026-05-21T11:18:00Z"),
		settings,
		true,
	);
	expectTrue("label-only span stores encoded day class", /\bday-x[0-9a-z]+\b/i.test(labelOnlySpan));
	expectTrue("label-only span avoids raw millisecond day class", !/\bday-\d+\b/.test(labelOnlySpan));
	expectTrue("label-only span does not store ts class", !/\bts-\d+\b/.test(labelOnlySpan));
	expectTrue("label-only span omits datetime", !labelOnlySpan.includes("datetime="));
	expectTrue("label-only span omits title", !labelOnlySpan.includes("title="));

	const todayWithTime = mod.buildLabelOnlyInsert("Today", {
		...settings,
		todayTriggerIncludesTime: true,
	}, new Date("2026-05-22T13:18:00"));
	expectTrue("today trigger can include time", todayWithTime.includes("Today 1:18 PM"));
	expectTrue("today trigger with time uses ts class", /\bts-\d+\b/.test(todayWithTime));
	expectTrue("today trigger with time omits day class", !/\bday-\d+\b/.test(todayWithTime));

	const yesterdayWithTodayTimeSetting = mod.buildLabelOnlyInsert("Yesterday", {
		...settings,
		todayTriggerIncludesTime: true,
	}, new Date("2026-05-22T13:18:00"));
	expectTrue("yesterday remains label-only when today time setting on", yesterdayWithTodayTimeSetting.includes("Yesterday "));
	expectTrue("yesterday still uses encoded day class", /\bday-x[0-9a-z]+\b/i.test(yesterdayWithTodayTimeSetting));
	expectTrue("yesterday still omits time metadata", !yesterdayWithTodayTimeSetting.includes("datetime="));

	expect(
		"parse class timestamp first",
		mod.parseMsFromStampAttrs(
			' class="now-stamp ts-1778581986143 now-stamp--muted" title="1"',
		),
		1778581986143,
	);
	expect(
		"parse encoded day class timestamp",
		mod.parseMsFromStampAttrs(
			` class="now-stamp day-x${(1778581986143).toString(36)} now-stamp--muted now-stamp--label-only"`,
		),
		1778581986143,
	);
	expect(
		"parse legacy day class timestamp",
		mod.parseMsFromStampAttrs(
			' class="now-stamp day-1778581986143 now-stamp--muted now-stamp--label-only"',
		),
		1778581986143,
	);
	expect(
		"parse title fallback",
		mod.parseMsFromStampAttrs(' class="now-stamp" title="1778581986143"'),
		1778581986143,
	);
	expect(
		"parse datetime fallback",
		mod.parseMsFromStampAttrs(
			' class="now-stamp" datetime="2026-05-22T10:00:00.000Z"',
		),
		Date.parse("2026-05-22T10:00:00.000Z"),
	);
	expect("parse invalid attrs", mod.parseMsFromStampAttrs(' class="now-stamp ts-nope"'), null);

	const many = Array.from(
		{ length: 2_000 },
		(_, i) =>
			`<span class="now-stamp ts-${1778581986000 + i}">Today 1:00 PM</span>`,
	).join(" ");
	const start = performance.now();
	const matches = mod.findStampsInLine(many);
	const elapsed = performance.now() - start;
	expect("scan 2000 stamps", matches.length, 2_000);
	expectTrue("scan 2000 stamps under 500ms", elapsed < 500);

	expect("normalize valid trigger", mod.normalizeTriggerPhrase(" @later "), "@later");
	expect("reject trigger without at-sign", mod.normalizeTriggerPhrase("later"), null);
	expect("reject reserved @today trigger", mod.normalizeTriggerPhrase("@today"), null);
	expect("reject reserved @yesterday trigger", mod.normalizeTriggerPhrase("@Yesterday"), null);
} finally {
	await rm(tempDir, { force: true, recursive: true });
}

if (failures > 0) {
	console.log(`FAILED ${failures}`);
	process.exit(1);
}

console.log("OK stress suite");
