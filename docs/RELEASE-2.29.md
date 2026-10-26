# Chrono Dominion v2.29.0: Aircraft Hull Service

**27 October 2026**

## Implemented

- A damaged Strike Aircraft now repairs while rearming within 1.7 tiles of a powered, built, surviving friendly Air Command.
- Repairs restore up to 12 HP per game second at ¤0.75 per HP, limited by the aircraft's missing health and its owner's available credits. Credits never go negative.
- Low power pauses both rearming and repairs. Insufficient credits pause repairs only; ammunition still reloads.
- A full-ammo aircraft does not return solely to repair. Once ammunition is replenished, its saved mission resumes, even if repairs were only partial.
- Destroyed airfields continue to release their assigned aircraft. The feature introduces no new save fields, modifies no art, and preserves the original browser save key.

## Verification

- Added `tests/aircraft-repair-v229.test.mjs` for paid and capped healing, low-power behavior, no healing in flight, credit exhaustion, AI ownership, mission resumption, destroyed airfields and legacy save compatibility.
- Registered the regression in `npm test`, `npm run check`, and the GitHub Actions verification workflow.
- In-memory JavaScript preflight exercised the modified service method before commit. Full CI and public deployment must be verified separately.

## Remaining

- Aircraft do not proactively return for repairs with ammunition still available; that would require an explicit player order and AI risk logic.
- No landing animation, fuel, dogfighting, dedicated anti-air building, naval combat, campaign, multiplayer, or physical mobile-device validation.
