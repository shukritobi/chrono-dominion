# Natural AI technology progression laboratory

**Added:** 27 October 2026. **Gameplay version:** 2.42.0 (test/telemetry only; no save-schema or unit changes).

## Purpose

The original nine 240-second scripted-player skirmishes reliably cover economy, scouting, ground combat and movement but have not produced aircraft. The separate aviation laboratory proves paid aircraft production only after directly providing prerequisite-complete AI bases. Neither exercise establishes that a naturally developing enemy reaches an operational Air Command.

## Reproducible real-engine exercise

Run `npm run balance:progression` or `node tools/simulate-matches.mjs --progression --duration=720 --out=progression-report.json`. The mode runs one standard-difficulty match on each of Verdant Front, Ashen Basin and Frostline, cycling the enemy through Coalition, Federation and Psionic factions. It uses the existing scripted *player* and normal enemy planner, harvesting, power, costs, construction timers, placement restrictions and production queues. No AI technology or credits are injected and no AI strategic scheduler is disabled.

Each scenario records `aiMilestones` for generator, refinery, factory, radar, tech and airfield with `startedAt` and `operationalAt` game-second timestamps. `firstAircraftQueuedAt` and `firstAircraftDeployedAt` track actual production. A null value means that milestone was **not observed before the match ended**, not that it was broken or impossible. Summary counters report how many of the three scenarios reached each milestone. Existing nine-scenario result fields and JSON schema remain compatible; `mode` distinguishes reports.

The extended check requires three distinct AI factions, a valid economy and combat simulation, consistent milestone ordering, and at least one operational AI factory. It deliberately does **not** require an airfield or aircraft in every match: survival, resource access and battle outcome can prevent late-game progression. Missing aviation milestones must be investigated, not hidden behind artificial success assertions.

## Continuous verification and limitations

The Pages verification workflow runs the original nine-scenario balance test, the three extended natural-progression matches, and the 15 controlled aviation scenarios. It archives `balance-report.json`, `progression-report.json` and `air-report.json` for comparison. No browser FPS, human balance, actual mobile touch experience or naturally competitive air-wing win rates are inferred.

Follow-up: review progression reports across maps and difficulties, identify the bottleneck (income, power, placement, AI priorities or early defeat), then make narrowly scoped gameplay changes backed by repeatable regressions.
## Affordable Air Command investment follow-up

The first extended CI baseline observed **three operational factories and three radars, but zero Technology Labs, Air Commands or aircraft** across three 720-second contested matches. This is an observed testing gap, not evidence that aviation functions naturally. In the source, Air Command required >3,500 credits and was evaluated after optional Technology Lab, despite costing 1,750 credits and requiring only factory/radar.

The targeted AI change now considers Air Command first when its 1,750-credit cost plus a 650-credit generator reserve is available, after existing power and emergency-defense priorities. `tests/ai-aviation-investment.test.mjs` covers the real construction decision across all three factions. The extended progression report will reveal whether this alone is sufficient in contested games; no guaranteed aircraft count is assumed.

To address the second bottleneck, the AI also banks toward the 2,400-credit threshold once it has two surviving tanks, a completed factory/radar and no visible nearby invaders. Routine unit recruitment and optional turret purchases are deferred until the Air Command is started. Under attack, recruitment and emergency turret priorities remain active. This is a bounded strategic saving rule, not free money or a new persistent state field.

## Aviation decision diagnostics (27 October 2026)

The progression mode now observes the **completed real AI planner** at each AI decision, without changing its choices or scheduling. It classifies missing factory/radar, early Air Command eligibility, airfield funding, affordable but unstarted Air Command, construction in progress, brownout, lost harvester, detected attack, lost ground screen, occupied production queue, aircraft funding, affordable but unqueued aircraft and completed wing.

Each result adds `aiAviation.decisions` (counts per AI tick), `airfieldDecisionTicks`, `maxCreditsAfterAirfield` and `recent` (last 12 decision snapshots); the summary adds `aiAviationBlockers`. These labels are **observed states, not proven causes**. For example, affordable-but-unqueued can reflect a competing planner priority. All existing result fields and browser saves remain compatible. Use the telemetry to select and validate a subsequent gameplay fix rather than treating prerequisite-complete tests as evidence of natural aviation.

## One-survivor Air Command saving (28 October 2026)

The original Air Command saving rule required two living tanks/heavies, even
after the AI had already paid for its factory and radar. Losing one defender
while still safe could release the reserve and trigger cheap reconnaissance or
tank purchases at every decision, preventing recovery to the 2,400-credit
Air Command threshold. This is a source-level risk, **not** proof that all
natural-match airfield funding stalls had this cause.

A safe, powered AI with an operational factory/radar, an active harvester and
**one** surviving tank/heavy now continues banking toward its first paid
Air Command. The 1,750-credit building price, 650-credit emergency generator
reserve, >130-second eligibility, placement, construction timer and save format
are unchanged. A base with no armour, no harvester or a visible local attack
does not receive the one-tank saving protection; emergency construction and
defensive recruitment retain their priority. This aligns pre-airfield savings
with the existing one-survivor post-airfield attrition recovery.

`tests/ai-aviation-investment.test.mjs` checks the one-tank reserve and
paid construction in all three factions, plus zero-tank and visible-invasion
fallbacks and v1 save/load. The complete 720-second natural-progression CI
matrix and AI economy guard must pass before merging. Do not infer actual
aircraft production or a frame-rate improvement from these targeted tests.
