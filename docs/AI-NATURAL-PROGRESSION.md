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