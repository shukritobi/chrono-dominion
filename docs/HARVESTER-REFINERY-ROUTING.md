# Reachable multi-refinery ore returns

**28 October 2026 · Post-v2.42 gameplay correction.**

## Verified source issue
The loaded harvester previously selected the nearest completed refinery by straight-line distance. On maps with two friendly refineries separated by impassable water or structures, it could repeatedly attempt to return to an unreachable depot while another friendly refinery was accessible. The existing deposit-selection logic already checked static reachability; return routing did not.

## Scoped correction
For **two or more operational friendly refineries**, loaded harvesters compare collision-valid unloading approaches using the existing static A* navigation. A partial path that cannot reach its approach is rejected. The shortest reachable candidate is selected, and its depot/approach is cached for six game seconds in a WeakMap rather than in saved entity data. Destroyed depots invalidate the cached choice immediately. If no approach is reachable, the previous nearest-refinery behavior is retained instead of silently discarding cargo.

A single-refinery match retains its **exact original return destination and unloading rule**. Normal ore mining, payment amounts, combat, building placement, unit stats and save formats are unchanged. This improvement is not a fix for the three previously observed Frostline Guard-unit stalls, which occur with the existing single-refinery economy and still need investigation.

## Verification
`node tests/ore-reachability-v22.test.mjs` covers a river-isolated nearer depot, actual return movement target, cache invalidation, newly available depots, enemy depot exclusion, single-refinery compatibility and prior ore/save cases. The GitHub Actions workflow already runs this test, the nine-scenario balance lab, three 720-second natural matches and the economy regression guard. Do not claim improved natural-match ore income without comparing those CI reports. Real-device interaction remains unverified.
