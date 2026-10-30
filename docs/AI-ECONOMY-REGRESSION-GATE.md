# Natural-match AI economy regression gate

**28 October 2026 · gameplay version 2.42.0 · test/CI only.**

## Why this exists

Two experimental harvester ore-routing heuristics passed targeted unit tests and the broad gameplay suite but reduced enemy income during 720-second natural matches. The first eight-tile risk penalty reduced total ore and eliminated the only observed AI airfield. A narrower two-tile penalty preserved airfields but still reduced **AI** ore deliveries on all three maps and increased worker losses. Both changes remain **unmerged** in draft PR #56.

Aggregate ore is misleading because it includes scripted-player income. The guard evaluates **enemy-only** ore per map, worker delivery frequency, harvester losses and natural Air Command progression.

## Verified baseline

Measured from main commit `077f0d1841356a53cbd2d16cd67a89ffe3092b8e`, successful GitHub Actions run `40534935886` on 27 October 2026, using three standard-difficulty 720-second matches:

| Metric | Baseline |
| --- | ---: |
| Verdant Front AI ore | 3,960 |
| Ashen Basin AI ore | 15,120 |
| Frostline AI ore | 9,000 |
| AI ore delivery ticks | 78 |
| AI harvesters lost | 4 |
| Operational AI Air Commands | 1/3 |
| AI aircraft deployed | 0 |

The new gate requires each map to retain at least **80%** of its baseline AI ore, at least **75%** of the 78 delivery ticks, no more than **six** harvester losses, and at least **one** operational AI Air Command. These are intentionally tolerant smoke floors, **not** balanced gameplay targets. The baseline has zero naturally deployed aircraft, so this guard cannot assert that aircraft production is solved.

## Run

Use `npm run balance:regression` to generate the production-engine natural progression report and evaluate the guard, or run `node tools/check-ai-economy-regression.mjs progression-report.json` against an existing report. The GitHub Pages verification workflow performs this check after its 720-second simulation and fails the PR if the guard is breached.

`node tests/ai-economy-guard.test.mjs` covers a valid baseline, boundary tolerances, a large per-map income regression, missing deliveries, vanished Air Commands, excessive losses and invalid report formats. Any intentional balance rebasing must document the before/after per-map economy, AI survival and aviation milestones before changing these thresholds.

## Limits

Deterministic scripted-player simulations are not human-played balance tests or real-device FPS measurements. The guard detects substantial regressions in its three fixed scenarios; it cannot prove that a gameplay change is good on other maps or difficulties. Always inspect full telemetry when touching AI mining, defense, pathfinding or production.

## Rebased current-main protection (30 October 2026)

The preceding table documents the original **27 October historical baseline**,
not the latest gameplay state. PR #162 demonstrated why that was insufficient:
the experimental Psionic infantry refinery reserve passed the historical gate
while **Verdant income fell from 7,560 to 4,680 (−38.1%)** and the refinery
was destroyed at **165.4s instead of 232.0s**. The experiment was closed
unmerged. The successful candidate workflow is
[run 41024510545](https://github.com/shukritobi/chrono-dominion/actions/runs/41024510545).

The current guard is now based on **main commit
`50bec225674592c530486baf52ae8066c88ae629`** and its independently
retrieved successful [main CI run 41019124696](https://github.com/shukritobi/chrono-dominion/actions/runs/41019124696):

| Natural 720-second measurement | Verified main | Minimum or maximum allowed |
| --- | ---: | ---: |
| Verdant AI ore income | 7,560 | ≥ 6,426 (85%) |
| Desert AI ore income | 21,960 | ≥ 18,666 (85%) |
| Frostline AI ore income | 9,360 | ≥ 7,956 (85%) |
| AI ore delivery ticks | 108 | ≥ 92 (85%) |
| AI harvester losses | 5 | ≤ 6 |
| Operational AI Air Commands | 1/3 | ≥ 1 |
| First operational Verdant refinery destruction | 232.0s | ≥ 197.2s (85%) |

The refinery survival check uses the existing exact
`results[].aiRefineryLossTelemetry.losses` trace, never a guessed nearby
attacker. A refinery that survives all 720 seconds passes; a built refinery
destroyed too early fails. Missing, truncated or malformed Verdant loss
telemetry fails closed. These thresholds are **regression smoke floors**,
not guaranteed victory, fair multiplayer balance or a claim that Verdant
survives permanently. They may be deliberately rebased after a documented
tradeoff, but must not silently drift as gameplay changes.

The updated test fixture reproduces both the 4,680-credit and 165.4-second
failures from PR #162, checks exact inclusive thresholds and validates
missing telemetry. The existing CI job already runs the guard against the
full natural progression report, so no workflow or save-format changes are
needed. This improvement changes **test gates only**, not gameplay, credits,
assets or player saves.
