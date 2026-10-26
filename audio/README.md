# Chrono Dominion Audio Soundscape (v2.21)

Chrono Dominion ships an **original procedurally generated music bed** and **synthesized game effects**. Nothing in this public repository contains EA / Westwood game audio. The audio engine is opt-in and retains the existing mute-on-first-launch behavior.

## What is wired into gameplay?

- Unit selection: `select` with player faction and unit kind.
- Unit orders: `move` / `attack`, throttled so group commands don't spam voices.
- Weapons: `shot.<kind>`, e.g. `shot.soldier`, `shot.tank`, `shot.heavy`.
- Damage: `impact.<kind>`; destroyed visible entities play `explosion`.
- Production: `queue` and `ready` for delivered units, `build` for structures.
- Specialist abilities: `ability`. End of game: `win` or `defeat`.
- Music: menu/battle scene soundtrack, paused when match is paused or finished.
- Settings: main sound toggle, separate SFX/music sliders, music enable checkbox.

## Use extracted sounds from a game you own (private/local use)

**Do not commit or upload EA / Westwood retail audio to this public repository or to GitHub Pages.** Sound packs can be loaded locally through the game itself. No upload or server persistence occurs. You need to reselect your folder after a page reload. Volume preferences alone are saved in localStorage.

1. In your legally acquired Red Alert 2 installation, open **XCC Mixer**.
2. For Red Alert 2, inspect `language.mix > audio.mix > audio.bag / audio.idx`. For Yuri's Revenge, inspect `langmd.mix > audiomd.mix > audio.bag / audio.idx`.
3. Use XCC's **Sound Editor** to export selected unit sounds and effects to ordinary WAV files. You can export your owned music tracks from the relevant music containers and convert to browser-compatible WAV, MP3 or OGG if necessary. Raw MIX, BAG, IDX and AUD containers are not browser audio formats and are **not supported directly**.
4. Organize the files under one folder, e.g. `my-sounds/ra2/` and `my-sounds/tracks/`; keep them on your computer, not in the public repository.
5. Place an optional mapping file named `audio-map.json` in that same folder. Start from [audio-map.example.json](./audio-map.example.json) and replace example filenames with the **actual** file names extracted from your copies.
6. Start a skirmish at [Chrono Dominion on GitHub Pages](https://shukritobi.github.io/chrono-dominion/). In the top bar, click `♪ OFF`, then `⚙ AUDIO`, then **IMPORT LOCAL SOUND FOLDER**. Select the enclosing sound folder.
7. If an event has no mapped file or its file cannot be played, Chrono Dominion keeps working using its synthesized sound.

The browser accepts WAV, OGG, MP3, M4A, and WebM audio files, with a per-file limit of 32 MiB. Local sound folder selection is supported on Chromium-based desktop browsers. The importer skips unsupported formats, and counts how many files were matched to game events.

### Naming conventions (without a manifest)

Files such as `shot.wav`, `impact.ogg`, `explosion.wav`, `select.wav`, `move.wav`, `attack.wav`, `ready.wav`, `music-battle.ogg` or `music-menu.ogg` are recognized directly. For Red Alert and Yuri's Revenge's often cryptic filenames, use `audio-map.json`.

### Mapping syntax

```json
{
  "events": {
    "voice.select.coalition.soldier": ["ra2/ranger-yes-1.wav", "ra2/ranger-yes-2.wav"],
    "voice.move.soldier": ["ra2/ranger-move.wav"],
    "attack.tank": ["ra2/tank-attack.wav"],
    "shot.tank": ["ra2/tank-cannon.wav"],
    "shot.heavy": ["ra2/heavy-cannon.wav"],
    "explosion": ["ra2/explosion.wav"]
  },
  "music": {
    "music.menu": ["tracks/menu.ogg"],
    "music.battle": ["tracks/battle-a.ogg", "tracks/battle-b.ogg"]
  }
}
```

Mappings use paths **relative to the folder you select**. Any mapped key can contain several filenames; an available file is chosen randomly. Game voice lookup tries specific keys (faction and unit), then general keys, then synthesized defaults. A single folder may contain the entire extracted collection, but only files referenced by the manifest or matching naming conventions will play.

### Openly redistributable alternative libraries

For audio that may be committed to the public game after selecting useful files, see:

- [Kenney Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds) (CC0)
- [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds) (CC0)
- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) (CC0)

The local importer is intentionally separate from public distributable assets. Licenses should accompany any redistributed CC0/third-party pack.

## Developers

The independent `window.ChronoAudio` API implements `unlock()`, `setEnabled()`, `play(event, metadata)`, `setScene()`, `setSfxVolume()`, `setMusicVolume()`, `setMusicEnabled()`, `importFiles(FileList)`, and `clearLocalPack()`. The existing API was preserved. It uses Web Audio synthesis as fallback and HTMLAudioElement for file playback. The game continues to function when audio is unsupported or muted.

Run `npm run check` including `tests/audio-soundscape-v221.test.mjs` to verify settings, safe defaults, file mapping and sound events.
