# Chrono Dominion v2.18.0: Reachable Offensive Routes

**Development date:** 26 October 2026

## Milestones delivered

1. **Reachable strategic objectives:** After v2.17's intelligence-honest prioritization, the AI checks walkable ground connectivity before assigning primary and secondary platoon targets. It skips a valuable building if its combat force has no connected approach to the latest observed position.
2. **Actual perimeter approach locations:** The old three-location flank guess is replaced with a deterministic set of at most 36 candidate positions around a reported building. The path connectivity test follows the same 8-direction graph and anti-corner-cut restriction as A*.
3. **Assault stall recovery:** Attackers with unchanged positions for at least 18 simulated seconds can seek a different flank. Alternate orders reset stale navigation caches, and repeated checks cannot cause instant oscillation. Progress tracking is transient, resets on new matches and saves, and does not alter the established save format.
4. **Measurement and regression:** Added a targeted `tests/assault-pathing-v218.test.mjs`; wired it into npm and GitHub CI. The nine-scenario simulation now reports `casesWithAssaultLaunches` and `totalAssaultReroutes` separately from platoon formation.

## Safety and limitations

Objectives still derive from *observed AI sensor reports*; no unseen enemy location is used to invent targets. Ground connectivity is a physical navigation check and may change when structures are placed or destroyed. AI squads may still fail against unknown defenses or changing terrain; realistic human match balance is unverified.

## Release verification

CI syntax, gameplay regressions and the nine-scenario 240-second simulator must pass before merging. Compare results to v2.17 (6/9 objective discoveries, 3/9 platoon formations, 11 scouts lost, 76.1% AI coverage). The new assault metrics have no previous version baseline.
