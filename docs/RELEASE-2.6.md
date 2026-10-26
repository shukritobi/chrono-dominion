# Chrono Dominion v2.6.0 — Tactical Event History

**Release date:** 26 October 2026

## New gameplay feedback

- An expandable **TACTICAL EVENTS** panel sits beneath the player reconnaissance HUD. It starts collapsed to preserve battlefield space, including on narrow touch screens.
- Incoming projectile and Federation Arc damage to a **friendly building** creates a time-stamped under-attack event. Repeated hits to the same building are throttled for 18 seconds; crossing the 30% HP threshold generates a distinct critical warning.
- Destroyed friendly structures create a separate loss event. Selling a building is not treated as a combat loss.
- Existing proximity alerts are also written to the history, but only after the player's own observers actually see the enemy contact.
- Each event can center the camera on the recorded friendly building or previously sighted threat location. The log never exposes a hidden attacker's live position.
- The most recent 12 events are retained. The expanded list displays up to eight, with a clock and accessible buttons. The UI escapes all event text.
- Event history is saved with the existing `chrono-dominion-skirmish-v1` snapshot, validated on load, and cleared when a new match starts. Older saves without the field remain supported. Damage-alert throttles are reconstructed from recent saved events.

## Regression coverage

`tests/events-v26.test.mjs` exercises projectile impact, rate limits, critical and destroyed states, player-side threat reports, map jumps, save/load, legacy saves, bounded history and HTML escaping. Both `npm test` and GitHub Actions include the new test.

**Verification note:** Automated tests are not equivalent to hands-on mobile or long-session browser testing. Check the latest GitHub Actions run for the deployment result.

## Still unfinished

1. Production-quality original animated sprites and packed render atlases; the rendered atlas manifest remains empty.
2. Touch-first HUD and radar accessibility, plus compact-screen gameplay testing.
3. AI exploration beyond preset sector landmarks and improved offensive squad survival.
4. Aircraft, naval units, campaigns, multiplayer and other full-game features.
