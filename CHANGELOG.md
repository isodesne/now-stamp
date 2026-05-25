# Changelog

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
