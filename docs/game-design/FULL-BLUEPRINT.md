# CHRONO DOMINION — COMPLETE GAME BLUEPRINT



---

# CHRONO DOMINION — Browser RTS Development Blueprint

**Status:** Design and technical planning only. This package does **not** yet contain a playable game.

## Goal
Build an original, free-to-play, desktop-browser real-time strategy (RTS) game with feature depth comparable to *Command & Conquer: Red Alert 2 — Yuri's Revenge* (YR): three factions, country variants, resource economy, construction, unit veterancy, psychic capture, garrisoning, naval and air warfare, superweapons, skirmish AI, campaign, multiplayer, and the familiar rapid right-sidebar workflow.

## Two separate use cases
1. **Play actual Yuri's Revenge in a browser:** `https://ra2.games` (experimental) or self-host `https://github.com/AgentMystia/openyrweb`. Each requires original game installation/data obtained legally. This path preserves the real game's assets and most faithful experience but is **not** a standalone free-content remake.
2. **Publish our independently playable game:** A new name, code, original sprites/voices/music/maps/text, with comparable gameplay mechanics. Recommended engineering reference: `https://github.com/harshilmathur/openra2` (Vanguard Engine), whose **Original** mode ships non-retail assets and whose **Classic** mode uses user-owned files. The upstream does **not** yet have a complete YR feature set. Audit quality and code licenses before adopting it.

## Decisions
- Desktop Chrome/Edge first; Safari/Firefox best effort after functionality, tablet controls later.
- Isometric 2.5D, sprite atlas for infantry/buildings, 32-facing vehicle sprites or rendered atlases.
- 3 faction archetypes: Coalition Forces (high-tech precision), Iron Federation (heavy industry), Psionic Order (psychic biotech).
- Single-player 1 human vs AI is first playable milestone; **8 player slots** are a full-game target, not MVP.
- Fully client-side/offline-capable single player. Save games, settings, and user maps to IndexedDB.
- Free static hosting via GitHub Pages or Cloudflare Pages. Multiplayer uses a separate signalling/relay service; GitHub Pages alone cannot host authoritative match services.
- Use GPL-3.0-or-later when actually adapting Vanguard GPL code. Track artwork licenses and provenance.
- No unlicensed retail assets, original game executables, proprietary music/voices, cinematics, dialogs, or copied map packs in the publicly distributed repo.
- Faction and unit names in the **reference rosters** are historical analysis; release-facing content needs new names, new art, and its own story.

## Read in order
1. `docs/01-RESEARCH.md` — findings and original game's scope.
2. `docs/02-PRODUCT-AND-MENUS.md` — all menu screens, settings and player-facing controls.
3. `docs/03-ROSTERS-AND-TECH.md` — content inventory / tech trees and special abilities.
4. `docs/04-SYSTEMS-AND-LOGIC.md` — authoritative simulation specification.
5. `docs/05-ARCHITECTURE-AND-DEPLOY.md` — modules, networking and hosting.
6. `docs/06-ASSETS-AND-ART.md` — art specification and asset generation pipeline.
7. `docs/07-ROADMAP.md` — actionable phases, dependencies and acceptance gates.
8. `docs/08-TEST-CASES.md` — regression/QA coverage.
9. `docs/09-DATA-CONTRACTS.md` — TypeScript models, command protocol and examples.

## Definition of success
Open a published HTTPS link in the browser, start an offline skirmish **without installing anything or providing original game files**, play a full match against a competent AI, build each of three factions' complete tech trees, win/lose, save/reload, and restart without losing settings. Only then declare the standalone game complete. Multiplayer and campaigns are separately gated milestones.


---

# Research dossier — Yuri's Revenge (2001) and current browser engines

Research checked **25 October 2026**. Projects may change; status claims represent the sources, not local testing.

## Primary references
- **Original Yuri's Revenge English manual (36 pages)** — keybindings, new modes, country/army tech trees, gameplay changes, support powers: https://static.wikia.nocookie.net/cnc_gamepedia_en/images/8/8e/Red_Alert_2_-_Yuri%27s_Revenge_-_English.pdf/revision/latest
- Detailed YR units: https://cncnz.com/games/yuris-revenge/yuris-units/
- Detailed YR buildings and support: https://cncnz.com/games/yuris-revenge/yuris-structures/
- New Allied units: https://cncnz.com/games/yuris-revenge/new-allied-units/
- New Soviet units: https://cncnz.com/games/yuris-revenge/new-soviet-units/
- Allied production structures: https://cncnz.com/games/red-alert-2/allied-structures/
- Soviet production structures: https://cncnz.com/games/red-alert-2/soviet-structures/
- Game mode, campaign operations and original structure: https://strategywiki.org/wiki/Command_%26_Conquer:_Red_Alert_2:_Yuri%27s_Revenge
- Original data reference: `rulesmd.ini`, `artmd.ini`, `aimd.ini`, `mpmodesmd.ini`, `ui*.ini`, `.map` and `.yrm` formats. ModEnc: https://modenc.renegadeprojects.com/INI

## Original game inventory (core reference)
- 3 playable *sides* for skirmish and multiplayer: Allied, Soviet, Yuri. Allies have 5 national variants (America, Great Britain, France, Germany, Korea), Soviets 4 (Russia, Cuba, Iraq, Libya), Yuri 1 standalone selection.
- 14 YR single-player missions: 7 Allied, 7 Soviet. No original standalone Yuri single-player campaign.
- 10 co-op missions across 4 co-op campaigns documented in original promotional description: https://www.cnclabs.com/redalert2/yurisrevenge/storyline.aspx
- Novel mechanisms: psychic-unit and building control, slave economy, grinding, cloning, tank bunkers, gun-spool weapons, mutant conversions, spying/stealing tech, IFV passengers, robot power dependency, chronoshifting, garrisoning, veteran/elite levels.
- Engine-level reference: isometric 2.5D battlemap, fixed-step real-time orders, right production sidebar, 4 production categories (Structures, Defence, Infantry, Vehicles), radar, build queue, cursor-dependent actions, fog/shroud, power availability, production prerequisites, economy, health, armor/warheads, terrain theatre, supply logistics, supports and superweapons.
- Original manual covers exact keyboard commands and expansion-specific edge cases. The reference database and behavior test oracle should be derived from **observations / independently recreated rules**, with original licensed game files never committed to public source control.

## Engine comparison

| Project | Type | Reports functioning | Important gap | Best use |
| --- | --- | --- | --- | --- |
| RA2 VM — https://github.com/ra2-games/ra2 | Runs original x86 RA2/YR executable in browser | RA2/YR skirmish, saves, maps; experimental relay multiplayer | Requires installed game/executable, alpha compatibility, CPU overhead | Actually play historical YR with your own copy |
| OpenYRWeb — https://github.com/AgentMystia/openyrweb | Browser-native RA2/YR reimplementation; Apache-2.0 | YR single-player skirmish/replays | Requires original game MIX archives; multiplayer WIP | YR specific technical comparison |
| Vanguard — https://github.com/harshilmathur/openra2 | TypeScript deterministic browser RTS; GPL-3.0-or-later | Original-asset Soviet skirmish slice, fixed-point simulation, bot, file decoders | Roadmap defers Allies, Yuri, superweapons, naval, netplay | Standalone original-asset foundation **subject to audit** |
| Chrono Divide — https://chronodivide.com/ | Browser-native recreation, primarily RA2 | Browser multiplayer, maps, skirmish, replay, modding | Not a full Yuri's Revenge client; original game assets required | UI / online design benchmark |
| OpenRA — https://github.com/OpenRA/OpenRA | C#/desktop game engine | Older RA1/Tiberian Dawn/Dune 2000 mods | Not native web; main distributed mods are not YR | AI / trait architecture reference |

