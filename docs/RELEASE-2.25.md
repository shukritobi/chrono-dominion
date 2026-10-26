# Chrono Dominion v2.25.0: AI Air Wing

**26 October 2026**

## Scope

The playable Strike Aircraft existed in v2.21 and mixed player-controlled flight formations were corrected in v2.23, but the AI never constructed Air Command or recruited aircraft. This release adds a bounded, sensor-honest AI aviation loop without changing player aircraft or saved-game schema.

## Implemented

- AI can construct an Air Command building after factory and radar prerequisites, once it has adequate funds and the opening economy has matured. Building costs, power and construction time use existing systems.
- AI can queue aircraft at the standard cost, provided it has a completed airfield and enough economic reserve. Recruitment is limited to two living aircraft.
- AI aircraft receive orders independently of ground-only platoon rally slots.
- Visible attackers threatening AI buildings take priority and may be directly targeted.
- Known enemy buildings are attacked directly only when actually visible. Otherwise aircraft fly toward last-reported coordinates using attack-move, without accessing hidden live positions.
- Before any objective is discovered, aircraft survey unexplored map sectors using AI-owned exploration memory and public terrain, avoiding recently reported defensive danger.
- No new save fields, third-party assets or paid dependencies.

## Verification

- Added `tests/ai-air-wing-v225.test.mjs` to both npm test commands and the Pages verification gate.
- A focused JavaScript runtime check passed airfield construction, paid aircraft queueing, two-aircraft cap, unseen-target safety, last-known-coordinate targeting, visible base defense, platoon separation and legacy save/load.
- The complete GitHub Actions suite, nine-scenario balance matrix and Pages deployment require separate verification against the final main commit. This document does not claim those have passed.

## Known limitations

- Aircraft still lack rearming, landing, fuel, anti-air specialization and dedicated dogfighting.
- The AI's global production queue can delay air recruitment; economy thresholds are provisional.
- Reconnaissance over defended terrain is risky and flight patrols do not yet model anti-air exposure or escort tactics.
- The 308-family asset register is a production plan, not a complete rendered atlas library.
- Real mobile browser testing and large-map aviation performance remain outstanding.
