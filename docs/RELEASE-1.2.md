# Chrono Dominion v1.2.0 — Combat, Navigation & Intelligence

**Release date:** 25 October 2026  
**Status:** Original single-player browser RTS prototype.

## Game improvements shipped

### More reliable A* navigation
- Movement orders to blocked, inaccessible terrain no longer instantly claim to have arrived merely because the destination is impassable.
- The path solver explores reachable tiles and selects the nearest accessible landing point if a clicked tile cannot be reached.
- Maintains diagonal corner restrictions so a unit cannot cut through the touching corners of lakes or 3×3 buildings.
- Orders may still require re-pathing when friendly units form a mobile blockage. This is improved fallback routing, not a full flow-field navigation system.

### Fog-aware enemy tactics
- The enemy commander may only target live hostiles presently observed by its own units, structures or recon vehicles.
- Each owned observer contributes sight radius: recon 8.1 logical tiles, structures 5.8, standard units 4.8.
- Detected enemies are added to a small *last-known contact* list. Unit sightings expire in 28 seconds; building sightings expire after 180 seconds.
- Without current sight, AI attacks the remembered **location**, not the enemy's latest hidden location.
- Unknown structures are not directly attacked until spotted.
- A contact disappears when its former position is checked and the target is confirmed gone. Hidden deaths are not revealed by looking into the enemy's live object state.
- Intelligence state is stored in locally saved skirmishes; saves made by older versions without `intel` remain compatible.

### Improved building condition and destruction feedback
- Under-construction structures show extra scaffolding and illuminated progress details, including hand-authored SVG power plants and defense turrets.
- Damaged buildings develop visible cracks and rising smoke.
- Critically damaged buildings show flickering fire.
- Structures receiving repairs emit small green sparks.
- Destruction produces a seven-piece rubble/debris burst, tracked only once for each destroyed structure.
- Unobserved particle effects are hidden behind fog, preventing accidental visual information leaks.

## Automated verification

New `tests/gameplay-v12.test.mjs` asserts:
1. Shoreline routing and never crossing an impassable barrier.
2. Reaching a nearby accessible landing point when the direct click target is unreachable.
3. No early AI access to a remote enemy command building.
4. Scout discovery, contact aging and memory persisted in browser saves.
5. No disclosure of hidden destruction until a scout witnesses the absence.
6. Building damage smoke/crack/repair effects, single-counting of destruction debris and rendering without errors.

GitHub Actions runs these tests alongside all previous release tests before deploying to Pages.

## Known limitations

- All maps are still fixed to 34×34 grid cells.
- Crowd steering does not yet offer group flow fields, traffic reservation or multi-unit avoidance through narrow choke points.
- AI scouts and pursues known locations but does not maintain a fully hierarchical squad doctrine.
- Building effects are lightweight canvas overlays. Bespoke sprite damage sheets, sound and production-quality Blender renders are pending.
- Campaign missions, multiplayer, complete faction tech trees, air/naval combat and network play remain future work.

## Proposed v1.3
- Unit traffic reservation and anti-congestion group routing.
- Better AI defensive patrols, flanking and threat prioritization.
- Full original building sprite damage/construction state atlas pipeline, engine audio controls and accessibility.
- Expanded battle/map options and player-made scenario objectives.
