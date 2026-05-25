# Changelog

## 4.0.1

Compliance pass against the Obsidian plugin guidelines, in preparation for submission to the community plugin store. No user-visible behavior change.

- Removed the top-level "Now Stamp" heading from the settings tab (guideline forbids top-level headings in settings).
- Rewrote the manifest description to start with a verb and remove the em-dash and arrow characters (guideline: no special characters; start with action verbs).
- Documented the internal CodeMirror 6 `EditorView` access used by the refresh path.

## 4.0.0

**Renamed: "Now Stamp" → "Dynamic Stamp"** to better describe the plugin's defining feature: day labels that stay alive across days.

- Plugin id changed: `now-stamp` → `dynamic-stamp`.
- GitHub repository moved: `github.com/isodesne/now-stamp` → `github.com/isodesne/dynamic-stamp` (old URL still redirects).
- No functional changes vs. 3.0.3.

### Migration from 3.x

1. Delete the old plugin folder `YOUR_VAULT/.obsidian/plugins/now-stamp/`.
2. Install Dynamic Stamp into `YOUR_VAULT/.obsidian/plugins/dynamic-stamp/` (download `main.js`, `manifest.json`, `styles.css` from the latest release).
3. Existing stamped notes continue to render correctly — the underlying HTML markers (`<span class="now-stamp ts-...">`) are intentionally unchanged for backward compatibility.

## 3.0.3

- Fix: Live Preview still showed stale day labels in some cases even after the 3.0.2 refresh hooks. Obsidian renders inline HTML through a widget that caches its post-processor output, and the visible nodes can be in a mirror/measurement copy of the DOM not covered by a narrow scan.
- Now refresh every `.now-stamp` node inside each `MarkdownView.containerEl` (covers mirror DOM and duplicate copies).
- Add a per-view `MutationObserver` so newly mounted stamp nodes get correct labels immediately (handles lazy widget render, scroll virtualization, cursor-near re-render). Throttled via `requestAnimationFrame`.
- Also refresh on `file-open` and `layout-change` events.

## 3.0.2

- Fix: Live Preview kept stale day labels (e.g. "Today" instead of "Saturday") after a note was opened across day boundaries. Decorations now refresh on active leaf change, window visibility change, and a local-midnight tick.
- Reading view path unchanged; both modes now use the same refresh trigger.

## 3.0.1

- Previous release.