**Do not imply these projects are interchangeable.** In particular, RA2 VM is more faithful but needs original game files; Vanguard original-asset mode is content-independent but incomplete relative to YR.

## Verified YR-specific reference behaviors from the manual
- Spy entering different enemy structures has a different effect: barracks -> veteran infantry; war factory -> veteran vehicles; power -> shutdown; radar -> shroud; refinery -> steal money; superweapon -> delay; faction-specific battle lab -> special infiltration unit.
- One active commando hero per player under normal rules. Tanya, Boris, Yuri Prime are mind-control immune and ordinarily vehicle-crush resistant, with Battle Fortress exception.
- Garrisoned infantry earn veterancy; UI reports garrison occupancy.
- Allied Robot Tanks are controlled by a powered Robot Control Center and remain resistant to psychic takeover.
- Soviet Industrial Plant reduces vehicle and refinery costs/build time; verify precise values in data.
- Yuri's Bio Reactor accepts up to five infantry, each boosting power; Psychic Tower captures several units, up to three in cited structure guide, and releases them on power loss.
- Yuri's Psychic Dominator mass-controls susceptible units and attacks structures; captured units become permanently loyal according to the referenced guide.
- Common Force Shield protects buildings temporarily but interrupts owner power.
- Engineers capture or repair structures, tech buildings may grant global passive effects.

## Intellectual property boundary
Implement general genre/game mechanics and functional feature parity but use new faction branding, custom art, audio, map layouts, text, cutscenes, and naming. Hosting the user-supplied original game data for personal gameplay is a separate 'bring your own assets' mode. **Do not upload original game archives, EXEs, cinematic videos, soundtracks or extracted textures to GitHub Pages.** License review of each adopted codebase is required.


---

# Product specification, full menu inventory and UX flow

## Target experience
- Desktop-first landscape 16:9 HUD; maintain gameplay viewport while docking right side panel.
- Familiar 2000s-era reactive strategy interactions: fast build, quick orders, selection sound/feedback, radar, power, scrolling, battle warnings. Design identity must be original: graphite/bronze blue-gray chrome, large radar disc motif, distinct silhouette/typography, color-coded factions.
- Offer 1920x1080, 1600x900, 1366x768, 1280x720 and adaptive canvas, pixel crisp option, interpolation switch.
- Do not enforce original game's fixed 800x600 menu presentation; preserve visual proportions while adapting to screens.

## Navigation tree and screens
`Boot > splash/license/asset-check > Main Menu`:

1. **Single Player**
   - **Campaign** -> Choose Campaign -> Faction/story -> Mission selection (locked/unlocked) -> Briefing -> Start; current progress, difficulty, restart, continue.
   - **Skirmish** -> Lobby -> Map -> Factions/AI/options -> Start.
   - **Load Game** -> save slots (date, thumbnail, faction, mission, duration) -> Load/Delete/Export.
   - **Challenge / Tutorial** -> Basics, Economy, War, Naval, Psionics.
2. **Multiplayer** (only enabled after online milestone)
   - **Quick Match** -> queue/region/ping preference -> ready -> loading.
   - **Custom Games** -> public/private lobby list, map, slots, spectator counts, filter, password.
   - **Host** -> host lobby + invite code/link, player colors, side/team/start positions, game settings, map preview.
   - **Join** -> join code, connection test, chat, ready status.
   - **Co-op** -> scenario mission selection, lobby, synchronized briefing.
   - **Spectate** -> observer mode, viewing stats, fog view policy.
   - **Replay Browser** -> local/imported replays, seek, speed, pause, player perspective.
3. **Map Editor** -> New Map / Open / Save / Export / Import / Validate -> editor canvas, terrain palette, heights, cliffs, water, ore, spawn slots, objects, units and triggers.
4. **Options**
   - **Graphics:** resolution, fullscreen, zoom, scroll speed, scroll acceleration, interpolation, shadows, animation density, particles, capped/unlimited FPS, accessibility contrast.
   - **Audio:** master/music/effects/voice/UI levels, subtitles, voice frequency.
   - **Controls:** classic left-click commands, modern right-click toggle, keybinding editor, drag selection, camera settings.
   - **Gameplay:** default speed, autosaves, pause on tab blur (solo only), combat text, alerts, tips, tutorial hints, tooltip delay.
   - **Accessibility:** reduced flash, colorblind palettes, alternate unit outlines, UI scale, captioned warnings.
5. **Extras** -> Unit encyclopedia, statistics, achievements (local), credits, patch notes, legal/attribution.
6. **Exit / Return to title** -> browser application displays 'Close tab' when relevant, not attempt to close a tab opened by user.

## In-match HUD sections
- **World viewport:** terrain, buildings, units, fog, explosions, health bars, rally flags, contextual action cursors.
- **Right sidebar, vertical:** money counter, power meter, minimap (radar gated), four tabs `Structures (Q)`, `Defences (W)`, `Infantry (E)`, `Units/Vehicles (R)`, scrollable production icon grid, item cost and readiness/cooldown, progress outline, queued-item badges, disabled-reason tooltip.
- **Advanced command strip:** move, attack-move, guard, stop, deploy, force-fire, force-move, waypoint, selected-type/selection group, formation optional, rally-point.
- **System strip:** pause/options, repair mode, sell mode, superweapon timers, chat, diplomacy, FPS/ping optional, notification log.
- **Unit selection UI:** portrait/label, health, veterancy badge, owner/team, cargo/garrison, primary/secondary weapons, ability readiness, orders.
- **Visual alerts:** unit lost, under attack, radar lost, insufficient funds, low power, superweapon ready, base attacked, ally message.
- **Player statistics:** earned/spent credits, structures/units produced/lost, units killed, APM optional, elapsed match time.

## Skirmish lobby fields
- Map browser (preview, size, biome, players, official/custom, naval flag, selected start position)
- Slots 1–8: Human/AI/Closed; names; color; Coalition/Iron/Psionic/Random; nation variant; AI difficulty Easy/Normal/Hard/Brutal; team; start marker; observer.
- Classic toggles: **Short Game**, **MCV Repacks**, **Crates Appear**, **Superweapons**, **Build Off Ally ConYards**.
- Adjustable: initial credits, initial units, game speed, starting tech level optional, random seed advanced.
- Game modes: Standard Battle, Free For All, Team Alliance, Meat Grinder (restricted tech), Naval War, Land Rush, Megawealth, Unholy Alliance, Siege/other specialty modes, subject to ruleset definitions. Mark unsupported modes disabled with explanation rather than pretend parity.
- Buttons: Start Game, Save Preset, Load Preset, Back. Validate min 2 active sides and spawn availability.

## Input fidelity
Source is the English YR manual, pages 3–6 (PDF indexes 2–5):
- Left-click select; drag select; right-click deselect/cancel under classic controls; left-click world after selection issues context-aware order.
- `D` deploy, `G` guard, `S` stop, `X` scatter, `CTRL` + click force fire, `ALT` + click force move; `CTRL+SHIFT` + destination attack move according to manual.
- `CTRL+1` through `CTRL+9` assign squad; `1`–`9` recall; double-tap to focus.
- `Z` held + points makes waypoint path; `B` beacon; `SPACE` jump to last event; `TAB` diplomacy.
- `Q/W/E/R` sidebar tabs; `T` select same type; `P` all units; `H` center base; `Y` veteran selection; `N/M` next/previous unit.
- `K/L` repair/sell modes; `ESC` pause/options; `ENTER` message, `BACKSPACE` ally chat; `F1`–`F4` bookmarks.
- Conflict handling: while typing/chat, disable gameplay hotkeys. UI tooltips always display current rebinding.

