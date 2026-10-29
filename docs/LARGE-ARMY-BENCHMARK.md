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


## Routine move-order path refresh staggering (28 October 2026)

The first profiling run found periodic A* bursts at ticks 1, 10, 19, 28 and
37 of the 120-unit fixture. Source inspection shows that every new ground
move order computes its first route immediately and then sets the same
`pathRecheck=1.6` timer. With the fixture's 0.2-second step, many units
therefore reach the periodic refresh together. This is a concrete timer
synchronization mechanism; whether it explains every slow tick still needs
a matched post-change benchmark.

A narrowly scoped runtime change retains **immediate first-path computation**
and the existing **1.6-second ongoing refresh interval**, but offsets the
first *routine* refresh by `(unit.id % 4) * 0.2` seconds for newly ordered
**player-controlled** ordinary ground movers. This spreads their next scheduled A* refresh across
four simulation ticks without adding saved fields or random state. It does
not stagger AI units, loaded or empty harvesters, reconnaissance,
combat/attack-move orders, traffic-priced recovery, or a changed destination. Their original
immediate route changes and timers remain intact.

The navigation regression checks that four distinct movers calculate
initial routes immediately, later refresh across multiple ticks, and do
not suppress subsequent refreshes. It also checks urgent navigation
exceptions, destination changes and the existing save/load path.

**Acceptance:** compare `tickProfile` path-query counts and slow-tick A*
time against the same 120-unit CI fixture, then run the nine-scenario
balance matrix, three 720-second natural matches, economy regression gate
and aviation laboratory before merging. CI runner timing is not browser
FPS, and staggering is not a guaranteed end-to-end speedup.

### Failed broad trial and narrower retest

