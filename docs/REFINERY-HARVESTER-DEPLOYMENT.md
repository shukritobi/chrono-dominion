# Collision-safe included refinery harvesters

**28 October 2026 · post-v2.42 gameplay correction · save version remains 1.**

## Source finding

A refinery that finished construction created its included harvester at a fixed
`refinery.x + 2, refinery.y + 1` position without checking water, building
footprints or nearby units. The paid production queue already had a collision-
checked exit search, but the free refinery-completion worker bypassed it.
On custom maps or crowded bases this could spawn a worker into an obstacle,
prevent it from moving, or overlap another unit.

## Scoped implementation

`deployRefineryHarvester()` preserves the original (+2,+1) spawn exactly when
its center, footprint and at least one exit step are safe. Otherwise it uses
`findProductionExit()`, the same tested search used for paid units.

If **no** legal exit exists, the completed refinery records
`pendingHarvester=true` and retries no more often than once every 0.8 game
seconds. This is a single included worker, not a free recurring income source:
successful deployment clears the flag, sets the normal `harvest` order and
does not deduct credits. A destroyed refinery cannot deploy a pending worker.

The pending flag is stored on the existing refinery entity and survives the
existing v1 save/load serialization. No save version, construction cost,
harvester statistics, art or production queue schema changes.

## Regression and limits

`tests/production-v17.test.mjs` checks both factions' original clear offset,
a blocked shoreline offset, collision-safe fallback, unchanged credits, a
fully enclosed refinery, persistence through save/load, delayed recovery and
exactly-once deployment. GitHub Actions also runs the complete gameplay suite,
nine-scenario balance matrix, three natural 720-second matches and AI economy
regression guard.

This is **not** a claim that the three Frostline Guard-unit traffic stalls or
natural AI aircraft production have been resolved. Interactive mobile/desktop
visual QA and maps with highly dynamic crowds remain separate verification.
