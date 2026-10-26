# Built-in original audio (v2.24)

**Chrono Dominion now ships a 473-file original sound library in its public game build.** Sound folders no longer need to be selected manually. The repository's source is `audio/voices.js` and `tools/audio/build_builtin.py`, and the bundled assets are generated at `audio/builtin/`.

**Composition:** 388 English radio-style unit and announcer clips, 82 procedural gameplay effects, and 3 original electronic battle music loops (MP3). The voices are first-generation eSpeak prototypes. All lines and procedural sound-design algorithms are original to Chrono Dominion. No Red Alert or Yuri's Revenge recordings are present.

## How playback works

The game fetches `./audio/builtin/audio-map.json` once at startup; MP3 recordings load only when an event or music track plays. Built-in sound mappings cover:
- `voice.select.coalition.soldier` and other faction/unit order cues
- `announce.unitLost`, `announce.baseUnderAttack`, `announce.structureLost` and other strategic messages
- `shot.tank`, `shot.heavy`, `impact`, `explosion`, `build`, `queue`, `ability`
- `music.menu`, `music.battle`, `music.victory`

Playback priority: **locally imported override → built-in MP3 → browser speech synthesis (where appropriate) → original Web Audio fallback**. Players only need to switch on audio once, which satisfies browser autoplay restrictions.

The optional local-file importer remains for private packs. The original game clips are not included in this public repository.

## Build and release

```bash
sudo apt-get install espeak ffmpeg
python3 tools/audio/build_builtin.py --check
python3 tools/audio/build_builtin.py
npm run audio:check
npm run serve
```

On GitHub Pages deployment, the workflow bakes missing MP3s automatically and stages them for deployment. The workflow also attempts to commit the freshly generated binary assets back to `main` so they are directly browsable in GitHub under `audio/builtin/`.

**Quality note:** These are deliberately robotic synthetic placeholders. For final production, replace them with licensed natural performances and mastered music. Existing event keys continue working.

## Counts

- 270 active-unit dialogue clips: three factions × six playable unit kinds × five events × three variations
- 18 future-airship dialogue clips
- 100 announcer recordings: 50 strategic event types × two variations
- 82 procedural SFX recordings
- 3 background music tracks
- Total: **473 MP3 files**, plus a manifest

If a browser doesn't support audio or the bundle is unavailable, gameplay still works via fallback effects.
