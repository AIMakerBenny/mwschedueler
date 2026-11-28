# Premium calendar stage 29 audit

Baseline: 5659f947dcddfaa1fd67d974f344aac51152f03b (stage 28), five isolated synthetic browser fixtures, workflow 46151267263.

| Viewport | Readable visible titles | VR titles | Dense date cards |
| --- | --- | --- | --- |
| 390x844 | 26/26 | 20/20 | 2 |
| 1366x768 | 31/31 | 20/20 | 3 |
| 1920x1080 | 31/31 | 20/20 | 3 |
| 2560x1440 | 31/31 | 20/20 | 3 |
| 2560x1080 | 31/31 | 20/20 | 3 |

Mobile editor: horizontal overflow 0, save/cancel/delete/duplicate target heights 44 CSS px. QHD card title 14 CSS px. All five fixture runs: calendar-startup 1, parts-batch 1; media/contact requests 8 on mobile and 1366, 9 on remaining viewports. Wide agenda interactions 0 additional requests, interrupted exit/reopen verified. These are isolated fixtures, not production Worker billing or real user traffic measurements.

Stage 28 workflows: 26/28 success; contact geometry output missing (46151267161), CDP startup timeout (46151267262). Request budget workflow 46151267226 passed offline contracts and both navigation audits; calendar-idle skipped. Stage 29 hardens the QA harness and raises the mobile title gate to the observed full fixture readability. No product code or deployment changes. Fresh stage 29 results pending.

Visual assessment: actual QHD/mobile captures show functional hierarchy and stable geometry. Landscape remains visibly procedural; photographic rock, tree and atmospheric detail and richer instrument surfaces remain below the original reference. Mobile month remains narrow and requires vertical scrolling. Do not treat functional QA as aesthetic acceptance. No production merge or deployment until outstanding verification and visual target are resolved.
