# Chrono Dominion v2.1 — Tactical Focus Fire

**Release date:** 26 October 2026  
**Game status:** Playable, original, free-to-play single-player browser RTS prototype.

## Implemented in this milestone

### Coordinated enemy target selection
- Enemy combat units now share a tactical target-assignment pass, rather than each independently selecting a nearby target and overwriting defensive orders.
- The defender pass handles multiple **actually observed base raiders**. Nearby responders are assigned to each threat, at most two in the first defense pass, without assigning the same defender twice.
- Fighters not committed to defending the base select nearby **visible enemy units**, prioritizing dangerous contacts and damaged targets while penalizing excessive projected firepower against enemies already expected to be defeated.
- The planner does not modify the existing player control model, primary platoon staging, support platoon staging, or reconnaissance route definitions.
- The same target-selection logic works across all three factions because it uses the existing faction-balanced weapon definitions.

### Honest line-of-sight pursuit
- AI units release direct attack locks when the target can no longer be detected through the AI's active friendly sight radius.
- Their automatic target-acquisition pass also requires real enemy visibility, avoiding knowledge of a hidden enemy's current position.
- Player-selected units and explicit player attack commands retain their normal mechanics.
- Target allocations are recomputed from current observed combat information. There is **no new fragile state** to serialize in saved games.

### Recovery for heavily damaged troops
- Critically wounded fighters already retreat when threatened by **visible enemies**. They now remain out of offensive platoons for the remainder of their existing recovery cooldown if still below 36% health, rather than immediately being assigned to another attack at the end of the initial 18-second withdrawal.
- They do not receive free healing or a new regenerative ability. The existing battle economy and building repair remain unchanged.
- Units can become eligible again after their cooldown, allowing future scenario mechanics to provide healing or other recovery systems.

## Automated checks
- New `tests/targeting-v21.test.mjs` checks unobserved enemy immunity from AI attack orders, multiple independent base defenders, one-order-per-fighter assignments, retreat exclusions, fog-of-war pursuit, and save/load compatibility.
- `tests/multi-platoon-v20.test.mjs` now verifies the extended cooldown reserve and eventual eligibility.
- GitHub Actions continues to run the earlier unit, artillery, skirmish, faction, traffic, lane, map and AI regression suites before deploying.

## Current limitations
- This is a local two-platoon target coordination system, not a general-purpose RTS strategic battle planner.
- Damage estimates for targeting are approximate; projectile travel time, friendly interception and moving-target evasion are not simulated in the tactical assignment score.
- AI targeting still operates in range-limited local contact windows, not long-range combined arms or full strategic front-line optimization.
- The game remains a prototype without campaigns, multiplayer, a complete air/naval tech tree or production-grade rendered directional sprite atlases.

## Proposed v2.2
1. Realistic full-match simulation tests across all three terrain layouts and difficulty tiers.
2. Better infantry and specialist sprite atlases with actual walking/idle frames.
3. Battlefield battle-report breakdown by unit classes and tactical decisions.
4. Improved mobile/touch unit controls.