## Gameplay flow states
`Boot -> Title -> Mode Setup -> Loading -> Briefing(optional) -> Playing -> Paused -> Result -> Scoreboard -> Replay/Return`.
Pauses allowed only in single-player; online pause requires vote/host rules. On loss/win offer Play Again, Save Replay, Statistics, Main Menu.

## Campaign scope
The historical YR has **two seven-operation single-player campaigns** (Allied and Soviet); no playable Yuri story arc. For original product, design **14 new missions** that cover similar *mechanical breadth* without copying plot/briefings/maps. A seventh Psionic campaign can be an **original future enhancement**, not labeled a historical YR feature. Editor supports objectives such as capture, defend, escort, survive, eliminate, sabotage and timer.

## Screens required in UI implementation
Boot/splash; Asset Mode; Main; Single; Campaign selection; Mission brief; Map Lobby; Load/save; Gameplay; Pause; Options (five panels); Endgame results; Encyclopedia; Credits; Campaign debrief; Multiplayer browser; Host/join; Chat/diplomacy; Co-op lobby; Replay; Map editor; Error/disconnection; Offline install banner; Tutorial; Attribution. This is a **screen checklist**, not a claim of existing implementation.


---

# Content manifest and tech-tree parity checklist

**Reference unit names below identify historical YR content for comparison and QA.** Names and artwork in a released standalone game must be original. For our version, the sides are **Coalition Forces**, **Iron Federation**, and **Psionic Order**.

## Shared systems/content
- MCV deploys to Construction Yard, build radius, refinery and resource collectors, prerequisite technology buildings, build queues, base expansion, perimeter walls.
- Engineers, scouting, healing/repair/sell, repair depots, naval production, garrisoning, combat veterancy, neutral tech buildings.
- Maps: temperate/urban/snow/desert/lunar-inspired environments using wholly original terrain tiles. Ore/gems, debris, cliffs/elevation ramps, shallow water, deep water, bridges/huts, bridges that can break and repair, ambient civilian structures/animals, capturable tech buildings.
- Tech facilities: civilian power plant (+power), machine shop (passive vehicle healing), hospital (passive infantry healing), secret lab (bonus unlock), tech oil derrick (income), airport (airborne abilities), tech outpost (repair/garrison). Do not assume all are new to YR.

## Coalition Forces — Allied-equivalent reference roster
**Infantry**: GI (deployable rifle), Guardian GI (deployable anti-vehicle/air), Engineer, Attack Dog, Rocketeer (flying infantry), Navy SEAL (demolition), Spy (infiltration), Tanya (hero), Chrono Legionnaire (time erase), British Sniper, stolen-tech Chrono Commando/Psi Commando/Chrono Ivan when eligible.
**Vehicles**: Chrono Miner, Grizzly Tank, IFV (weapons depend on passenger class), Robot Tank (amphibious and requires powered controller), Mirage Tank (tree disguise), Prism Tank (beam/reflection), Battle Fortress (five firing passengers, heavy crush), MCV, Nighthawk Transport.
**Aircraft**: Harrier, Korean Black Eagle. **Naval**: Destroyer (anti-sub helicopter), Aegis Cruiser (anti-air), Dolphin (sonic), Aircraft Carrier (plane launch), Amphibious Transport.
**Structures**: Construction Yard; Power Plant; Ore Refinery; Barracks; War Factory; Naval Shipyard; Airforce Command HQ; Service Depot; Robot Control Center; Battle Lab; Ore Purifier; Gap Generator; Spy Satellite Uplink; Wall; Pillbox; Patriot Missile; Prism Tower; French Grand Cannon; Chronosphere; Weather Control Device.
**Abilities/superweapons**: US airborne infantry; Force Shield (shared), Chronoshift via Chronosphere; Lightning Storm via Weather Control Device; spy effects.
**Nation modifiers**: USA -> Paratroopers; UK -> Sniper; France -> Grand Cannon; Germany -> Tank Destroyer; Korea -> Black Eagle. Rename countries or faction variants as necessary for fiction.

## Iron Federation — Soviet-equivalent reference roster
**Infantry**: Conscript, Engineer, Attack Dog, Tesla Trooper (can enhance Tesla Coils), Flak Trooper, Crazy Ivan (bomb), Boris (hero, marks building for MiG airstrike), nation-specific Desolator (Iraq) and Terrorist (Cuba), stolen-tech Chrono Ivan etc.
**Vehicles**: War Miner (turreted ore harvester), Rhino Heavy Tank, Flak Track (transport + AA), Terror Drone (vehicle parasite), V3 Rocket Launcher, Apocalypse Tank, Siege Chopper (flies/deploys to artillery), Kirov Airship, MCV, Russian Tesla Tank, Libyan Demolition Truck.
**Naval**: Typhoon Attack Sub, Sea Scorpion, Giant Squid, Dreadnought, Amphibious Transport.
**Structures**: Construction Yard; Tesla Reactor; Ore Refinery; Barracks; War Factory; Naval Yard; Radar Tower; Service Depot; Battle Lab; Nuclear Reactor; Battle Bunker; Industrial Plant; Walls; Sentry Gun; Flak Cannon; Tesla Coil; Iron Curtain Device; Nuclear Missile Silo.
**Abilities/superweapons**: Spy Plane, Force Shield, Iron Curtain temporary invulnerability, Nuke; nuclear fallout/radiation, major reactor destruction blast.
**Nation modifiers**: Russia -> Tesla Tank; Cuba -> Terrorist; Iraq -> Desolator; Libya -> Demolition Truck.
**Important YR delta**: Soviet Yuri/mind-control infantry, Psychic Sensor and Cloning Vats are not Soviet buildables in YR; do not reproduce vanilla RA2 availability by mistake.

## Psionic Order — Yuri-equivalent reference roster
**Infantry**: Initiate (anti-infantry psychic damage and garrison), Engineer, Brute (melee anti-armour), Virus (sniper poisonous residue), Yuri Clone (limited unit control and psychic blast), Yuri Prime (hero, special building control), Slave (works for mobile miner), campaign-only Cosmonaut, stolen-tech Psi Commando.
**Vehicles**: Slave Miner (deploys and spawns slave gatherers), Lasher Light Tank, Gattling Tank (spin-up damage), Chaos Drone (confusion cloud), Magnetron (magnetic lifting/manipulation), Mastermind (multiple mind control and overload), MCV, Amphibious Transport.
**Aircraft**: Floating Disc (drains power/credits when hovering over suitable structure; laser attacks).
**Naval**: Boomer Submarine (torpedoes and ballistic missiles).
**Structures**: Construction Yard; Bio Reactor (garrison infantry to boost supply); Slave Miner; Barracks; War Factory; Submarine Pen; Psychic Radar; Grinder (reclaim owned units); Battle Lab; Citadel Walls; Tank Bunker; Gattling Cannon; Psychic Tower; Cloning Vats; Genetic Mutator; Psychic Dominator.
**Abilities/superweapons**: Psychic Reveal, Force Shield, Genetic Mutation, Psychic Domination; capture multiple opponents, free infantry duplication and controlled-unit recycling.

