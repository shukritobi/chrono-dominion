# Chrono Dominion Original Voices & Audio Atlas — v2.22

**Status:** implemented browser-synthesized original voice library and large audio production catalog; downloadable prototype files are packaged separately. None of the dialogue is transcribed from Command & Conquer, nor does it sample game recordings. All voice lines are authored for Chrono Dominion.

## Audio direction

- **Coalition Forces**: clean command radio, crisp tactical infantry, confident vehicle crews, restrained announcer.
- **Iron Federation**: low, gritty frontline radio, tracked heavy machinery, steel/industrial rhythm, deliberate booming aircraft voices.
- **Psionic Order**: reverberant close-mic speech, eerie controlled delivery, phase and neural-wave sound treatments.
- **Command announcer**: neutral, articulate short phrases; mission-critical updates have priority over routine unit acknowledgements.

The feeling should recall classic turn-of-the-millennium RTS **structure**, not reuse any Westwood voice recording, actor impersonation, melody, faction names or characteristic voice performance.

### Memorable original dialogue examples

| Situation | Chrono Dominion sample |
|---|---|
| Loss | “Unit lost.” / “Friendly unit no longer responding.” |
| New Federation infantry | “Rifle section reporting.” |
| Heavy tank | “Mammoth armour standing by.” |
| Federation airship (planned) | “Iron Leviathan checking in from the clouds.” |
| Coalition phase unit | “Phase operative on station.” |
| Psionic troops | “The signal is clear.” |
| Base threat | “Warning. Hostile forces approaching headquarters.” |
| Power shortfall | “Insufficient power.” |
| Victory | “The battlefield is ours.” |

## Large playable/synthetic catalog

The source of truth is `audio/voices.js`; it creates **unique stable IDs** for every line:

`voice.<cue>.<faction>.<unit-type>.<variation>`

The current factions are `coalition`, `federation` and `psionic`.
Unit types: `soldier`, `specialist`, `tank`, `heavy`, `harvester`, `recon` and `airship` (airships scripted in advance for upcoming gameplay).
Voice events: `ready`, `select`, `move`, `attack`, `guard`, `hold`, `underFire`, `retreat`, `lowHealth`, `kill`, `death`, `ability`.

The announcer has ~50 independent operational event families, including resource management, building loss, repairs, discoveries, alerts, strategic weapons and victory/defeat. Each event contains several independently scripted alternatives.

A further **40 effect families** (3 target variations each) and **12 music concepts** (2 arrangements each) are registered by the exporter. These are *planned production slots*, not claims that all recorded or rendered files already exist.

Run this command to create a detailed CSV and JSON asset register:

```bash
node tools/audio/export-register.mjs
```

This writes `audio/catalog-export/full-audio-asset-register.csv` and `.json`. These are machine-readable editable production lists.

## Audio engine behavior

- Off by default until the user enables audio; required by browser autoplay behavior.
- Select a unit, order movement/attack, or train a unit to hear its own faction/role dialogue when device TTS is available.
- Announcer is connected to game start, loading a saved game, structure attack/loss, base warnings, friendly losses and match end.
- Existing imported private sound packs have playback priority. When no external clip is assigned, the audio engine uses device speech synthesis; if unavailable, it uses the Web Audio beep/effect fallback.
- Rate-limits acknowledgement overlap; urgent announcer messages interrupt unimportant voice chatter.
- New **ENABLE UNIT VOICES & ANNOUNCER** toggle in the mixer; preview the Federation infantry voice using the adjacent button.
- Voice availability and timbre vary with the platform/browser. Browser speech synthesis does not create downloadable WAV/MP3 recordings.

## Separately generated original starter pack

A prototype **473-file** MP3 collection has been generated: **388 dialogue clips**, **82 procedural effects**, **3 original synthesizer music loops**. Audio is local-only to the user until separately imported. It contains `audio-map.json` and `inventory.csv`, and the game accepts the folder through **⚙ AUDIO → IMPORT LOCAL SOUND FOLDER**. It is **not committed** into this public GitHub repository.

The prototype voices use eSpeak with different pitches/speeds, EQ, band-limiting and slight radio/echo treatments. They intentionally do not imitate Westwood performances; they are sound-design placeholders. Future production can replace them with licensed higher-quality voices or human voice actors without changing event IDs.

### Naming and delivery constraints

Final downloadable assets should be:
- Speech: dry, intelligible mono WAV masters at 48 kHz / 24-bit; compressed 44.1/48 kHz MP3/AAC game derivatives. Avoid clipping and heavy tail overlap.
- Combat SFX: mono for positionable effects, stereo for wide ambiences; random pitch and sample variation.
- Music: original layered 120–145 BPM electro-industrial tracks, adaptive transitions for menu, combat, low power and victory.
- Keep text + cue ID + performer/license information with every produced recording; use consistent key-based replacement.

### Next production milestones

1. Replace voice prototypes with consistent high-quality TTS performances recorded in batches, or commissioned character reads.
2. Master and ship curated royalty-free/original SFX into the GitHub Pages game automatically.
3. Add aircraft, naval, rare events, faction-specific computer advisors and adaptive music layers.
4. Add speech priority queues, duck music during announcer messages, and directional gain/attenuation based on camera position.
5. Review quality, loudness, sample metadata, performance and automated replay stress tests.

**No copies of Red Alert 2, Yuri's Revenge or copyrighted soundboard recordings belong in this pack.**
