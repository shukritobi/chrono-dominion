# Chrono Dominion v0.7 — Specialist Warfare

Release date: 25 October 2026.

## Implemented in game

**Three original active abilities, one per faction.** Build a Barracks and Radar Array to unlock the `specialist` production slot, select the specialist and press **F** or use its action button.

| Faction | Unit | Ability | Cooldown |
|---|---|---|---|
| Coalition Forces | Chrono Operative | **Chrono Jump:** teleport to an unoccupied, walkable point within 6.2 logical tiles. F, then right-click destination | 20 seconds |
| Iron Federation | Arc Trooper | **Arc Discharge:** electrical blast affecting hostile units and defensive towers in a radius of 3.6 tiles, dealing 38 damage to units and 25 to defenses | 17 seconds |
| Psionic Order | Neural Disciple | **Neural Jam:** disabling pulse that stuns hostile units and defensive towers within 4.1 tiles for 3.8 seconds | 24 seconds |

- All abilities respect team ownership, target eligibility, cooldown and survival.
- Invalid Coalition teleport destinations do **not** spend the ability cooldown.
- The two area pulses do not damage friendly units or ordinary civilian/economy structures.
- The engine displays ability pulses, stun indicators and cooldown readouts; an armed teleport is cancellable using Escape.
- Computer AI now recruits specialists when its Radar and Barracks are available and activates appropriate abilities when enemies approach.
- Fixed an AI problem where a queued production job could prematurely skip all subsequent tactical decisions for that AI tick.
- Cooldown timestamps and stun status are stored on unit objects. Existing version-1 browser save files without these new fields remain loadable.

## Original visual assets

Three static isometric SVG pilot sprites have been added and linked into the game and production sidebar:

- `art/pilot/coalition-specialist.svg`: Chrono Operative
- `art/pilot/federation-specialist.svg`: Arc Trooper
- `art/pilot/psionic-specialist.svg`: Neural Disciple

Registered in `art/manifest.json` against the original 308-family asset register. These are **single-frame original pilot illustrations**, not fully animated eight-facing infantry sheets.

## Input reference

- **F**, or selected specialist's action button: activate unique ability.
- Coalition-only: **F then right-click** clear terrain within the 6.2-tile ability range.
- Escape while targeting: cancel unspent Chrono Jump.
- X Stop, G Guard, B Hold, V Aggressive, T attack-move continue from v0.6.
- F6 save / F9 load continue from v0.5.

## Validation

`npm run check` includes `tests/abilities.test.mjs` and all existing suites. New tests check successful/blocked teleport, cooldowns, friendly-fire rejection, Arc pulse damage, time-limited Psionic disabling, legacy save compatibility, AI specialist ability use and battlefield rendering.

GitHub Actions validates the six existing tank layers and supporting SVGs as before, plus all three specialist pilot sprites.

## Known limitations

- Simplified two-faction skirmish AI, no multiplayer or campaigns yet.
- Most infantry and structures remain static SVG pilots or procedural placeholders. No final high-detail Blender-exported animation atlases yet.
- Aether/C&C-equivalent specialist mechanics and balance are original prototypes, not a reproduction of proprietary game rules.
- Specialist UI supports one selected caster at a time, not simultaneous casting or multiple-target selection.
- Area abilities currently resolve instantly without projectile travel; Psionic disable state has visual indication but no bespoke stunned animation.
- Specialist weapon and ability sounds are not implemented.

## Next candidate milestone: v0.8

- Add a map selector preview and more meaningful skirmish start options.
- Upgrade infantry to 8-facing animated movement/weapon sprites with a reproducible render pipeline.
- Add faction-exclusive support vehicles and a repair/rearm mechanic.
- Improve AI scouting and tactics around specialists and harvester protection.
- Expand victory conditions and score screen.