## Precise parity edge conditions to test
1. Powered/unpowered buildings update immediately, except effects with explicitly defined delay; tower loses subjects on power off.
2. Psychic Tower maximum subjects must be enforced (historical documented: 3); Mastermind supports higher control with overload damage (verify exact parameters from original tests/rules).
3. Capturing the controller, death, selling, sell/refund, and disconnect can all change capture ownership/release.
4. Heroes cannot normally be mind-controlled; robotic harvesters, aircraft and certain immune classes have exclusion tags.
5. Overlapping force shields/superweapons, invulnerability, mind-control immunity, and mutation resolve deterministically.
6. Battle Fortress transports exactly five infantry and passengers fire while enclosed; crushing exceptions apply.
7. A powered Robot Control Center controls Robot Tanks; low power disables them.
8. Garrison occupants receive veterancy and reveal their count. Engineers enter buildings, spies infiltrate rather than capture.
9. Cloning Vats duplicates normal barracks infantry; YR Cloning Vats do **not** recycle units or derive producible types from captive units.
10. The original AI should obey the same affordability/build/vision rules as humans.

## Content database requirements
Every buildable object needs: unique original product id, side, producer, prerequisite tags, cost, build ticks, HP, armor class, sight radius, footprint, selectability, draw depth, locomotion, movement speed, turn speed, weapon ids, ammo/reload, owner color palette, 32-direction animation, sounds, special action, AI threat type, veterancy thresholds, transport capacity/allowed cargo, death effect, power consumption/generation, unlock conditions and balance tests. **No static unit costs should be treated as verified unless linked to a chosen ruleset/version.**


---

# Simulation logic and system-level design

## Principles
- **Game simulation is authoritative and deterministic**, decoupled from animation, rendering and DOM.
- Fixed tick duration `TICK_MS` from config (example target 50 ms = 20 ticks/second; *engineering decision, not asserted as historical YR rate*). Real-time UI may render at 60 fps while simulation advances at configured rate.
- Every mutation happens via a validated command or deterministic tick system; RNG is seeded (PCG/xorshift) with stable iteration order. Integer or Q16.16 math inside sim.
- Every meaningful feature has deterministic test and replay event coverage.

## World coordinate and height model
- Map is an isometric grid `width x height` with cell coordinates `(u,v,height)`. Tile has terrain kind, movement masks, elevation, bridge, blocking object, ore, ownership, shroud/reveal state per player, decoration IDs.
- Renderer maps grid to screen: `screenX=(u-v)*TILE_W/2`, `screenY=(u+v)*TILE_H/2 - elevation*HEIGHT_STEP`; add camera transform and zoom. 3D unit overlays/voxel-like models are drawn with 32 headings, depth sorted by ground contact and per-entity render layer.
- Navmesh separates ground wheeled/tracked, infantry, amphibious, naval deep-water, hover, air. Dynamic occupancy; bridge and cliff transitions; editor verifies spawn access and disconnected island maps.

## Tick system order (lock this order and version it)
1. Read sorted, player-authorized incoming orders for tick `n` (source player, sequence number). Validate ownership, fog/reveal restrictions, valid targets, costs, map bounds.
2. Update timers/status/cooldown, temporary ownership, shield expiry, debuffs.
3. Resource economy (ore growth if enabled, miners collect/deposit, refunds, income, spending as production accrues).
4. Compute power network availability and prerequisite eligibility; enable/disable dependent structures/systems.
5. Advance production queues and construction placement previews; spawn finished units at production facility if egress valid; apply garrison/clone effects.
6. Recompute navigation requests/collision reservations and advance movement in stable entity order.
7. Acquire targets/line of sight, resolve weapons aiming/charging and projectile movement.
8. Resolve impacts, warhead-versus-armor tables, blast radius, terrain effects, statuses, casualties, veterancy.
9. Resolve ownership transfer/mind control, AI reactions and game objectives (exact order must be chosen and tested; damage/capture same-tick priority is explicit).
10. Recompute sight, visible entities, radar and shroud; emit event log, desync hash, snapshots every N ticks; execute AI as an ordinary command-producing player for future ticks.

## Construction, power and credits
- Match starts with placed ConYard or deployable MCV. A deployed Construction Yard unlocks construction tab and establishes `buildRadius` from owned live valid structures.
- Structures may be placed on entirely valid unoccupied allowed cells, adjacent to player/ally buildings when optional `buildOffAllies=true`; cannot place across disallowed heights/water/obstacles.
- Only one active construction queue per applicable producer class in a base ruleset; additional production factories can modify speed, but not silently create unlimited parallel lanes. Define deviations in config. Queue progress, right-click cancel, refund semantics and "on hold" rules are model-owned.
- `netPower = sum(live generators) - sum(live consumers)`; if deficit, pause/disable named systems (radar, automated defenses, superweapons, remote robots) and apply any production slowdown from the ruleset. Special Bio Reactor +100 power per valid occupant under referenced historical rules, subject to chosen balance config.
- Ore collector finite cargo with `SEARCH -> MOVE_TO_PATCH -> HARVEST -> RETURN -> UNLOAD -> SEARCH`; optional manual return/attack orders; miner contest, obstacle, death and docking are handled. Gems/ore have independent yields. UI money number is an integer. Resource patches are replenished only under explicit regeneration rule.
- Construction completion is not instantaneous unless a chosen ruleset so defines. If delivery exit blocked, manage stall/refund deterministically (YR manual notes Barracks block -> refund for some cases).

## Combat
- Unit has `hp`, `armorClass`, `sight`, `range`, `targetMask`, `projectile`, `warhead`, `accuracy`, `reload`, `veterancy`, `status`.
- Formula concept: `damage = baseDamage * warheadVsArmor[armor] * veteranMultiplier * contextualModifiers`; use fixed-point and explicit integer rounding, no client-local randomness. Splash effects sample radius, falloff and occupant immunity. Per-ruleset values stored in data, not in UI code.
- Distinguish projectile / hitscan; rockets can be intercepted; lasers/temporal erasure/plasma; radiation and toxins tick over time; line-of-sight/fog and range checks each firing cycle; aircraft ammo, airfield slots, return/land/refuel; naval surfacing/anti-sub detection.
- Actions: Move, Attack, AttackMove, Guard, Patrol/Waypoints, Hold/Stop, Deploy, Scatter, ForceFire, ForceMove, Garrison, Ungarrison, EnterTransport, Unload, Infiltrate, Capture, Repair, Sell, SetRally, SpecialAbility.
- Veterancy XP from appropriately attributed kills; rank 0/1/2 gives predefined combat bonuses and ability modifiers, not hard-coded assumptions about parity. Garrison occupants can gain XP.
- Death outcomes: wreck/fire, area blast, release mind controlled slaves, bridge damage, floating crates, debris and effects as rules define. Armored warhead tables required.

## Psychic/mind-control subsystem (critical)
- Every unit has `originalOwnerId`, `effectiveOwnerId`, `controlChain` (owner source & controller entity), `immuneTags`, `captureState`, `mindResistance` optional, `permanentConversion` boolean.
- A *controller* (clone/tower/mastermind/dominator) has `controlCapacity`, `controlledIds`, `range`, power dependency, target type restrictions and damage/overload behavior.
- `TryMindControl(controller,target)` only succeeds if alive, hostile or eligible, target is in range, target has no immunity/excluded type, controller has valid capacity/power, and target isn't in transition state. Successful control updates effective owner/team, unit command ownership, selection, color remap, AI targeting and visibility atomically.
- **On controller death/sell/power outage**: release non-permanent subjects to legal prior owner if still present; clear stale backlinks; support capture of the controller itself without cycles or orphan links. Track possible chained control; define deterministic order for competing controls.
- Psychic Tower reference: limit 3 subjects and auto-target; disable and release on insufficient power. Mastermind reference: multi-capture with escalating overload to HP if over safe capacity; tune exact curve to independently measured data, not guessed constants.
- Domination superweapon: burst damage to buildings + permanent capture of eligible targets in area; explicit target exclusions. Psychic radar reveal is an ability independent of direct capture.

