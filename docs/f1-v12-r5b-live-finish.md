# MWS F1 v1.2 R5-b1 - LIVE FAST natural finish and real pit integration

## Scope and safeguards
This step extends R5-a from isolated SVG fixture observation to an actual Chromium-rendered race using the existing app, original SVG circuit and the existing unified v1.1 engine. No physics coefficients, collision logic, rank correction, position assignments or Production files are changed.

Test: scripts/qa-f1-v12-r5b-live-finish.mjs. Starts 12 real contact fixtures on castle-street-circuit-v1 in FAST 3-lap mode through the normal setup, transition and grid user flow; stops RAF to advance the same publicly exported 20 ms race step deterministically.

R5-b1 issues exactly one explicitly labelled MANUAL_QA HARD tyre request while a selected driver approaches the first lap's pit entry. This deliberately verifies production pit adapters and must not be described as an AI-selected pit. Every other driver follows the existing automatic strategy unmodified.

Checks: all 12 drivers must have real finish crossing times, unique official finishPosition ranks 1-12, at least two completed timed laps, and a real race-result object. The normal simulation loop must transition to FINISHING without calling the force-finish helper. The finishing view must actually become visible in the DOM. The manually requested pit car must complete TRACK -> PIT_ENTRY -> PIT_LANE -> PIT_BOX -> PIT_LANE -> PIT_EXIT -> TRACK, receive HARD tyres exactly once, and stop in the box. Tests also monitor rejected solver steps, physical telemetry, path continuity, committed passes, manual pause stability and profile markers.

## Earlier failed CI runs and discovered issue
- Run 39118406376 failed a strict post-finish state getter check despite recording 12 completed drivers, one full manual pit cycle and no physical collision.
- Run 39119089949 confirmed the last real race step returned FINISHING, the official result included all 12 drivers and the result view existed. The subsequent screen-state getter returned RACE despite the completed-result DOM. Physical telemetry had collisionStops=0 and no invalid step, with 17 confirmed passes. This is a post-finish state consistency issue, distinct from the official finish/pit mechanics.
- Run 39119924799 confirmed that the post-evaluation FINISHING DOM was no longer active. This is a real post-finish UI regression, not merely a stale read-only getter.
- R5-b1 now asserts the FINISHING state, visible FINISHING DOM, and complete official results at the same accepted physics step when natural race completion occurs. The post-evaluation state reversion is explicitly flagged as an unresolved R5-b2 UI lifecycle issue. The QA does not change runtime state to fake success.

## Remaining work
R5-b2 should separately resolve and regress the post-finish screen-state getter inconsistency, validate result -> podium -> setup controls, and extend full LIVE races to NORMAL mode and multiple physical tracks and seeds. R5-b1 cannot certify the natural automatic pit-strategy balance, a multi-track full-race distribution, all UI finish controls or NORMAL 10-lap completion. Those are Not available from this test.

The GitHub Actions full job must be SUCCESS at the final R5-b1 HEAD before reporting the step as complete.
