# Stages 3–7 implementation notes

Baseline bfe8529df667a5b6b4b731ff999fc1711068a850. Generated cleanup removes repeated identical declarations in the same file and exact selector/condition; second pass removes only shadowed stable literal geometry declarations in sidebar/calendar/shell selectors, when the later declaration has equal/higher priority. Different selectors, conditions, custom properties, animation, shorthand relationships and newer CSS values remain untouched. This is conservative source cleanup, not a complete redesign or proof that every conflict is obsolete.

The sidebar collapsed rail has a shared CSS width token and geometry-based pointer boundary, with keyboard focus-out handling. Calendar layout retains existing toolbar/month/group/copy/drag behavior. F1's 18 original CSS files remain canonical sources; build the one ordered runtime bundle with `node scripts/build-f1-css-bundle.mjs` after editing them and verify with `--check`. Do not manually edit the generated file.

Admin hydration checks all required parts together, preserving the merge order, version validation, auth and draft recovery. Public startup and cache policy are unchanged. Timer cleanup and preloading existing shell styles reduce avoidable waiting without adding periodic data requests. Browser fixture tests compare computed styles and geometry, not pixel-identical screenshots, and use synthetic data. Production request/latency numbers are not inferred from static asset counts.

The cleanup evidence JSONs list exact source locations; the workflow runs isolated baseline and candidate comparisons at four viewport sizes and verifies first-paint, pointer, group save, and cold Admin data batching. Retain conditional and untested rules for future verified work.

Final F1 compatibility: restore the original F1 CSS declarations exactly (12 removals / 252 bytes from the initial cleanup were reverted); bundle only. The source audit helper verifies actual bundle bytes and order and expands its source manifest for legacy phase checks. Final net removals: 297 declarations / 6,086 bytes.