## Supporting specials
- **IFV passenger conversion:** loaded passenger resolves a weapon profile via `passengerArchetype -> turretWeaponId`, supports unloading and persistence.
- **Prism chain:** optional target bounce/reflection with deterministic propagation order.
- **Chronoshift:** instant shift with delay effects, destination validation, naval/terrain constraints, passenger handling.
- **Terror Drone:** attaches to valid vehicle, periodic damage, removed by repair facility or explicit counter.
- **Gatling spin:** stage 0 -> 1 -> 2 with continuous-fire threshold; decay after idle; derived shot cadence and weapon stats.
- **Magnetron:** lifts target if eligible; suspended vehicle changes occupancy and follows physics resolution; release/fall/explosion if beam breaks.
- **Virus/radiation:** timed area hazard damages allowed actors, immune types exempt; spreading cloud effects configurable.
- **Mirage disguise:** appearance state hides true identity when idle, except detectors, attack reveal, movement.
- **Slave Miner:** deploy and spawn workers, workers return yield, replacement, liberation on destruction.
- **Grinder:** accepts owned eligible infantry/vehicles and refunds rule-driven portion, triggers kill/release bookkeeping.
- **Cloning:** duplicates eligible Barracks production; hero/commando quotas resolved before extra copy.
- **Tech spy:** event-driven handler table by structure class, not same result for all entries.
- **Neutral tech:** capture changes owner; passive repair/reveal/income/unlock rates, ownership transfer and loss supported.
- **Crates:** deterministic seeded spawn, pickup buffs and economy/units; on/off option.
- **Superweapons:** charge gated by power/prerequisites, warning + visible timers, launch action validated and synced, individual cooldown; Force Shield temporarily power-interrupts owner, Iron Curtain makes allowed units/structures invulnerable; nuclear weapon creates lingering hazard; weather weapon supports area strike; chrono teleports valid units; genetic mutator converts vulnerable infantry to controlled mutants.

## Fog, radar and diplomacy
- Visibility per player: unseen shroud, explored shroud, currently visible cells (configurable historical mode), detector layers for spies/submerged units, radar depends on powered facility. Explored terrain does not reveal hidden enemies. Shared vision when allied and enabled.
- Reevaluate alliance changes in sim state, not merely colored UI. Friendly-fire/force fire policy applies.

## AI
- Bot operates same `Order[]` API as human, no direct world mutation. Traits: Economy, Build Planner, Scouting, Threat Evaluation, Attack/Defense, Counter-Unit, Naval/Air, Special Ability, Team Coordination.
- Evaluate state every `AI_DECISION_INTERVAL`, allocate budget among generators/refineries/production/tech/defense/army; persistent strategy state prevents oscillation; choose safe rally and routes.
- Easy = delay + limited response; Normal = competent economy; Hard = balanced tech and multi-front attacks; Brutal = more strategic efficiency/coordination, **not** cheating resource injection by default (optional classic-cheat modifier clearly labeled).
- Evaluate 1v1, 1v7, mixed teams, random seeds, access to air/sea, late-game economy, anti-stalemate logic.

## Win / loss / replay
- Standard elimination: all enemy live buildings (or selected "short game" condition) removed; optional victory objective triggers. Concede/surrender -> elimination event; allies continue when rules say so.
- Every match stores immutable `matchConfig`, `seed`, `rulesetVersion`, ordered commands and periodic snapshots. Replay is deterministically re-simulatable; verified hash after every tick. Save file includes world version and migration policy.
- Resuming game after browser reload must not lose resources, assigned groups, statuses, AI brain state, or timers.


---

# Browser engineering, repository architecture and free hosting

## Technology selection
**Recommended foundation to evaluate first:** the GPL-3.0-or-later **Vanguard** TypeScript/Three.js/React project for its asset-independent mode, deterministic core and unit-format loaders. Branch internally and run it before modifying. Because Vanguard currently defers full Yuri capabilities, a separate feature-parity sprint remains necessary. See `01-RESEARCH.md` for comparative engines.

Proposed stack after audit:
- **Simulation:** TypeScript, deterministic fixed point + Web Worker; optional WASM for hotspot pathfinding after profiling.
- **Rendering:** Three.js WebGL2 isometric textured quads and batched meshes, ordered 2D sprite animation; atlas packing; offscreen rendering optional; fallback Canvas 2D for reduced motion.
- **UI:** React + Zustand/state selectors (or the upstream pattern), CSS variables for skins, accessible HTML overlays; input adapter maps DOM -> world coordinates and validated commands.
- **Sound:** Web Audio API and original .ogg/.webm assets, volume control, deduped voice barks.
- **Storage:** IndexedDB object stores: `settings`, `assets`, `maps`, `saves`, `replays`, `campaign`, `pendingUpload`, schema upgrades.
- **Test:** Vitest (simulation), Playwright (browser and menu), deterministic golden hashes for saves/replays, bots vs bots soak, visual regression screenshot baseline.
- **Hosting:** Github public repo + Actions build -> GitHub Pages HTTPS; Cloudflare Pages also an option. Use asset caching/service worker and content hashing. No original game binaries/data in hosting output.

## Directory proposal
```
chrono-dominion/
  README.md
  LICENSE                     # follow upstream GPL if forking Vanguard
  package.json
  .github/workflows/{ci.yml,deploy.yml}
  apps/web/                   # UI, route state, menu, lobby, canvas
  packages/sim/               # ECS state, fixed tick, orders, combat, ownership
  packages/render/            # map tile renderer, sprites, selection overlays
  packages/ai/                # economy planner, tactical squads, ability use
  packages/content/           # data loaders and original rulesets/tech tree
  packages/net/               # lockstep and replay codec
  packages/map-editor/        # terrain and mission trigger authoring
  public/assets/
    coalition/{buildings,units,portraits,voices}
    federation/{buildings,units,portraits,voices}
    psionic/{buildings,units,portraits,voices}
    terrain/{urban,snow,desert,temperate,lunar}
    hud/{panels,icons,emblems}
    audio/{music,sfx,announcer}
  docs/
  tests/{simulation,integration,visual,net,benchmark}/
```

## MVC boundary
- **Sim** only consumes plain immutable/structured input. No `Date`, DOM, `Math.random`, browser storage, async calls or floating platform-dependent randomness.
- **View** subscribes to latest snapshot and interpolates world states for smooth movement; the render frame cannot change game outcomes.
- **Controller** maps UI interactions/hotkeys to serialized `Order` events with `player`, `tick`, `sequence`, `units`, payload. Validate in sim.

## Multiplayer architecture (after solo)
Option A: **lockstep peer model** (lower hosting cost): peers exchange orders N ticks in advance over WebRTC data channels; all run deterministic simulation; state hashes detect divergence; one peer can coordinate lobby/host. ICE/STUN works for some networks; TURN relay may be required and has ongoing costs.
Option B: **authoritative server** (more robust): server sim and sends compact state deltas; clients predict/interpolate. Requires backend runtime, operational costs and anti-cheat design. For browser YR-like RTS, deterministic lockstep with separate signalling service is good initial engineering choice, but connection recovery is still required.
- Multiplay lobby: room id, invite, map hash, rules hash, version, password, player slots, ready flag, faction/color/team/start, spectators, host migration rules.
- **Never promise that GitHub Pages alone provides functioning multiplayer**: it can serve frontend only; a signalling/relay service is a separate system.
- Versioned input protocol, desync diagnostics, rate limiting, reconnection and resync, player surrender/timeouts, observer data policy.

