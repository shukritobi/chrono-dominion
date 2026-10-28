# Alternate production exits for multiple factories and Air Commands

**28 October 2026 · post-v2.42 gameplay fix.**

## Problem

A completed, paid unit queue previously used only the single preferred
factory, barracks, refinery or Air Command. When that building's nine-ring
deployment search found no safe exit, the queue stayed at 100% with
`blockedReason='exit'` even if another completed, friendly producer of the
same kind had a legal deployment area. The order was not lost, but could be
stranded indefinitely during large battles or crowded-base play.

## Change

The original preferred producer is still tried first, with the original
collision, footprint, water and escape checks. **Only if that producer has
no legal exit**, the game tries other living, completed, friendly producers
of the required building kind, in deterministic proximity-to-home order.
Enemy buildings, unfinished structures and different producer types are
excluded. A deployment consumes the original queue once, with no additional
cost or faster construction; when every exit is blocked, the existing
`exit` warning, retry delay and cancel/refund behavior remain intact.

No new save fields, assets, unit statistics, power rules, or AI funding
priorities are introduced.

## Verification

`node tests/production-v17.test.mjs` covers a blocked primary factory with
a clear secondary factory, enemy and unfinished producers, preservation of
the paid queue through v1 save/load, and the same fallback for aircraft
between two Air Commands. The existing production, economy, progression and
aviation tests remain mandatory CI gates.

This is not a correction for the three observed Frostline harvester stalls
or a guarantee that contested AI matches will naturally build aircraft.
Interactive desktop/mobile validation and large-battle frame timings remain
outstanding.
