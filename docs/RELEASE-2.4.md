# Chrono Dominion v2.4.0 — Adaptive Reconnaissance

**Released:** 26 October 2026
**Project:** Original free-to-play, single-player browser RTS prototype.

## Changes shipped

### The AI remembers explored territory

- Previously, AI reconnaissance traversed a fixed list of public map-sector and ore landmarks. It could return to already surveyed routes without regard for what its units had observed.
- Each opposing unit or structure now contributes to an **AI-owned explored-cell record**, with longer survey range for recon vehicles. The AI's view is tracked separately from the human player's fog of war.
- Survey data is collected only from the locations and sight radii of living AI observers; it never reads the player's fog, uses hidden enemy positions, or reveals enemies during patrol planning.
- Surveyed cells are tracked on the existing 34 × 34 grid. Cells remain in AI memory when the observer moves away, consistent with fog-of-war exploration.
- This memory persists in the existing browser-local saved-game format as an optional `aiExplored` array. Older saves load and reconstruct presently visible ground. Invalid coordinates are discarded before use. Every new match starts with a fresh survey.

### Prioritised reconnaissance routes

- Scouts retain terrain-based sector/ore waypoints but **rank reachable destinations by the amount of unsurveyed traversable terrain** they could uncover, with a distance cost.
- Another active scout's assigned route is treated as reserved territory. Scout units avoid selecting overlapping destinations, reducing redundant scouting when multiple scouts are available.
- Candidates blocked by water/buildings or disconnected from the scout's current location are skipped using the existing A* pathfinder.
- Scouts continue to **move**, rather than automatically charging into unknown structures. Harvester-defense and threat-response logic remain in place.
- The tactical AI still attacks enemy structures only after actual sensor contact has added a building report to its normal intelligence memory.

### Tests and continuous integration

The new `tests/survey-v24.test.mjs` covers:
1. Freshly observed AI home territory without disclosing the human player's starting base.
2. Scout visibility and the separation between terrain survey and enemy-contact intelligence.
3. Distinct destinations for two active recon vehicles.
4. Preference for an unsurveyed reachable sector.
5. Save/load preserving surveyed cells while immediately discovering extra terrain currently visible after restoration.
6. Graceful support for older saves lacking the optional survey field.
7. Rejecting malformed, out-of-bounds or duplicate survey coordinates.
8. Clearing surveyed history when starting a new map.

The full verification workflow also retains the existing battle, save, economy, traffic, Map Forge, multi-platoon, retreat and reconnaissance regression suites, plus a nine-scenario 240-second headless balance laboratory with archived metrics.

## Known limitations

- AI exploration is restricted to a predetermined set of sector and ore candidates. It ranks coverage dynamically but does not yet choose any arbitrary frontier cell.
- Multiple scouts reserve only their current movement destinations, not a long-term strategic territory allocation or full multi-agent survey plan.
- Scouting vision uses circular sight radius with no elevation or occlusion by physical trees/bushes.
- This release does not add unit sprites, campaign missions, multiplayer, air/naval combat or other finished-art claims.
- Scripted scenario balance numbers are **not human win rates**, and movement or economy still needs testing across real browsers and low-end devices.

## Next priorities

1. Tactical alerts and explicit **scouting coverage / last contact** indicators for the player.
2. Squad-level flank and retreat reliability under active combat.
3. Dedicated mobile/touch usability regression tests, including selection and production.
4. The production artwork pipeline: rendered Blender tank sprites, infantry and specialist animations, and in-game asset loading verification.