## Deploy plan
1. Fork or import audited engine to a new repo `chrono-dominion`; pin upstream revision and preserve license, COPYRIGHT and NOTICE as appropriate. For an original build without upstream code, use a private dev repo until code and provenance reviewed.
2. Set Vite `base` to `'/chrono-dominion/'` for repo Pages URL, or `'/` if using a user/organization root domain.
3. GitHub Actions on push: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`; deploy `dist/` (or upstream's actual output folder) using official Pages actions.
4. Verify SPA route reload/deep links, HTTPS, path-base, worker bundle URLs, strict content security policy, browser asset permissions.
5. IndexedDB caches and hashed assets. No backend needed for skirmish. Enable service-worker offline caching only after correctness tests.
6. Set optional custom domain via Pages/CNAME or Cloudflare Pages and DNS; keep GitHub repository public for GPL distribution if applicable.
7. Multiplayer later: add separate signalling/backend on an appropriate host; cost depends on usage and relayed traffic.

## Performance budgets (engineering targets, not promises)
- Desktop Chrome/Edge stable 60 fps render target on moderate hardware, world tick stable at selected 20 tps target; optimize to profile-based threshold before asserting unit limits.
- First shipped solo level: 128×128 tile map, 100–250 simultaneous entities for tests. Full-game target 256×256 maps and 500+ units, revised after benchmark; use object pools, sprite atlases, visibility culling, incremental pathfinding, spatial hashing.
- Cold-load size should be tracked per build; split theaters/faction packs and lazy load. Avoid preloading all campaign cinematics/audio.

## Risks
- Adapting code with GPL licensing implies distribution requirements for derivative source; incompatible proprietary dependencies cannot be silently merged.
- Vendor screenshots / media are **references** only. No retail art in release packages.
- IndexedDB quotas and browser eviction; export/import save files.
- Browser autoplay restrictions for audio: unlock AudioContext through player input.
- Hardware acceleration and mobile memory fragmentation.
- Large-map pathfinding and multi-player desync are late-phase risks. Gameplay completeness requires extensive tests beyond GUI resemblance.


---

# Art direction and original asset pipeline

## Look / silhouette goals
- Preserve the **genre-readable** visual language: oblique isometric RTS, readable turrets, infantry walk loops, clear tanks/ships/air silhouettes, dark metal sidebar, faction-color remapping, weathering, military/scifi/psychic devices.
- Do not reproduce original character faces, unique building silhouettes, trademarks/logo, exact menu illustrations, icons, maps, voices/music or recognizable sprite pixel arrangements. New faction logos and silhouettes are mandatory.
- Target 2.5D 48x24 or 64x32 logical diamond tiles (choose after engine audit), texture mapping and heights separated from world units.

## Asset catalog
- For every ground vehicle: source 3D low-poly mesh (original), `32 facings` at 11.25° steps (or camera-equivalent voxel facing); optional separate turrets; idle/fire/move/death effects; team-color mask; atlas + JSON metadata. Combat animations for select/spawn/destroy.
- Infantry: sprites with 8–16 or 32 facings as performance allows, idle/walk/crawl/attack/death/deploy/garrison + standard shadow. Avoid using same uniform as original game's unique units.
- Structures: 3D source models / 2D sprites with buildup sequence, normal/low-power/damaged/critical/destroyed states, footprint & shadow masks, selection overlay, lights, player remap.
- Aircraft and boats: front, pitch or 32 headings, shadow altitude compensation, landing/surfacing/dive visual states.
- Maps: original tile textures, roads, cliffs, urban props, rocks, trees, building debris, ore/gems, water animations, bridge pieces and overlay masks.
- UI: title/menus, lobby card, sidebar panels, 4 category icons, production cameos, hover/disabled/ready overlays, radar map filter, health/vet badges, target cursors, minimap signals, superweapon UI.
- Sound: original ambience, interface confirms, unit selection/acknowledge, warning announcer, weapons, explosions, footsteps, engines, weather, soundtrack.

## Proposed palettes (design choice, not copied)
- Coalition: slate navy / icy white / teal accents; angular clean machinery.
- Federation: oxidized steel / orange ochre / ember red; riveted industrial armor.
- Psionic: amethyst / green bio-luminescence / graphite; segmented alien-biotech curves.
- Neutrals: gray stone and olive vegetation; clarity takes priority over photo realism.

## Production pipeline
`Design Brief -> Distinct silhouette thumbnails -> original 3D blockout (Blender/SketchUp) -> UV/material -> isometric camera -> directional renders -> transparent atlas -> damage/selection/team masks -> metadata JSON -> in-engine QA`.
Use identical camera position, sun/shadow angle, sprite scale, color grading and tile projection for consistency. 3D blockouts are excellent for quickly producing hundreds of consistent rotations. Source .blend/.skp not required at runtime, but keep sources in art repo or LFS.

## Asset provenance
Track per asset: id, filename, author/tool, input prompt or sketch source, licenses, modification log, export date, source image reference, review status. Third-party CC0 assets are allowed with record; do not assume 'free download' means unrestricted redistribution. No modified retail sprite sheets as source. Brand new original voices/sounds, never copied audio clips.

## Asset build gates
- Transparent backgrounds with no dark fringe at normal scale.
- Per-sprite center/base anchor documented; units don't 'jump' frame-to-frame.
- 32 rotation headings (where required) don't drift/shrink/flip.
- Atlases stable texture names/UV coordinates; output WebP/PNG depending on color palette/performance.
- All building footprints visually cover exact collision cells.
- Unit type and player ownership discernible without color alone.
- Performance limit: per-biome texture compression & streaming required before full map size.


---

# Delivery roadmap and GitHub issue plan

Each phase ends with objective *acceptance criteria*. Do not call a milestone done because the UI screen renders.

## P0: Audit engine (first action)
- [ ] Create a fork/work branch from candidate Vanguard version; note commit SHA/license.
- [ ] `npm install`, `npm test`, `npm run dev --workspace @vanguard/client` on actual Node >=20.19 machine.
- [ ] Run Original mode **without any RA2 data**; prove 1 match against AI and input flow.
- [ ] Identify implemented vs missing features from `docs/03-ROSTERS-AND-TECH.md`, document failing tests and engine APIs.
- [ ] Independently launch user-owned original YR in RA2 VM/OpenYRWeb for visual verification only if game files are available.
**Done when:** playable original mode exists, code builds locally, license and asset provenance are inspected, gap list is grounded.

## P1: Browser UI skeleton (new branded game)
- [ ] Main menu, single player/skirmish, options, assets/copyright notice, map preview, faction selection, AI presets, 8 slots for future.
- [ ] Responsive classic sidebar, minimap shell, four production tabs, credit/power indicators, tooltip, selected unit panel.
- [ ] Input and camera: scrolling/drag selection/context orders/hotkeys/pause.
- [ ] Persist options using IndexedDB; accessible contrast and responsive sizes.
**Done when:** navigate every core solo screen, save preferences, start/exit a mock match with no broken navigation.

## P2: Foundational playable battle
- [ ] Isometric tile map; unit move, A* path and collision; targeting, HP, death, ownership.
- [ ] MCV deploy, ConYard build radius, power structures, refinery/ore income, barracks and war factory, construction queues, economy.
- [ ] Ground attack units, infantry, defenses; three-stage AI economic planner/attack loop.
- [ ] Victory/defeat, pause, game speed, local save/reload, replay logs.
**Done when:** complete one end-to-end offline 1v1 skirmish against competent AI with 1 faction and no imported game files.

## P3: Coalition / Iron full production trees
- [ ] All roster and country variants from `03-ROSTERS-AND-TECH.md` translated into original units.
- [ ] Specialists: IFV passengers, disguise, chrono, Tesla charging, radiation, missiles, Siege Chopper, airstrike.
- [ ] Aircraft/naval/refuel/repair/transport, spying, engineer capture, garrison/veterancy, industrial discount, robot control.
- [ ] Classic toggle parity, neutral tech, crate effects, team alliances.
**Done when:** both armies win matches on mixed maps and each roster ability has automated test.

## P4: Psionic Order full implementation (priority deep-dive)
- [ ] Owner-transfer engine, capture graph and immunity whitelist.
- [ ] Clone control, Psychic Tower capacity/power loss, Mastermind overload, hero control, Psychic Dominator permanent conversion.
- [ ] Slave economy, Grinder recycling, Bio Reactor garrison power, Cloning Vats, Virus toxin, Brute melee, Chaos Drone, Magnetron lift, Floating Disc drains, Boomer.
- [ ] Original art / animation / status visual effects for all specials.
**Done when:** each psychic interaction has determinism, transfer/release, ability, powered/unpowered and edge-case tests.

## P5: Complete skirmish and game modes
- [ ] 1–8 active players and observers as rules permit.
- [ ] Player color/side/country/team/spawn customization, difficulty, credit and starting unit selectors.
- [ ] Short Game, MCV Repacks, crates, superweapons, build-off-allies; mode-specific tech restrictions.
- [ ] Normal/Hard/Brutal AI, different biomes, 20+ original skirmish maps target, random maps optional.
- [ ] Offline PWA, statistics/endgame and replay UI.
**Done when:** 3 factions run full skirmish across all featured modes with validated settings.

## P6: Online multiplayer
- [ ] Deterministic room lockstep, net protocol, signalling service, map/rules hash synchronization.
- [ ] Host/join invite, optional room browser, spectators, chat, alliance, reconnection, surrender.
- [ ] Replay and desync reports; balance and latency/packet loss tests.
- [ ] Optional public online matchmaking if affordable infrastructure exists.
**Done when:** remote 1v1 and 4v4 play to resolution, consistent outcome, and controlled dropout handling. This needs backend/signalling not provided by static GitHub Pages.

## P7: Campaign / editor
- [ ] New 14-mission story campaign (7 Coalition, 7 Federation) with objectives, briefings and fully original maps/story.
- [ ] Co-op scenario support, trigger scripting DSL, difficulty scaling, checkpoints.
- [ ] Map editor import/export, objects, terrain, spawn and trigger validator; share maps using files.
- [ ] Optional Psionic faction campaign as original extra.
**Done when:** 14 original missions playable start-to-finish, with local save progress and no copied cinematic/material.

## P8: Release quality and free hosting
- [ ] Profiling CPU/GPU, memory, large-battle unit counts, browser differences.
- [ ] Audit licenses, attributions and artwork provenance.
- [ ] Configure Github Actions + Pages, offline PWA, custom domain if desired, final favicon/icons.
- [ ] Automated tests and beta report, clear README and controls list.
**Done when:** player can open an HTTPS URL, immediately play original-asset solo for free with no installer, and store saves.

## Issue backlog priority
`simulation core > basic playable economy > responsive orders > AI > full roster > psychic mechanics > maps > multiplayer > campaign > polish`. Avoid building all 14 campaign levels before the core game can complete one skirmish.

## Definition of Ready for each GitHub issue
Problem; expected game behavior; feature flag; design mock/link; rules data; input/output contract; license/provenance requirement; deterministic acceptance test; visual acceptance; reviewer.

## Rough effort classes (not schedule promises)
- UI/main menu, storage, basic skirmish shell: medium.
- Deterministic movement/combat/economy/AI: high.
- Full 3-side roster, psychic specials, naval/air: very high.
- Cross-network reliable multiplayer and campaign/editor: very high, separate workstreams.
A complete and polished YR-depth RTS is a substantial software game-development project rather than a quick website clone.


---

# Acceptance tests and regressions

## Must-pass test categories

### Boot, menus and storage
- T001: cold browser load with **zero** original YR files -> title appears; skirmish starts.
- T002: main->skirmish->map->start->pause->save->title->load->resume.
- T003: graphical/audio/key binding preferences survive reload; exports/imports restore correctly.
- T004: two different browser widths keep right sidebar usable and canvas selectable.

### Core economy and building
- T010: MCV deploy creates construction radius, opens sidebar, prevents repeat deployment.
- T011: valid building placement costs exact amount; invalid terrain/out-of-range costs zero.
- T012: harvester visits patch and refinery, increases credits once per unload; when blocked finds alternative path.
- T013: power deficit disables required features; restoring power re-enables; switching ownership updates networks.
- T014: canceled production refunds according to specified percentage; blocked unit spawn behavior deterministic.
- T015: multiple factories and refineries affect build and docking rules as configured, no duplicate spawns.

### Combat and visibility
- T020: same inputs and seed -> same end hash after 10,000 ticks in two independent workers.
- T021: target acquisition respects visibility, range, movement class and attack mask.
- T022: air target is immune to ground-only cannon; submerged target requires compatible detector/weapon.
- T023: splash, armor table, veteran and elite transitions have exact fixed-point rounding.
- T024: garrison inside civilian building increases protection, reports occupancy and awards veterancy.
- T025: repaired bridge returns passability and pathfinder invalidate cache.
- T026: spy entering refinery steals correct rule amount, enemy power disables on infiltration, lab unlocks tech, etc.

### Psionic edge cases
- T030: immune units, air, robots, miners, heroes and psychic controllers reject psychic takeover when tags specify.
- T031: clone captures target; target changes owning command stream, colors and threat list; controller death returns it.
- T032: Psychic Tower captures exactly up to configured capacity; low power releases all current subjects.
- T033: Mastermind control cap and overload damage trigger at consistent ticks and end when subject removed.
- T034: simultaneous two-controller attempt uses documented deterministic priority and cannot double-own.
- T035: capture controller while controller has subjects, then sell, then disconnect produces no orphan references.
- T036: Psychic Dominator permanent capture cannot be released by owner/controller death if tagged permanent.
- T037: Bio Reactor accepts five matching passengers, adds configured supply; releasing/destroying occupants recomputes supply.
- T038: Slave Miner spawns workers, deposits ore and handles parent destruction/released slaves.
- T039: Grinder destroys and refunds eligible subjects; Clone Vats only duplicate eligible actual barracks recruits.
- T040: Floating Disc over enemy power disables network; over refinery drains credits not power.

### Superweapons and specialist behaviors
- T050: Iron Curtain and Force Shield immunity expiry and targeting; infantry restriction respected.
- T051: Weather, Nuke, Dominator, Mutator activate only when charged/powered/enabled and targets valid.
- T052: Robot Tank shuts down on controller power loss, resumes after restoration.
- T053: Siege Chopper ground deployment changes movement/weapon type.
- T054: IFV passenger changes its weapon category correctly on enter/exit.
- T055: aircraft returns to an available airfield/slot to reload; anti-air can hit projectiles if rules allow.

### AI/game modes/net
- T060: same seed AI vs AI yields reproducible winner and hashes.
- T061: 3 difficulty levels show distinct strategies without hidden resource injection by default.
- T062: 8 player match setup rejects duplicate forced start slots; alliance setup honored.
- T063: superweapon toggle disables both production and charging; MCV repack toggle gates redeploy.
- T064: multiplayer peers run same input order stream; hash every N ticks equals.
- T065: simulate 150ms latency + 2% packet loss; both peers finish same winner; resync if required.
- T066: 2+ hour solo endurance run stores snapshot and resumes without growth/leaks.
- T067: on loss user sees victory state/scoreboard/restart and replay and no further player orders apply.

## Performance benchmarks
Use reproducible map seed, browser and machine. Track 100/250/500/1000 entities, CPU time per tick p50/p95/p99, render FPS, input latency, MB RAM, GPU draw calls, pathfinding queue length. Targets determined after first profiling; avoid asserting unsupported 8-player 1000-unit matches as working.

## Debug tools
`?debug=1`: sim tick, FPS, entity count, power/economy, fog reveal, path node heatmap, owner-transfer edges, event log, replay hashes, desync exporter. No debug functions in production to grant money during multiplayer.


---

# Data contracts and illustrative TypeScript/pseudocode

Code below illustrates **target architecture**; it is **not production-ready or connected to a running project**.

## Strongly typed content
```ts
type PlayerId = number;
type EntityId = number;
type FactionId = 'coalition' | 'federation' | 'psionic';
type SimTick = number;
type Point = Readonly<{ x: number; y: number }>;

