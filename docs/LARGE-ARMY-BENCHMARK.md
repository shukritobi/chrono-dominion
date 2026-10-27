# XL 120-unit movement and collision benchmark

**Added:** 27 October 2026. **Gameplay version:** 2.42.0 (testing only).

## Coverage

Run `npm run perf:armies` or `node tools/benchmark-large-armies.mjs --out=large-army-report.json`. The fixture uses the production `game.js` engine, Frontier Expanse (48×48), 60 additional ground units per side, legal terrain/building occupancy checks, and eight seconds of normal movement and combat updates. Strategic AI is disabled only to keep the movement workload reproducible. No resources, unit statistics, player saves, art or audio are changed.

The report records spawned/moved/live units, total entity count, real A* path calls, occupancy checks, wall time and mean wall milliseconds per simulation tick. The test requires 120 spawned stress units, at least 60 to move, finite positions, exercised path/collision code and successful v1 save/load of the resulting army.

## Interpretation

Wall-clock timing is environment-dependent and **not a browser frame-rate benchmark**. Headless Node tests omit DOM drawing, GPU rasterization, real touchscreen input and device thermal throttling. Compare identical fixtures and runner types before making performance claims. The absence of a hard wall-time gate avoids noisy CI failures; correctness and actual movement have hard assertions.

Follow-up: compare wall-time across repeated CI runs, profile hot paths under larger formations, and conduct desktop/mobile browser frame-time sampling before setting FPS budgets.
