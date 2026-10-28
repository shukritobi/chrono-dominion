# Construction placement validity and rebuild recovery

**28 October 2026 · post-v2.42 targeted gameplay correction.**

## Verified source defects

The build picker validated prerequisites when a player selected a structure, but
`placeBuilding()` did not check them again when the player committed credits.
If the last required refinery or other prerequisite was destroyed or sold
while the placement ghost remained active, the player could still purchase
and construct a now-locked structure.

`canPlace()` also treated zero-health structures as occupied footprints and
valid construction anchors until the next simulation cleanup. This could
temporarily prevent rebuilding a destroyed structure or extend the build
frontier from a demolished outpost.

## Changes

- Revalidate the original `prereq()` rules immediately before charging for
  a structure. If access has disappeared, dismiss the stale placement mode
  with the existing missing-technology notification and leave credits intact.
- Show a red, invalid placement preview if a selected building loses its
  prerequisite.
- Ignore dead structures in both placement collision and friendly construction
  anchor checks. Living and unfinished structures continue to occupy their
  footprints; only living, completed friendly structures extend the frontier.
- No new save fields, new costs, altered construction times or art changes.

## Verification

`node tests/production-v17.test.mjs` covers prerequisite loss between
selection and placement, full credit preservation, successful placement after
restoring prerequisites, rebuilding on a destroyed footprint, and rejecting
construction anchored only to a dead outpost. Existing production exits,
save/load, AI economy, balance, natural progression and aviation suites
remain required in CI.

This change does not resolve the three reported Frostline loaded-harvester
stalls or naturally deployed AI aircraft. Interactive browser testing remains
a separate validation step.
