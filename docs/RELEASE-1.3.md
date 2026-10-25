# Chrono Dominion v1.3 — Tactical Squads, Flanking & Sound

Release: 25 October 2026. Original single-player browser RTS prototype.

## Playable upgrades

### Connected squad formations
- Group move/attack-move now places units on **different walkable cells in the connected region** of the selected army.
- A breadth-first traversal from the squad's centre identifies terrain reachable without clipping through diagonally touching water tiles or buildings.
- Candidate formation slots are sorted by proximity to the selected destination. Units are assigned to distinct slots, reducing the number of troops trying to stand on one square.
- If a tiny island contains fewer free tiles than selected troops, excess units stop rather than receiving unreachable positions.
- No change to the underlying 34×34 fixed grid or faction roster.
- *Limitation*: this is terrain-connected destination assignment, not full time-coordinated crowd steering. Tight passages can still cause temporary jams.

### AI flanking of known targets
- When attacking a previously scouted enemy structure, the AI attempts to route a fighting unit to an **offset approach waypoint** rather than blindly attacking the enemy's last-known coordinates.
- Opposite squad IDs approach from opposite sides when routes are possible.
- Flank waypoints must have a **complete reachable A* route**, not merely a walkable endpoint. The AI keeps an issued waypoint until the unit reaches it instead of reselecting a different flank every AI tick.
- This retains v1.2's fog-of-war rules: the AI only uses discovered enemy contact locations and does not inspect hidden current target positions.

### Optional original battle sound effects
- New **♪ OFF / ♪ ON** button in the top bar. Sound is **off by default**, persists as a simple browser-local preference and can be switched off again at any time.
- Sounds are synthesized on the device using the browser's Web Audio API, with **no downloaded third-party audio, copyrighted game sounds or music**.
- Short effects cover: weapon fire, visible projectile impact, construction placement, specialist ability activation, victory and defeat.
- Rate limiting prevents repeated nearby shots or impacts from creating an overwhelming number of concurrent audio tones.
- Sound is only attempted after the user enables it via a direct click. Browsers may restrict or not support Web Audio; in that case the game continues silently.
- Sound from unseen combat is not played, consistent with the visible-fog limitations.

## Verification
- `tests/tactics-v13.test.mjs` exercises:
  - Sound defaults to disabled and remains silent before opt-in.
  - Synthesizer responds to opt-in, throttles repeated events and mutes correctly.
  - Group move orders cannot assign unreachable destinations across a continuous water barrier.
  - Squad members receive distinct orders and avoid penetrating an impassable lake.
  - AI flank selection produces distinct walkable approaches and rejects geometrically isolated flanks.
- GitHub Actions now includes `node --check audio/sfx.js` and the new tactical tests, alongside every earlier milestone's regression suite.

## Known limitations and v1.4 priorities
- No live synchronized speed matching, navigation flow field or collision reservation among dozens of moving vehicles yet.
- AI has basic flanks only for last-known building contacts; full squad coordination, resource harassment, retreat and defense doctrines are future work.
- These are short synthesized sound effects, **not recorded music, voice acting, studio-quality audio or licensed RTS sounds**.
- Three factions and Map Forge remain playable; the game still lacks complete campaigns, aircraft/naval warfare, multiplayer and final 3D sprite atlases.

Potential next development: more robust crowd navigation, UI performance on mobile, building damage and hit animations, and a production-grade art pipeline.
