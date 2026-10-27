# Chrono Dominion v2.40.0: Aircraft Landing and Service Animation

**27 October 2026**

## Implemented

Aircraft returning to an operational friendly Air Command now visibly descend
into a service position. Landing and takeoff blend over approximately 1.1 and
0.8 game seconds respectively, rather than abruptly switching altitude.
Both original Blender-baked aircraft atlases and the procedural vector fallback
receive the same transition. The vector version extends landing gear and dims
its engines; a pulsing ground halo indicates active servicing.

A plane is visually docked only when its actual rearming assignment points to
a living, built, friendly airfield within the existing 1.7-tile service radius.
An aircraft flying home, an invalid airfield, or a destroyed airfield never
receives a false docked state. Animation is stored in a WeakMap keyed to live
entity objects, so it does not modify saves or require migrations.

No gameplay changes: ordnance timing, paid hull repair, power outages, return
routing, AI withdrawal, damage and faction statistics are unchanged.

## Verification

`tests/aircraft-service-visual-v240.test.mjs` checks progressive touchdown
and takeoff, invalid and destroyed pads, save compatibility, baked atlas
vertical displacement, unaffected infantry and vector aircraft descent.
Registered in both npm scripts and the GitHub Actions verification gate.

Automated checks cannot replace live visual inspection on desktop and touch
devices. Verify sprite/pad overlap and readable health bars in a browser.

## Remaining

Measure FPS with 100+ units on desktop and mobile; benchmark Skyguard survival,
finish Blender-rendered Skyguard atlases and expand faction tactics.