type ArmorClass = 'none'|'light'|'medium'|'heavy'|'structure'|'air'|'naval';
type MoveClass = 'foot'|'tracked'|'wheeled'|'hover'|'ship'|'air';

interface UnitDef {
  id: string; faction: FactionId; producerId: string;
  prerequisites: readonly string[];
  cost: number; buildTicks: number;
  maxHp: number; armor: ArmorClass;
  movement: MoveClass; speedQ16: number; sightCells: number;
  weaponIds: readonly string[]; specialAbilityIds: readonly string[];
  mindControlImmune: boolean; hero: boolean;
  transportCapacity?: number;
  spriteAtlasId: string;
}
interface BuildingDef {
  id: string; faction: FactionId;
  cost: number; buildTicks: number; maxHp: number;
  widthCells: number; heightCells: number;
  prerequisites: readonly string[];
  powerSupply: number; powerDemand: number;
  producerCategories: readonly string[];
  mindControlCapacity?: number;
}
interface WeaponDef {
  id: string; rangeCellsQ16: number; reloadTicks: number;
  damage: number; warheadId: string; projectileId?: string;
  validTargets: readonly string[];
}
interface GameRules {
  tickMs: number; oreYields: Record<string, number>;
  buildOffAllies: boolean; superweaponsEnabled: boolean;
  mcvRepacks: boolean; cratesEnabled: boolean;
  shortGame: boolean;
  units: Readonly<Record<string, UnitDef>>;
  buildings: Readonly<Record<string, BuildingDef>>;
  weapons: Readonly<Record<string, WeaponDef>>;
}
```

## Order protocol
```ts
type PlayerOrder =
  | { kind: 'move'; tick: SimTick; seq: number; player: PlayerId; ids: EntityId[]; to: Point }
  | { kind: 'attack'; tick: SimTick; seq: number; player: PlayerId; ids: EntityId[]; targetId: EntityId }
  | { kind: 'deploy'; tick: SimTick; seq: number; player: PlayerId; id: EntityId }
  | { kind: 'build'; tick: SimTick; seq: number; player: PlayerId; defId: string }
  | { kind: 'place'; tick: SimTick; seq: number; player: PlayerId; productionId: string; at: Point }
  | { kind: 'cancel'; tick: SimTick; seq: number; player: PlayerId; queueId: string }
  | { kind: 'ability'; tick: SimTick; seq: number; player: PlayerId; sourceId: EntityId; abilityId: string; at?: Point; targetId?: EntityId }
  | { kind: 'ally'; tick: SimTick; seq: number; player: PlayerId; other: PlayerId; allied: boolean };
