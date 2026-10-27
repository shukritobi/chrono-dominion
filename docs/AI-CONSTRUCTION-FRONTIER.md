# AI construction frontier fallback (post-v2.42)

**Date:** 27 October 2026. **Gameplay version:** 2.42.0 (targeted bugfix; no save schema or unit balance changes).

## Problem

The enemy AI selected an otherwise valid building (including its first Air Command), then tested just 48 candidate locations around its HQ. On crowded bases or constrained maps, no candidate remained. The AI did not retry from another owned structure even though `canPlace` explicitly allows construction within 8.2 tiles of **any** built friendly building. Late technology and aviation expansion could therefore stall indefinitely.

## Fix

For ordinary structures, keep the original HQ-first candidate order, then try the same bounded 48-candidate ring around each existing completed friendly building. The existing `canPlace` method still enforces terrain, spacing, map bounds and friendly construction supply. The AI pays and creates an unfinished building only after a valid site is found; if none is available, it builds nothing. When defending against a visible local invasion, turret construction retains its original nearest-frontline anchor.

No extra buildings are spawned for free, no enemy positions are exposed, and no saved fields or art are changed.

## Automated coverage

`node tests/ai-construction-frontier.test.mjs` runs each of the three factions through a powered, prerequisite-complete late-game base. It uses the production AI planner and real placement legality, restricts the HQ ring to emulate a crowded or blocked area, and leaves an actual valid site around an existing outpost. The test requires an unfinished paid Air Command to be placed at that outpost and retained after save/load.

Registered in `npm run check`, `npm test` and the GitHub Actions Pages verification gate.

## Limits and follow-up

This regression isolates construction-site selection, not a natural full-length economy simulation. It does not demonstrate that AI will reach aviation at a particular time or that air wings are competitively balanced. Next extend the nine-scenario match lab to record first AI factory/radar/airfield timestamps and run a longer natural progression sample. Browser and physical mobile testing remain pending.
