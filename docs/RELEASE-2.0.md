# Chrono Dominion v2.0.0 — AI Reinforcements and Retreats

**Released:** 26 October 2026  
**Game:** Original free-to-play browser RTS prototype, single-player skirmish.

## Completed features

### An independent support platoon

- The AI may create a **second persistent platoon** from extra available combat troops after forming its main offensive squad.
- The support platoon does not take members already committed to the main squad, harvesters, independent recon vehicles, or actively withdrawing wounded troops.
- Each support platoon has independent membership, distinct rally slots, an objective based on the opponent's **last scouted building location**, and persistent `rally` and `assault` phases.
- It favors a different known structure objective from the primary force when more than one discovered building report exists.
- Support staging is deliberately offset to the side of the main attack line. Units do not receive assault orders until a sufficient share of members have assembled (75%, or a majority after a 20-second staging timeout).
- Existing A*, lane reservations, friendly yielding and flank-route constraints govern movement.
- The feature does **not** grant the enemy knowledge of unscouted structures or hidden mobile units.

### Wounded-unit retreat

- Combat units on the AI side with **28% health or less** may retreat if an enemy unit is actually visible within nearby combat distance.
- The retreat chooses land close to a surviving friendly structure, while requiring that the destination is reachable and farther from the observed threat.
- Units marked as retreating temporarily prioritize that movement order over opportunistic combat acquisition. Their original offensive platoon no longer counts them as a ready fighter.
- Retreat lasts up to 18 seconds, followed by a bounded 44-second cooldown so badly damaged units don't oscillate between withdrawal and attack every strategy update.
- **No free repairs or healing** are applied; retreat is a positioning tactic only.

### Saved games and safety

- A new optional `aiSupportPlatoon` field records the support formation's phase, member IDs, target report and rally slots within the existing browser-local save snapshot.
- Old v1.9 and earlier snapshots without support data still load.
- Invalid support records are discarded; support plans with member overlap against the main platoon are rejected.
- Individual retreat orders and cooldown timestamps persist as regular entity fields.

## Automated verification

`tests/multi-platoon-v20.test.mjs` validates:
- No scouting report means no attack plan.
- The first and second squads don't share unit IDs.
- The secondary squad maintains its own rally orders across AI ticks and advances after gathering.
- Both squads survive a save/load round trip.
- Missing or malformed support-squad snapshots fail gracefully.
- Retreat requires visible danger and critically low health.
- Wounded units receive reachable withdrawal orders, are temporarily withheld from attacks, are not automatically healed, and have a retreat cooldown.

The earlier platoon, fog-of-war, movement, economy, Map Forge, sound, skirmish, production and collision regression suites remain gating checks in GitHub Actions.

## Known limitations

- The maximum offensive grouping is currently one primary plus one support platoon; it is not a general hierarchical AI command system.
- Retreating units don't find healing stations or receive a complete casualty evacuation flow.
- Support movements use last-known enemy building reports, not a probabilistic search model or a full front-line planner.
- Mobile/tablet usability, sound mixing and tactical balance need playtesting.
- Campaign missions, network multiplayer, full air/naval forces and production-quality rendered directional infantry/recon sprites remain unfinished.

## Suggested next milestones

1. Full battle simulation playtests across all maps and difficulty settings, with AI performance balancing.
2. Squad focus-fire, target prioritization and reinforcement routing across alternate routes.
3. Original 8-direction infantry/recon motion atlases and Blender vehicle render validation.
4. More faction-specific build-tree content and scenario objectives.
