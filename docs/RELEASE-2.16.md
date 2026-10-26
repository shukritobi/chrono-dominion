# Chrono Dominion v2.16.0: Combat Unit Veterancy

**Development date:** 26 October 2026

## Implemented

- Combat units earn one promotion to Veteran at 2 confirmed kills and another to Elite at 5 confirmed kills. Harvesters and structures do not receive combat ranks.
- Damage, movement speed and attack interval bonuses are deterministic: Veteran deals +12% damage, moves +6% faster and reloads 7% sooner; Elite deals +25% damage, moves +12% faster and reloads 15% sooner. Promotions never heal units or increase maximum health.
- Promotions are credited only on lethal projectile impact or lethal damage-dealing specialist ability. Shooter ownership must still match the launched projectile's side.
- The unit selection panel exposes rank, confirmed kills and active combat bonuses. One or two stars identify units with promotions at the normal battlefield zoom.
- Existing save schema/version and storage key are preserved. The historic unit `kills` field determines rank, so older saves remain Recruit and promoted units keep their rank upon loading.
- Added `tests/veterancy-v216.test.mjs` to both npm test/check scripts and the Pages CI gate.

## Verification and limitations

Targeted tests cover ordinary kills, thresholds, stat changes, displayed rank and save migration. GitHub Actions and the nine-scenario balance matrix must be checked after committing. This does not implement weapon upgrade trees, shared experience, aircraft/naval units, campaigns or multiplayer.
