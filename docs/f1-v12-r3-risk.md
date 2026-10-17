# MWS F1 v1.2 — R3 운전 실수·압박·위험도

Baseline R2 HEAD: 0132881e8ae7a3db4b6476b65960895b9f47b3ca. Development-only, no Production changes.

- \`unifiedPressureContextV12\`: nearby closing rear car, front congestion, current attacking state, R1 effort level, tyre temperature from actual race physics.
- \`unifiedRiskUpdateV12\`: accumulated driving stress from aggressive effort/duels/proximity/heat; cooling during conservative driving. Pit laps do not trigger errors, and paused time causes no updates. This is physical-step state and rolls back if collision solver rejects step.
- Existing \`unifiedIncidentRateV11\` adds stress, pushing and heat to original wear, proximity, attack and driver resistance; preserves rate limits \`[.001,.025]\` events/s and 12s cooldown. This is not a leaderboard/rank based catch-up penalty.
- Brake lockup, understeer, exit traction errors retain the original causal phase triggers and effects. No teleport, position swap, free drag, artificial penalties or extra physics solver.
- \`unifiedCompetitionNewV12\` tracks bounded accepted-step \`incidentEvents\`, R0 snapshots carry stress, local pressure and risk/s. Public immutable \`window.mwsF1RiskV12Report()\` provides diagnostic states.
- Test: synthetic 12 car, 120s, reversed order, stressed vs relaxed risk comparison, load accumulation and recovery, correct phase-specific error, pit exclusion, source state and RNG, collision-rejection atomicity, physical and Chromium integration.
- End-to-end racing competitiveness / leader switch targets require real seven-track long-run multi-seed R5, not implied by this R3 QA.
