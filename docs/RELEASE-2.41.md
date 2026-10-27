# Chrono Dominion v2.41.0: Fog-of-War Visibility Parity

**27 October 2026**

## Implemented

Fixed two visibility discrepancies found by inspecting the live game source.
Unfinished friendly buildings were incorrectly contributing a full 5.8-tile
vision radius to the player's explored fog even though combat detection
correctly required a completed structure. The fog update now ignores unbuilt
buildings. Completed buildings still provide sight and destroyed structures
stop doing so; previously explored tiles remain remembered.

The fog grid samples integer tile positions, so an enemy near a tile's far
edge could appear on the battlefield, radar and selection hit-test despite
being beyond every actual friendly sensor. Enemy rendering and interaction
now require both a visible fog tile and the same live sensor check used by
automatic targeting. Battlefield and radar use one shared per-frame set of
verified enemy IDs, avoiding a second sensor scan for the minimap.

## Verification

`tests/fog-visibility-v241.test.mjs` covers unfinished, completed and
destroyed sensors; faction ownership; fractional edge-of-sight enemies;
click selection, battlefield rendering and radar; and save/load retention
of explored terrain. Registered in npm and GitHub Actions verification.

No save schema, unit statistics, player orders or original assets changed.
This test is deterministic Node simulation, not a physical browser/mobile
visual check. Verify actual fog and radar rendering on devices separately.

## Remaining

Profile 100+ units on real mobile devices, benchmark aircraft/Skyguard
balance, complete original Blender-rendered Skyguard sprites, and improve
faction-specific AI tactics.
