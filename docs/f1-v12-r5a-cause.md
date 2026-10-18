# R5-a - observed lead-gap separation and extended FAST pilot

The R5-a change adds diagnostics and regression coverage. It does NOT alter the unified v1.1 motion solver, any race balance coefficients, pit code, UI, tyre strategy, or Production.

## Verified earlier R5 evidence
Source: GitHub Actions run 39025452643 artifact f1-v12-r5-balance, 28 real-SVG / 90 simulated-second scenarios.
- All scenarios: 297 confirmed physical passes, 23 leader-change events, 25/28 initial pole held at the 90-second observation, 23/28 leader-to-P2 gaps above 100 metres.
- Equal-pace seed 0: 14 cases, 12 original leaders held, 10 last gaps above 100 metres, 148 passes and 20 leader-change events. Mean ending gap 151.3 m.
- Strong-pole seed 1: 14 cases, 13 original leaders held, 13 last gaps above 100 metres, 149 passes and 3 leader-change events. Mean ending gap 277.4 m.
- Therefore strong pole pace is not a sufficient explanation for lead separation: equal-pace fixtures also showed it. These figures are not full-race win rates.
- R5's pit transitions were intentionally stubbed. Pit or late-race strategic causes cannot be established from that artifact.

## New R5-a QA
1. The 28-case 90-second run now writes 5-second accepted-step series. It observes leader/P2 gap and speeds, tyre wear, battery MJ, requested ERS kW, driving styles, AI mode, pressure, traffic constraints, physical passes and leader identity. No physics mutation.
2. scripts/qa-f1-v12-r5a-cause.mjs groups results by seed, track and FAST/NORMAL mode, measures the first observed >100 m gap, and compares 0-30, 30-60, and 60+ second windows. These are time-window labels, NOT official race stages.
3. A 240-second isolated pilot covers castle-street-circuit-v1 FAST for both original seeds. The first physical crossing of the 3-lap threshold is recorded as a PROVISIONAL physics observation. No official finish order or winner is inferred. Race lifecycle, pit and UI are still fixture stubs.
4. GitHub Actions uploads f1-v12-r5a-cause with both audit output files and extended pilot evidence. Existing R5 artifact remains independently uploaded.
5. Physical-world overlaps, invalid solver steps, discontinuities, stopped steps and pass-ledger consistency remain asserted by the existing R5 script during both runs. The 5-second snapshots are sampled post-commit and do not substitute for per-step full collision checks.

## Interpretation discipline
- An observed velocity, tyre, ERS request, or traffic correlation is not by itself proof of a causal mechanism.
- A requested ERS value is not necessarily delivered energy.
- Leader-gap comparison always respects changing leader and P2 identities.
- A vehicle physically reaching the target progress does not certify actual UI race completion or final classification.
- A pit fixture with TRACK-only statuses is not actual integrated pit evidence. This remains an explicit limitation.

## Next phase after R5-a
R5-b should use actual race lifecycle and true pit entry, tyre service, and pit exit in integrated Chromium tests, then validate full FAST and NORMAL finish ranks, lap times and complete race strategy. Only after that evidence should physical strategy tuning be considered. Do not force rank swaps, artificially slow the leader, accelerate the pack, offset markers or reintroduce legacy solvers.
