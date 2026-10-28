#!/usr/bin/env python3
"""One-shot promotion of validated original Blender vehicles into playable atlases.

Three tank atlases come from immutable, previously QA-passed 32-facing Actions
artifacts; recon and harvester atlases come from fresh, isolated Blender renders.
Never replace existing approved sprites. Fail before copying on any incomplete pack.
"""
import json
import shutil
from pathlib import Path
from PIL import Image

FACTIONS = ("coalition", "federation", "psionic")
STUDIO_KINDS = ("recon", "harvester")
TANK_FILES = {
    "coalition": "coalition-lynx-battle-tank.blend",
    "federation": "federation-bull-heavy-tank.blend",
    "psionic": "psionic-viper-light-tank.blend",
}
TANK_STATES = {"idle": 1, "move": 1, "attack": 1, "destroyed": 1}
UNIT_STATES = {"idle": 1, "move": 2, "attack": 1}
SIZE = 160


def validate_image(path, size=(SIZE, SIZE)):
    if not path.is_file():
        raise FileNotFoundError(path)
    with Image.open(path) as image:
        image.load()
        if image.format != "PNG" or image.mode != "RGBA" or image.size != size:
            raise ValueError(f"Incorrect PNG format, transparency or dimensions: {path}")
        alpha = image.getchannel("A")
        lo, hi = alpha.getextrema()
        if hi == 0 or lo == 255:
            raise ValueError(f"Empty/opaque frame: {path}")
        return image.copy()


def pack_tank(stage, faction, output):
    """Keep all 32 directions of the P0 preview instead of resampling to 8."""
    folder = stage / "tanks" / faction
    source = folder / TANK_FILES[faction]
    if not source.is_file() or source.stat().st_size < 1000:
        raise FileNotFoundError(f"Missing editable Blender model: {source}")
    sheet = Image.new("RGBA", (SIZE * 32, SIZE * len(TANK_STATES)), (0, 0, 0, 0))
    for row, state in enumerate(TANK_STATES):
        for facing in range(32):
            path = folder / "frames" / state / f"{facing:02d}.png"
            tile = validate_image(path)
            sheet.paste(tile, (facing * SIZE, row * SIZE))
    name = f"{faction}-tank.png"
    atlas = output / name
    sheet.save(atlas, optimize=True)
    validate_image(atlas, sheet.size)
    return (
        {"file": name, "directions": 32, "states": TANK_STATES,
         "pivot": [SIZE // 2, round(SIZE * .88)],
         "canvasSize": [SIZE * 32, SIZE * len(TANK_STATES)]},
        atlas, source,
    )


def check_studio(stage, faction, kind):
    folder = stage / f"studio-{faction}-{kind}"
    manifest = json.loads((folder / "packed" / "manifest.json").read_text())
    if manifest.get("format") != "chrono-blender-v1" or manifest.get("frameSize") != SIZE:
        raise ValueError(f"Invalid staged manifest: {folder}")
    entry = manifest["entries"][faction][kind]
    if (entry["file"] != f"{faction}-{kind}.png"
            or entry["directions"] != 8 or entry["states"] != UNIT_STATES
            or entry["canvasSize"] != [SIZE * 8, SIZE * 4]):
        raise ValueError(f"Incorrect staged unit animation contract: {folder}")
    atlas = folder / "packed" / entry["file"]
    source = folder / "sources" / f"{faction}-{kind}.blend"
    if not source.is_file() or source.stat().st_size < 1000:
        raise FileNotFoundError(source)
    img = validate_image(atlas, (SIZE * 8, SIZE * 4))
    alpha = img.getchannel("A")
    for direction in range(8):
        for frame in range(4):
            if not alpha.crop((direction * SIZE, frame * SIZE,
                               (direction + 1) * SIZE, (frame + 1) * SIZE)).getbbox():
                raise ValueError(f"Missing frame {direction}/{frame}: {atlas}")
    return entry, atlas, source


def publish(stage, repo):
    target = repo / "art" / "baked-v1"
    source_target = repo / "art" / "sources" / "blender"
    manifest_path = target / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("format") != "chrono-blender-v1" or manifest.get("frameSize") != SIZE:
        raise ValueError("Incompatible production sprite format")
    if set(manifest["entries"]) != set(FACTIONS):
        raise ValueError("Faction mismatch in production art")
    promoted = {}
    # Check all 9 images and all 9 editable .blend files before touching production.
    for faction in FACTIONS:
        for kind in ("tank",) + STUDIO_KINDS:
            if kind in manifest["entries"][faction]:
                raise ValueError(f"{faction}/{kind} is already in production; refusing overwrite")
            item = (pack_tank(stage, faction, stage / "packed-release")
                    if kind == "tank" else check_studio(stage, faction, kind))
            promoted[faction, kind] = item
    for (faction, kind), (entry, atlas, blend) in promoted.items():
        shutil.copyfile(atlas, target / entry["file"])
        shutil.copyfile(blend, source_target / f"{faction}-{kind}.blend")
        manifest["entries"][faction][kind] = entry
    # Last write: publish manifest only after every source and atlas exists.
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print("Published 9 new playable original Blender unit atlases: 3 full 32-facing tanks,"
          " 3 recon vehicles, 3 ore harvesters; retained all previously published sprites.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, default=Path("generated/release"))
    parser.add_argument("--repo", type=Path, default=Path("."))
    args = parser.parse_args()
    (args.stage / "packed-release").mkdir(parents=True, exist_ok=True)
    publish(args.stage, args.repo)
