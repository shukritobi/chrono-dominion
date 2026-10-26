# Chrono Dominion v2.17.0: Strategic AI Attack Objectives

**Development date:** 26 October 2026

## Implemented

- Offensive primary platoons now choose among actually detected enemy buildings using strategic value, distance, contact age and last-known defensive threat rather than merely newest intel.
- Support squads penalize duplicating the primary objective when another reported high-value objective exists, but can converge on the only known structure.
- Support recruitment now honors `retreatCooldownAt` as well as the active retreat timer. Wounded or recovering combat troops are not sent straight back into a second assault.
- Targets use AI sensor intelligence only, without live hidden enemy positions, human fog or hardcoded enemy spawns. The original save key and schema remain untouched.
- Added `tests/objective-ranking-v217.test.mjs` to npm check/test and GitHub Actions verification, and synchronized runtime, UI, package and simulation-report versions.

## Verification

The new regression checks strategic ranking, report expiry, malformed contacts, no hidden-object information leaks, support diversification, cooldown eligibility and save/load. Benchmark full nine-scenario CI against earlier versions before claiming improved wins or destruction rates.

## Outstanding

Some high-value structures may be behind inaccessible terrain. Real browser/mobile testing and final PNG sprites, aircraft, naval, missions and multiplayer remain incomplete.
