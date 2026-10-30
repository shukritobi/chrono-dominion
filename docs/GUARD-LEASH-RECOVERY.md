# Guard leash recovery (post-v2.42)

**30 October 2026.** This is a small gameplay bug fix, not a unit-balance adjustment.

## Verified source defect

In the production combat loop, a Guard-stance ground unit more than five
tiles from its guard anchor would stop chasing a currently visible enemy,
as intended. However, while that enemy remained visible but outside the
unit's weapon range, neither the chase branch nor the no-target return
branch ran. The unit stood still instead of returning to its guard anchor.
A separate case incorrectly applied the defensive leash to an explicit
Move order, even though direct Attack and Attack-move orders were exempt.

## Change

The guard now moves toward its existing anchor if it is outside the leash
and the visible target is out of firing range. An in-range target can still
be fired upon. Explicit Move, Attack and Attack-move orders retain pursuit;
Hold-position never automatically pursues. No new saved state, faction
statistics, costs, art, production logic or hidden enemy information.

`tests/tactics.test.mjs` exercises the real simulation tick with a
sensor-visible enemy and movement interception. It covers out-of-leash
return, in-range firing, three explicit-order exceptions, Hold-position
and ordinary inside-leash pursuit.

## Acceptance and limitations

Run the existing npm check, nine-scenario ground balance matrix,
three 720-second natural matches, economy regression gate and large-army
benchmark in GitHub Actions. A passing suite demonstrates that the
specified guard transitions work without the checked regressions. It does
not establish improved Verdant refinery survival, browser FPS or
physical-device UX. Compare the new progression artifact with the last
successful main baseline before claiming any economic benefit.

## Regression-limited player scope (30 October 2026)

The first all-faction trial passed its existing economy gate, but the full
720-second natural match revealed a regression: naturally queued AI aircraft
fell from **one to zero**, despite one operational Air Command in both runs.
AI ground defender losses rose from **67 to 84** and Verdant ore income fell
from **7,560 to 7,200**. The refinery was not destroyed in the new trace,
but this tradeoff is not an acceptable unreviewed aviation regression.

The guard-anchor recovery is therefore limited to **player-owned units**.
AI-owned units retain their exact prior leash and explicit-order behavior
until a separate controlled AI-tactics change can preserve natural aviation.
The new regression test explicitly checks the AI exception. The economy
gate also now requires at least one naturally queued AI aircraft, independently
of the number of completed Air Commands. Compare the restricted CI results
against main commit `709759e61cba173ead02b0fc82d272b98dd6c786`.
