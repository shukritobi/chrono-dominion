# Chrono Dominion balance laboratory baseline
**Measured:** 26 October 2026  
**Engine milestones:** v2.2 ore-reachability fix; continued under v2.3 reconnaissance.

## Test design

The `tools/simulate-matches.mjs` tool runs the production `game.js` engine inside Node's VM with a lightweight DOM/canvas stub, using the built-in three map definitions and all three AI difficulties.

Each scenario has a simple **scripted player**, rotating Coalition Forces, Iron Federation and Psionic Order through the matchup matrix. Both sides must obey the existing credits, unit costs, building prerequisites, projectile and movement rules. The scripted player builds a factory/radar when possible, queues infantry and armour, moves toward central terrain and defends against visible raiders.

Each row below is **240 seconds of simulated game time** (`--duration=240`); a scenario can end earlier if the normal battle-ending condition occurs. None of the nine baseline scenarios ended before the 240-second limit.

These results are **reproducible regression and economy telemetry, not human win rates, comprehensive AI skill tests, competitive faction balance scores or actual 240 seconds of wall-clock browser rendering**.

## Discovered bug: AI harvesters targeting inaccessible ore

The original harvester chose an ore deposit by Euclidean distance alone. Ore rendered under building footprints and deposits separated by impassable terrain could become permanent nearest targets, even when the harvester could never mine them.

Fix: `chooseHarvestDeposit(e)` rejects deposits inside a building's occupied area, checks A* route completion to a usable landing, remembers a selected index, and temporarily skips an ore patch when the harvester makes no progress. The harvester can reselect deposits without assuming hidden combat information. This is used by player and AI harvesters.

### Ashen Basin economy, before and after the reachability fix

| Difficulty | Scripted player ore before | AI ore before | Scripted player ore after | AI ore after |
|---|---:|---:|---:|---:|
| Recruit | 5,400 | 720 | 7,920 | **8,280** |
| Standard | 7,200 | 720 | 7,920 | **7,560** |
| Veteran | 7,200 | 1,440 | 8,280 | **6,840** |

The AI previously earned just 10–20% of scripted-player deposits in this sample. After the fix, it delivered roughly 83–105% of the scripted player's ore across these three particular runs. This is a meaningful repair, **not evidence that overall game balance has been solved**.

### Other post-fix economy findings

| Map | Recruit (player / AI) | Standard (player / AI) | Veteran (player / AI) |
|---|---|---|---|
| Verdant Front | 9,000 / 4,320 | 9,720 / 3,960 | 9,720 / 4,320 |
| Ashen Basin | 7,920 / 8,280 | 7,920 / 7,560 | 8,280 / 6,840 |
| Frostline | 7,200 / 2,160 | 7,200 / 3,960 | 6,480 / 3,960 |

**Outstanding issue:** Verdant Front and Frostline still show notable economy differences in these scripted matches. Those differences may involve resource placement, opponent unit losses, refinery pathing, construction sequencing or scripted-player bias. They need separate investigation before changing faction or difficulty bonuses.

The original 240-second sweep saw AI platoon staging in **0/9** runs, even when damage and production were recorded. Sector reconnaissance was subsequently added in v2.3 to address discovery of hostile structures, but its long-match effect requires a fresh comparison. The separate platoon unit tests continue to check rally and assault behaviour.

## Automated coverage and source

- `npm run balance:quick` runs the nine-case 75-second smoke matrix.
- `npm run balance` runs the nine-case 240-second matrix.
- `npm run balance:full` runs the longer 540-second matrix.
- Add `--out=report.json` to obtain a machine-readable JSON report.
- GitHub Actions archives the 240-second JSON report and checks map/faction rotation, basic economic progression, combat activity and entity, queue, projectile and fog integrity.
- `tests/ore-reachability-v22.test.mjs` tests deposits hidden under structures, disconnected water terrain, temporary blacklisting and save migration.
- `tests/match-lifecycle-v22.test.mjs` verifies that fog resets between new matches and AI construction never consults hidden enemy positions.

### Original workflow evidence

- [Before reachability fix, 240-second matrix](https://github.com/shukritobi/chrono-dominion/actions/runs/40257023254)
- [After reachability fix, 240-second matrix](https://github.com/shukritobi/chrono-dominion/actions/runs/40257410934)

## Next scientific iteration

1. Rerun the same nine scenarios under v2.3 and compare first enemy building sighting, platoon launches, credits and unit losses by faction and map.
2. Investigate Frostline and Verdant AI harvester throughput, using per-harvester stuck-time samples and final nearest-ore targets.
3. Create additional scripted-player styles, including defensive turtling, aggressive early infantry pressure and tank-only attack patterns.
4. Include longer end-to-end games that terminate in victory or defeat, rather than treating the 240-second time limit as a win-rate proxy.
5. Treat win rates, balance and visual frame-rate performance as **unknown** until representative human testing and real-browser profiling are available.
