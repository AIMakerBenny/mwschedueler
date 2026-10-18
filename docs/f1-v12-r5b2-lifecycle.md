# MWS F1 v1.2 R5-b2 - finish lifecycle compatibility repair

## Proven root cause

R5-b1 run 39122455412 had 12 natural finishers and a completed SOFT-to-HARD manual tyre service. However the official FINISHING screen reverted to RACE in the next browser task. Passive transition telemetry confirmed this exact sequence at the same committed simulation clock: RACE -> FINISHING -> RACE.

R5-b2 trace run 39123045407 identified the second caller as syncFinishOverlayV291 in assets/f1-racing-r291-r295.js, not the unified solver or the official race lifecycle. The historical Phase291 overlay deliberately forced screen state RACE to keep a race-view-hosted result overlay visible. This conflicts with the modern FINISHING -> PODIUM -> RESULT lifecycle.

## Implementation

- The original final-results overlay, podium rendering, complete results list, winner styling, replay action and setup action are retained.
- Overlay is attached to the stable gameF1Racing section instead of the race-only view. Its CSS positioning is rooted in that section, not an otherwise hidden race view.
- syncFinishOverlayV291 renders only when the official state is FINISHING and valid official rows exist. It no longer calls mwsF1SetScreenStateV185 to force RACE. In other lifecycle states it hides the overlay.
- Overlay actions provide direct official PODIUM and RESULT navigation while retaining the original replay and setup actions.
- No engine/physics/tyre wear/rank/position/strategy modification.

## Real browser regression

scripts/qa-f1-v12-r5b-live-finish.mjs retains the same non-forced 12-car FAST 3-lap integration, real 20ms unified solver, explicit SOFT -> HARD manual pit service, physical invalid/collision monitoring, confirmed passes, natural finish times, and profile checks.

R5-b2 additionally asserts:
- The official FINISHING state remains stable across separate browser tasks after the overlay observer settles.
- The overlay is visible, mounted to gameF1Racing, and shows 12 finishing rows, 3 podium cards and all four actions.
- Clicking the visible overlay PODIUM button transitions to the actual PODIUM screen, renders 3 results, and hides the overlay.
- Clicking the native PODIUM -> RESULT button transitions to the actual RESULT screen, renders 12 official rows and leaves the overlay hidden.
- Clicking native RESULT -> SETUP restores the setup screen, clears the result/snapshot, and preserves the selected contacts.
- The state history contains no FINISHING -> RACE transition. This is a hard regression failure, not a benign known issue.
- Actual Chromium screenshot of the final overlay is uploaded along with the JSON QA report.

## Remaining limitations

The exercise uses one physical circuit and FAST 3-lap mode, with a labelled manually requested pit stop. It does not establish autonomous pit strategy value, multi-track finish distributions, or NORMAL 10-lap full-race balance. Those remain future steps. Production must remain untouched. Do not report this as complete unless the newest development-branch GitHub Actions status is SUCCESS.
