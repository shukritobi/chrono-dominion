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

## Per-tick A* and collision attribution (28 October 2026)

The same 120-unit, 40-tick production-engine fixture now records `tickProfile`
for **every** simulation tick: 1-based tick number, elapsed simulated seconds,
wall milliseconds, number of real `findPath()` calls, number of
`canOccupyUnit()` probes, and wall milliseconds spent inside A* calls.
The five slowest ticks are separately listed in `slowestTicks`, with total
`pathTimeMs`, `pathTimeSharePercent`, `ticksWithPathQueries`,
`maxPathQueriesPerTick` and `maxOccupancyChecksPerTick`.

This is **measurement only**, not a pathfinding speedup. A* duration is measured
with `performance.now()` around the real pathfinder; it includes its own
collision/navigation work and instrumentation overhead. Do **not** add
`pathTimeMs` to total wall time, and do not equate it with browser FPS or
treat high query counts alone as proof of a bottleneck. Report timings are
rounded to hundredths of a millisecond, so summing rounded per-tick values
can differ slightly from the rounded totals.

The automated regression reconciles all per-tick path and occupancy counts
with their exact overall totals, verifies the worst-tick ranking and valid
A* time attribution, and preserves the existing 120-unit movement and save/load
assertions. It intentionally imposes **no machine-specific timing threshold**.
Use several comparable CI artifacts to see whether slow ticks correlate with
repath bursts before changing movement scheduling. Follow with browser frame
profiling on desktop and mobile hardware.
