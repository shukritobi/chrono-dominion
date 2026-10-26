# Chrono Dominion v2.30.0: Emergency AI Air Withdrawal

**27 October 2026**

## Implemented

- AI Strike Aircraft at or below **30% hull** return to a built, surviving friendly Air Command even if their four-shot magazine is not empty. The player's aircraft retain manual control.
- The return uses existing airfield selection and sensor-honest return-flight detours. Enemy positions are not consulted when deciding whether to withdraw.
- Emergency servicing costs **¤0.75 per HP** and heals at **12 HP per second** at a powered airfield. Emergency sorties resume at **75% hull**, once the magazine is full.
- If the airfield is destroyed or the owner cannot afford another point of repair, the aircraft is released with its original mission restored. A **40-second cooldown** prevents immediate repeated withdrawal.
- Existing ammunition-only rearming remains unchanged, as do the local save key and schema version. New repairRetreat and existing retreatCooldownAt properties are optional on saved entities, so old saves remain valid.

## Automated coverage

- Added tests/ai-air-withdrawal-v230.test.mjs for player/AI separation, early AI retreat, paid repairs, launch threshold, mission preservation, no repairs during flight, zero-credit fallback, lost airfields, and old/new save compatibility.
- Registered the regression in npm test, npm run check and GitHub Actions.
- The existing v2.26 ammunition and v2.29 paid repair tests remain in the suite.

## Verification

The feature is committed on a development branch. GitHub Actions and Pages deployment must be checked separately. Passing CI is not a substitute for real-device gameplay and balance testing.

## Remaining

- Dedicated anti-air structures and faction-specific models; air combat balance and aircraft flight animations.
- A no-power service timeout and richer aircraft landing/takeoff animations.
- Complete rendered atlas manifest, naval warfare, campaigns, multiplayer and physical mobile testing.
