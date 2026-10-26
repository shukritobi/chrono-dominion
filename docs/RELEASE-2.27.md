# Chrono Dominion v2.27.0: Sensor-Honest Air Defense

**26 October 2026**

## Implemented

- Existing Sentry Turrets and Energy Towers prioritise visible hostile Strike Aircraft over closer ground units. If no aircraft is detected, they retain their normal nearest-ground-target behavior.
- Defenses now require real allied sensor coverage to acquire any hostile unit. This closes a fog-of-war leak where a tower could shoot an unseen enemy inside weapon range.
- Allied scouts and other units can reveal aircraft for a tower without granting knowledge of hidden units.
- Energy Towers deal 50% extra damage to aircraft; ground damage, firing cadence, power usage and structure prices are unchanged. Sentry Turrets keep their normal damage.
- Existing save key/schema, units, artwork, and build prerequisites are unchanged.

## Automated coverage

- New `tests/air-defense-v227.test.mjs` covers air-first selection, unseen aircraft exclusion, allied reconnaissance spotting, both players' defense behavior, aircraft-specific damage, low-power inhibition, the real combat step and save/load.
- The test is registered in `npm run check`, `npm test`, and the GitHub Actions verification gate.
- GitHub Actions and live deployment must be checked for the final commit; test registration is not proof of a pass.

## Known limits

- This is a dual-role targeting improvement, not a separate dedicated anti-air building.
- Aircraft have no evasive maneuvers, countermeasures, fuel system or individual landing slots.
- Air balance and objective effectiveness require repeatable simulations and real browser playtests.