```

## Fixed simulation tick pseudocode
```ts
function advance(world: World, orders: PlayerOrder[], rules: GameRules): World {
  const next = cloneStable(world);
  const accepted = validateAndSortOrders(next, orders); // tick, player, seq
  applyOrders(next, accepted);
  resolveStatuses(next);
  resolveEconomy(next);
  resolvePowerAndUnlocks(next);
  resolveProduction(next);
  resolvePathingAndMove(next);
  resolveTargetingAndProjectiles(next);
  resolveDamageAndVeterancy(next);
  resolveOwnershipChanges(next);
  resolveVisionAndWinConditions(next);
  scheduleAIBotOrders(next); // for future ticks, same legal player order API
  next.tick++;
  next.syncHash = hashStableState(next);
  return next;
}
```

## Mind control ownership pseudocode
```ts
function attemptControl(world: World, controllerId: EntityId, targetId: EntityId): boolean {
  const controller = world.entities.get(controllerId)!;
  const target = world.entities.get(targetId)!;
  if (!controller.alive || !target.alive || !controller.control) return false;
  if (!isHostile(controller, target) || hasImmunity(target, 'mind')) return false;
  if (!inRange(controller, target) || !controller.isOperational) return false;
  if (controller.control.targets.length >= controller.control.capacity) return false;
  // Atomic state mutation, deterministic priority for same-tick capture races.
  detachFromPreviousController(world, target);
  target.control = { controllerId, priorOwnerId: target.effectiveOwnerId, permanent: false };
  target.effectiveOwnerId = controller.effectiveOwnerId;
  controller.control.targets.push(targetId);
  invalidateCommandsAndVisibility(world, targetId);
  world.events.push({ type:'mindCaptured', controllerId, targetId });
  return true;
}
```

## Definitions for data-driven map/editor
```json
{
  "id": "twin-rivers-01",
  "displayName": "Twin Rivers",
  "width": 128,
  "height": 128,
  "theater": "temperate",
  "spawnPoints": [{"id":"A","x":12,"y":12},{"id":"B","x":112,"y":112}],
  "tilesRef": "maps/twin-rivers-01.tiles.json",
  "neutralEntities": [],
  "scenario": {"mode":"skirmish","victory":"elimination"}
}
```

## Superweapon configuration
```json
{
  "id":"psionic-dominator",
  "faction":"psionic",
  "producer":"psionic-dominator-array",
  "requiresPower":true,
  "chargeTicks":"BALANCE_VALUE_FROM_RULESET",
  "target":"area",
  "effects":[
    {"type":"damageBuildings","radiusCells":"BALANCE_VALUE"},
    {"type":"permanentMindControl","radiusCells":"BALANCE_VALUE","immuneTags":["mindimmune","airborne","garrisoned"]}
  ]
}
```

## Simulation command race rules
- Sort inputs lexicographically by `(tick, playerId, sequence)`; ownership validated at moment applied.
- Events that might conflict within tick (fatal damage + mind control, force shield + nuke, unload + sold building, power loss + tower capture) need explicit precedence and tests. Never rely on JavaScript `Map` iteration when entity allocation order is not stable.
- Snapshot retains RNG state, current AI thought state, production progress, cooldowns, control backlinks, selection not essential to sim, fog reveal, alliances and victory flags.
- Visual interpolation depends on snapshots but never calls authoritative sim mutations.