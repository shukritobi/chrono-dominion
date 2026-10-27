# Chrono Dominion v2.39.0: Indexed Combat Sensors

**27 October 2026**

## Gameplay performance

The existing automatic targeting rules correctly require live friendly sight, but
each candidate target previously triggered a full scan of all friendly entities.
On crowded XL maps this repeated search grows quickly as both armies expand.

During the movement/combat phase, each faction now has a temporary spatial
index of living units and buildings, using 9-tile buckets. The maximum sensor
radius is 8.1 tiles (recon), so the current and adjacent buckets always cover
all possible observers. Sensor buckets are updated when units move and when
entities are added. Live built/health checks still determine whether an
observer can see a target, including newly completed or destroyed buildings.

The index is cleared before projectiles, production and strategic AI, which
continue to use current live entity positions. No sensor ranges, target
priorities, fog-of-war rules, unit statistics, save keys, save schemas, original
assets or gameplay controls were changed.

This is an algorithmic reduction in repeated combat visibility checks, **not**
a measured improvement in FPS.

## Verification

`tests/sensor-index-v239.test.mjs` compares 40 visibility points against
the live scan on a 48×48 map with 120 remote observers. It also checks that
50 distant visibility misses avoid inspecting remote observers, sensors follow
movement within the same tick, newly added sensors are detected, unfinished
and destroyed sensors are excluded, factions do not share vision, and save/load
preserves reconnaissance without persisting transient indexes.

The test is registered in npm scripts and GitHub Actions. CI and deployment
results must be verified after the commit.

## Remaining

Measure 100+ moving-unit browser frame times on desktop and mobile. Benchmark
aircraft against Skyguard batteries, integrate original Blender-rendered
Skyguard atlases, and improve aircraft landing/service animations.
