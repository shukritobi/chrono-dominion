# XL 120-unit movement and collision benchmark

**Added:** 27 October 2026. **Gameplay version:** 2.42.0 (testing only).

## Coverage

Run `npm run perf:armies` or `node tools/benchmark-large-armies.mjs --out=large-army-report.json`. The fixture uses the production `game.js` engine, Frontier Expanse (48×48), 60 additional ground units per side, legal terrain/building occupancy checks, and eight seconds of normal movement and combat updates. Strategic AI is disabled only to keep the movement workload reproducible. No resources, unit statistics, player saves, art or audio are changed.

The report records spawned/moved/live units, total entity count, real A* path calls, occupancy checks, wall time, mean, 95th-percentile and worst wall milliseconds per simulation tick. The test requires 120 spawned stress units, at least 60 to move, finite positions, exercised path/collision code and successful v1 save/load **with all stress-unit identities and positions preserved**.

## Interpretation

Wall-clock timing is environment-dependent and **not a browser frame-rate benchmark**. Headless Node tests omit DOM drawing, GPU rasterization, real touchscreen input and device thermal throttling. Compare identical fixtures and runner types before making performance claims. The absence of a hard wall-time gate avoids noisy CI failures; correctness and actual movement have hard assertions.

Follow-up: compare wall-time across repeated CI runs, profile hot paths under larger formations, and conduct desktop/mobile browser frame-time sampling before setting FPS budgets.

## First archived reference (27 October 2026)

The earlier green CI run [40531719107](https://github.com/shukritobi/chrono-dominion/actions/runs/40531719107) recorded 120/120 moving units, 811 path queries, 7,156 occupancy checks, 565.16 ms for 40 ticks (14.13 ms mean) on Node v24.21.0. This is one machine-specific observation, **not** a speed target or a measured improvement. Later runs should compare the same workload and report p95/worst-tick spikes separately from the mean.
