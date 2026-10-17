# MWS F1 v1.2 R0 — passive competition baseline

Development-only scope: 20ms unified engine, no physics/balance/pit changes. Production untouched.

Use \`window.mwsF1CompetitionBaselineV12()\` during/after a live race. Results are detached snapshots.

- Every 5s simulation-time, sample every driver's physical \`raceProgress\`, current rank, speed, tyre wear, battery, AI intent, lane block count, pit state and fixed form/pace.
- Record gap leader→P2 and leader→last in track metres, confirmed physical passes and raw crossings, rank reorders and leader changes.
- \`trafficConstrainedSteps\`, \`trafficByDriver\`: accepted predicted-traffic speed limitations, counted by actual physics row/vehicle id.
- \`aiModeSteps\`, \`mergeBlockedSteps\`: accepted state occupancy, not an assertion of lost attempts.
- \`attemptEventCounts\`: type-level committed attempt events (START/BLOCKED/SIDE_BY_SIDE/SUCCESS/UNATTRIBUTED_PASS/DISENGAGED, etc.), not just most recent truncated ledger.
- Sample retention bounded to 480 entries, keeping first and most recent.
- Observations are passive, use no RNG and only record after full physical sweep/commit. Explicit reset clears all measurements.
- \`rankReorders\` is *not* a physical overtake count; pit/finish can reorder. For passes rely on the 500ms physical crossing ledger.

R0 fixture baseline: 12 cars, 90s synthetic circle, D0 pace 95 / D11 pace 75. Initial gaps grow with 0 confirmed passes, matching the reported lead lock-in symptom in a *controlled* setup. Do not infer real 7-SVG full-race balance or specific user's "거대별" profile from these fixtures.

R1–R5 comparisons shall use same seed/grid with FAST 3-lap and NORMAL and full real-SVG track scenarios. Do not alter Production without explicit authorization.
