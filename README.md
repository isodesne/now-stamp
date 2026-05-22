# Now Stamp

Insert inline timestamps for journaling and quick notes in Obsidian — plain text, no wikilinks.

## Features

- Type **`@now`** (customizable) → full timestamp, e.g. `Today 11:50 AM`
- Type **`@today`** or **`@yesterday`** → day label only, then type your time
- Optional setting: make **`@today`** insert current time too, while **`@yesterday`** stays label-only
- **Relative day labels** (default): stamps remember when you wrote them; labels update when you re-read (Today → Yesterday → weekday → date)
- **12h / 24h** time, optional gray styling, mobile supported

## Install

### From Obsidian Community Plugins

1. Open **Settings → Community plugins**
2. Turn on **Community plugins** and **Browse**
3. Search for **Now Stamp** and install
4. Enable the plugin and reload if prompted

### Manual install

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest GitHub release](https://github.com/isodesne/now-stamp/releases/latest)
2. Copy them to `YOUR_VAULT/.obsidian/plugins/now-stamp/` (e.g. `Documents/Obsidian Vault/.obsidian/plugins/now-stamp/`)
3. Enable **Now Stamp** under **Community plugins**

## Usage

| Trigger | Result |
|---------|--------|
| `@now` (default, configurable) | Full timestamp + trailing space |
| `@today` | `Today ` (label only), or `Today 11:50 AM ` if enabled in settings |
| `@yesterday` | `Yesterday ` (label only) |

Configure in **Settings → Now Stamp**.

### Relative labels

| Age when reading | Label |
|------------------|-------|
| Same day | Today |
| Previous day | Yesterday |
| 2–6 days ago | Weekday (e.g. Thursday) |
| 7+ days ago | May 15 (adds year if needed) |

Time always stays the moment you stamped.

- **Live Preview**: relative labels render via editor extension (edit `ts-` for full stamps or `day-x` for label-only stamps in Source, then view the line in Live Preview).
- **Reading view**: labels update via markdown post-processor.
- **Source-only mode**: you see raw `<span class="now-stamp ts-...">` or `<span class="now-stamp day-x...">` HTML; relative labels do not apply until Live Preview or Reading.

To test without waiting: in Source, change `ts-1779186786143` to `ts-1778581986143` for a full stamp. For label-only stamps, insert a fresh `@today` or `@yesterday`; the plugin stores that marker in encoded `day-x...` form to avoid Obsidian showing a hidden time while editing.

Turn off **Relative day labels** for frozen static text.

## Development

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm run build    # production build → main.js
npm run dev      # watch mode
```

Copy `main.js`, `manifest.json`, and `styles.css` into your vault plugin folder for local testing.

## License

MIT — see [LICENSE](LICENSE).
