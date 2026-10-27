# Chrono Dominion v2.42.0 — Sensor-Informed AI Skyguard Scaling

**27 October 2026**

The enemy AI previously capped itself at one Skyguard even after detecting a multi-aircraft attack. It now uses distinct aircraft IDs from its own recent intelligence to build up to two Skyguards: one sighting warrants one battery; two or more distinct sightings warrant two. Duplicate sightings, unseen enemies, stale contacts older than 28 seconds, future-dated reports and non-aircraft contacts do not escalate the defense.

Existing radar prerequisites, legal construction, credit reserve, power management and unfinished-battery counting are unchanged. No aircraft statistics, player commands, saved fields or original artwork changed.

Automated regression: `tests/ai-skyguard-scaling-v242.test.mjs` exercises production AI decisions, hidden targets, duplicate/recent/stale reports, construction cap, reserve, power and save/load. Registered in npm and GitHub Actions.

Remaining: test mixed anti-air formations and naturally produced AI air wings; measure actual desktop/mobile FPS; finish the production PNG atlas manifest.
