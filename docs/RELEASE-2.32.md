# Chrono Dominion v2.32.0: Dedicated Skyguard Air Defense

**27 October 2026**

## Implemented

- New **Skyguard Battery** after Radar, with faction-specific names and original animated twin-barrel vector artwork. No completed Blender sprite atlas is claimed.
- Costs ¤950, 440 HP, 45 power draw, 7.3-tile range, 32 damage per 1.2 seconds. Unlike existing turrets, it **cannot target ground units**, including through direct firing calls.
- Targeting requires shared faction sensor visibility. Unseen aircraft cannot be fired upon; power outages disable automatic firing.
- AI builds at most one battery after a recent **AI-observed** aircraft contact, using the normal paid construction system.
- Aircraft return detours account for last-known Skyguard positions. Ground scout threat penalties remain unchanged because Skyguard guns cannot attack ground targets.
- Existing local save key and schema, original assets and production art are preserved.

## Automated coverage

- `tests/anti-air-battery-v232.test.mjs` covers prerequisites, UI, air-only targeting, shared sensors, fog, projectiles, low power, AI build cap, remembered contacts, air return exposure, animated art and save/load.
- Registered in npm scripts and GitHub Actions.

## Remaining

- Confirm full CI, Pages deployment and balance. Test aircraft survival and human skirmish pacing.
- Bake original approved Blender models and atlases. Aircraft landing, dogfighting, naval warfare, campaigns, multiplayer and physical mobile testing remain unfinished.
