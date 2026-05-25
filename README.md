# Dynamic Stamp

**Inline timestamps for Obsidian whose day label stays alive.**

Stamp a note today and it reads `Today 11:50 AM`. Open the same note tomorrow — it reads `Yesterday 11:50 AM`. A week later — `Thursday 11:50 AM`. The time you wrote never changes; the day label updates itself every time you open the file.

Built for journaling, work logs, meeting notes, and any place a sense of *when* matters.

## Why Dynamic Stamp

Most date plugins freeze the text at the moment you type: `[[2026-05-23]]` is forever `2026-05-23`. Dynamic Stamp goes the other way — the underlying timestamp is stored once, and the visible day label re-renders relative to today every time you read the note.

## Features

- Type **`@now`** → full inline timestamp, e.g. `Today 11:50 AM`
- Type **`@today`** or **`@yesterday`** → day label only (then type your own time)
- **Self-updating day labels**: `Today` → `Yesterday` → weekday → date as time passes
- The original time you stamped is preserved forever — only the day label moves
- **12-hour or 24-hour** time format
- Optional muted gray styling
- Works in Live Preview and Reading view, desktop and mobile
- Trigger phrase is customizable (default `@now`)
- Lightweight, no network calls, no telemetry

## Install

Dynamic Stamp is not in the Obsidian community plugin browser yet. Install manually:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/isodesne/dynamic-stamp/releases/latest).
2. Copy them into `YOUR_VAULT/.obsidian/plugins/dynamic-stamp/`.
3. Open **Settings → Community plugins**, enable community plugins, and turn on **Dynamic Stamp**.

## Usage

| Trigger | Inserts |
|---------|---------|
| `@now` (configurable) | Full timestamp, e.g. `Today 11:50 AM` |
| `@today` | `Today ` — then type your own time |
| `@yesterday` | `Yesterday ` — then type your own time |

Configure trigger phrase, time format, and styling under **Settings → Dynamic Stamp**.

### How the day label ages

| Age when you re-open the note | Label shown |
|-------------------------------|-------------|
| Same day | `Today` |
| Previous day | `Yesterday` |
| 2 – 6 days ago | Weekday name (e.g. `Thursday`) |
| 7+ days ago | Short date (e.g. `May 15`, adds year if needed) |

The clock time you stamped never changes. Only the day word in front of it does.

Prefer fully static text? Turn off **Relative day labels** in settings; stamps then read exactly as written.

## Privacy

No data leaves your vault. No network requests, no analytics, no tracking. Stamps are plain HTML stored in your markdown files; uninstalling the plugin leaves them readable.

## Development

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm run build    # production build → main.js
npm run dev      # watch mode
npm test         # unit + stress tests
```

To test locally, copy `main.js`, `manifest.json`, and `styles.css` into your vault's `.obsidian/plugins/dynamic-stamp/` folder and reload the plugin.

## Migrating from "Now Stamp"

Dynamic Stamp is the renamed successor of "Now Stamp" (v3.x). If you used Now Stamp:

1. Delete the old `.obsidian/plugins/now-stamp/` folder.
2. Install Dynamic Stamp as above.
3. Existing stamped notes continue to work — the underlying HTML markers are unchanged.

## License

MIT — see [LICENSE](LICENSE).