The first branch CI run [40669822587](https://github.com/shukritobi/chrono-dominion/actions/runs/40669822587) **failed** the AI economy regression gate: Desert enemy ore income dropped to 10,800 versus the 15,120 reference (below the required 80% floor); aggregate delivery ticks fell to 65. This broad player+AI staggering experiment was **not merged**. The revised experiment excludes all AI-owned units, preserving their existing movement timers. It still requires full CI verification before any merge; a player-only change is not automatically safe for contested matches.

## Eight-way octile A* heuristic trial (28 October 2026)

The existing A* expanded nodes using Euclidean distance to the destination even
though its permitted moves cost 1 orthogonally and √2 diagonally. The proposed
heuristic uses the tighter octile lower bound `max(dx,dy) + (√2−1) min(dx,dy)`.
It remains admissible and consistent for this grid, including nonnegative
traffic and hazard penalties. The search still computes first paths immediately,
keeps the existing nearest-partial-route fallback, and preserves corner checks.
No unit statistics, saved fields, orders, art or AI policy are changed.

A new XL pathfinding regression exercises a two-gate barrier both without
hazards and with a prohibitively expensive short gate. The existing serpentine,
partial-route, corner, movement and save tests remain in place. Measure path
processing and the 120-unit fixture in CI; do not infer browser FPS from Node
wall times, or merge if the natural-match economy gate regresses.

### CI rejection and scoped follow-up

The first octile trial [40677047032](https://github.com/shukritobi/chrono-dominion/actions/runs/40677047032)
passed navigation tests but failed the **nine-scenario balance gate**:
Ashen Basin AI ore deliveries fell below the scenario's minimum. That broad
change was **not merged**. The revised trial explicitly opts into octile only
for ordinary player-owned ground move orders. Enemy AI, harvesters, recon,
attack-move, traffic-recovery and all standalone path queries retain the
original Euclidean heuristic. New navigation tests assert the opt-in boundary.
The revised trial must pass the full balance and progression gates before merge.

## Packed A* search-node keys (28 October 2026)

The 120-unit benchmark attributes a substantial fraction of headless simulation
work to A*. The pathfinder formerly allocated a `"x,y"` string for every
candidate node, then split those strings while reconstructing each route.
Because A* grid nodes are integer coordinates within the current 34×34 or
48×48 map, the internal `costs`, `came` and `closed` maps can instead use
the collision-free integer `y * WORLD_SIZE + x`. Route reconstruction uses
integer remainder and division. This does **not** change the heuristic,
priority ordering, traffic/hazard weights, passability cache, corner rules,
expansion cap, partial-route fallback, unit orders or serialized save data.

The existing XL serpentine, weighted-gate, unreachable-goal and historical-save
regressions remain in place. Additional tests route between opposite grid
edges on both map sizes and require every reconstructed waypoint to stay
inside the legal battlefield and adjacent to its predecessor, guarding against
row-wrap errors. The full balance, progression, economy and aviation gates
must pass before merging. The expected reduction in string allocation is a
source-level hypothesis: compare matched repeated benchmarks before claiming
faster A* or improved browser FPS.

## Packed navigation passability-cache keys (28 October 2026)

The production A* pathfinder already uses packed integer node IDs, but
`navigationWalk()` still built a separate per-request building-footprint set
and passability cache using allocated `"x,y"` strings. Each of the 120
initial path requests independently creates these navigation caches.

The navigation helper now uses `y * WORLD_SIZE + x` for integer tiles inside
the active 34×34 or 48×48 battlefield. Fractional and out-of-grid probes
retain string keys so custom `walkable()` hooks and non-grid callers retain
their previous caching behavior. Each request still builds its own cache:
there is **no cross-query sharing**, no stale building snapshot, and no
change to terrain rules, building footprint geometry, corner clipping,
path weights, A* heap ordering, unit orders, or save data.

The extended `tests/path-query-cache-v236.test.mjs` compares every tile in
the XL grid with the live `walkable()` result, including fractional building
coordinates, water, destroyed and relocated structures. It separately checks
fractional/out-of-grid custom-hook cache identity. Existing pathfinding,
traffic, economic progression and aviation tests remain the regression gates.

**Performance claim boundary:** fewer string keys are constructed in this
source path, but no browser FPS or reliable end-to-end speedup is established.
The first-tick 120-unit A* burst still exists; this change reduces the
per-query allocation cost rather than delaying initial orders. Compare
matched benchmark runs before claiming a measurable improvement.

## Packed congestion heat-map keys (28 October 2026)

The previous A* numeric-node conversion deliberately retained string lookups
for congestion heat: `trafficCosts()` built a map of `"x,y"` strings, and
each weighted A* neighbor constructed another string to retrieve its penalty.
That mismatch was necessary to avoid silently losing congestion pricing during
the earlier packed-node trial, but continued allocating strings during traffic
recovery. This change packs **legal integer grid cells** as
`y * WORLD_SIZE + x` in both the heat-map producer and A* consumer.
Out-of-grid heat-map entries retain their original string keys to avoid row
aliasing; A* never requests those entries because `navigationWalk()` rejects
them. Costs, the 18-point cap, air-unit exclusion, corner rules and all
non-congestion pathfinding remain unchanged.

`tests/navigation-v15.test.mjs` independently rebuilds the old string-keyed
heat map on both 34×34 and 48×48 maps, compares every playable tile's exact
penalty with the packed map, exercises overlapping ground traffic and a
near-border blocker, and verifies that weighted A* still produces a route.
The existing traffic-detour, navigation, save/load, nine-scenario balance,
extended AI progression and economy gates must pass before merging.

**Scope:** This removes coordinate-string creation from traffic-priced A*
neighbor probes, not the ordinary first-path calculation. It should not be
reported as a solution to the 124-query initial routing burst or a measured
FPS improvement without controlled browser benchmarks. Traffic pricing only
runs when a unit requests congestion recovery.

## Clear-corridor octile fast path (29 October 2026)

Ordinary **player-owned move** routes already opt into the octile A* heuristic.
When such a query has no traffic or hazard weighting, the engine first probes
a diagonal-then-straight grid corridor. If every destination tile and both
shoulders of each diagonal step are walkable, this route is exactly the
obstacle-free octile lower bound, so no A* heap or search-node maps are needed.
If **any** step or corner is blocked, the full original A* runs unchanged,
including reachable-partial-route fallback. Each query builds a fresh
walkability snapshot; building destruction, water and custom walkable hooks
are never cached across requests.

This is intentionally **not** enabled for AI, harvesters, reconnaissance,
attack-move, direct combat pursuit, traffic-priced recovery, or
hazard-weighted queries. The original save schema, movement collision checks,
unit orders and costs are unchanged. The XL navigation regression tests open
corridors, blocked diagonal shoulders, weighted hazards and legacy callers.
The 120-unit report now includes `directRouteAttempts` and
`directRouteHits` so the experiment can be measured instead of inferred.
A successful fast-path hit reduces *per-query A* work*, **not the number of
initial movement orders**: the 124-query first-tick burst is not eliminated.
Compare matched CI benchmark artifacts and economy gates before claiming a
measured speedup or browser FPS benefit.

## Alternate optimal clear-corridor ordering (29 October 2026)

The player-only, unweighted octile shortcut previously tested only a diagonal-first corridor. An obstacle on that corridor could force full A* even when a different, equally short straight-first corridor was unobstructed. The shortcut now checks the original diagonal-first route first, then tries the straight-first octile ordering **only if both axes differ and the first route is blocked**. Every visited tile and both diagonal shoulders are checked against the same fresh walkability snapshot. If both routes are blocked, normal A* retains its full obstacle detour and partial-path behavior. Equal-axis and single-axis paths do not repeat an identical attempt.

Weighted paths, AI, harvesters, reconnaissance, combat, traffic recovery, saved fields and unit costs remain unchanged. The XL regression covers X-major and Y-major alternatives, exact octile step counts, corner safety, two-blocker fallback, weighted-route exclusions and legacy save/load. The 120-unit benchmark already records direct-route attempts/hits; increased real-world hit rate is **not established** until its results are inspected. This does not eliminate the initial 124 movement orders or establish browser FPS improvement.

## Balanced optimal player-route corridor (29 October 2026)

After the diagonal-first and straight-first clear-route shortcuts, ordinary
player move orders now try one **balanced** arrangement of the same number of
orthogonal and diagonal steps before falling back to A*. It remains an exact
minimum-cost octile route and checks every destination tile and both shoulders
of every diagonal. This is intentionally limited to the existing unweighted,
non-traffic player move shortcut: AI, harvesters, recon, attack-move, weighted
hazards and traffic recovery continue to use their established routing.

The XL navigation regression places separate obstacles in the two edge
corridors while leaving the balanced corridor open, then verifies its optimal
length and corner safety. It also checks the A* fallback when all three
corridors fail, and preserves legacy save/load tests. The 120-unit benchmark
now records shortcut attempts and hits **per tick**, so the initial 124-query
burst can be separated into cheap successful shortcuts and full A* fallbacks.
Total path request count is not expected to drop merely because a request
uses the shortcut. Compare CI artifacts before claiming a measured speedup;
headless Node timings are not browser FPS.

## Narrow AI ordinary-move direct-route trial (29 October 2026)

The initial 120-unit benchmark has 124 path queries in tick one, but only
60 eligible player shortcut attempts; most other initial requests are AI
ordinary move orders. This trial permits **AI ordinary ground move** orders
to use the same collision-checked exact-cost direct corridor. Crucially,
when the corridor is blocked, the AI continues to use its existing **Euclidean
A*** heuristic and its existing partial-path fallback, not the octile A*
heuristic that previously caused a natural-match economic regression.
Harvester, recon, attack-move, traffic-priced and weighted routes remain
excluded. The regression checks AI opt-in, harvester/combat exclusion and
identical Euclidean fallback. Only merge if the complete economy, progression,
aviation and XL tests pass. More shortcut hits do not necessarily imply lower
wall time or fewer path requests; use the per-tick counts and matched CI
reports to interpret the effect.
