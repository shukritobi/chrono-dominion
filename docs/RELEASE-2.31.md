# Chrono Dominion v2.31.0: Airfield Power-Outage Recovery

**27 October 2026**

## Implemented

- Aircraft waiting at an unpowered friendly Air Command for **15 game seconds** stop servicing and recover their previous movement or attack-move order. They retain their remaining ammunition, current hull health, and original economy costs. The timeout counts only time spent at the airfield, not travel time.
- A **25-second holdoff** prevents aircraft from immediately returning to the same unpowered airfield. When faction power is restored, they can retry immediately. Repeated short outages reset the counter when power returns.
- AI emergency hull withdrawals keep their existing **40-second** cooldown after an outage timeout.
- Destroyed power plants and consumers no longer affect faction power totals during the frame in which they are destroyed.
- Existing save key and schema version remain unchanged. New `rearmPowerOutage` and `rearmRetryAt` entity fields are optional, so historical saves continue to load.

## Automated coverage

- `tests/airfield-outage-v231.test.mjs` checks power outages, timeout and holdoff, restoring power, repeated outages, no free ammunition or repairs, saved and historical service states, AI emergency withdrawal, and destroyed generators/consumers.
- Registered the new regression in `npm test`, `npm run check`, and GitHub Actions.

## Remaining

- Measure how many aircraft return to combat after power restoration in long simulations.
- Dedicated anti-air structures, faction-specific aircraft animations, rendered-atlas integration, physical mobile testing, naval warfare, campaigns and multiplayer.
