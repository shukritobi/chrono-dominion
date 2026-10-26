#!/usr/bin/env python3
"""Chrono Dominion single-asset Blender Studio QA and controlled publication.

The studio NEVER edits production art during preview. Production edits require
explicit --approve PUBLISH and a fully validated single-asset staging manifest.
"""
import argparse
import json
import os
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FACTIONS = ("coalition", "federation", "psionic")
UNITS = ("soldier", "specialist", "tank", "heavy", "recon", "harvester", "aircraft")
BUILDINGS = ("hq", "generator", "refinery", "barracks", "factory",
             "radar", "tech", "turret", "beam", "airfield")
KINDS = UNITS + BUILDINGS
EXPECTED_STATES = {
    "unit": {"idle": 1, "move": 2, "attack": 1},
    "building": {"idle": 2, "construct": 2, "damaged": 1}
}
FRAME_SIZE = 160


def inspect(stage: Path, faction: str, kind: str):
    if faction not in FACTIONS or kind not in KINDS:
        raise ValueError("Unknown faction or asset class")
    manifest_path = stage / "packed" / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf8"))
    if manifest.get("format") != "chrono-blender-v1" or manifest.get("frameSize") != FRAME_SIZE:
        raise ValueError("Incorrect sprite manifest format or frame size")
    entries = manifest.get("entries", {})
    if set(entries) != set(FACTIONS):
        raise ValueError("Studio manifest must list the three known factions")
    if any(set(entries[f]) != ({kind} if f == faction else set()) for f in FACTIONS):
        raise ValueError("Studio may contain only the selected faction and asset")
    spec = entries[faction][kind]
    states = EXPECTED_STATES["unit" if kind in UNITS else "building"]
    directions = 8 if kind in UNITS else 1
    if spec.get("states") != states or spec.get("directions") != directions:
        raise ValueError("Missing animation states or incorrect directions")
    filename = f"{faction}-{kind}.png"
    if spec.get("file") != filename:
        raise ValueError("Unexpected atlas filename")
    sheet_path = stage / "packed" / filename
    source_path = stage / "sources" / f"{faction}-{kind}.blend"
    if not source_path.is_file() or source_path.stat().st_size < 1000:
        raise ValueError("Editable Blender source is missing or too small")
    with Image.open(sheet_path) as img:
        img.load()
        if img.mode != "RGBA" or img.size != (directions * FRAME_SIZE, sum(states.values()) * FRAME_SIZE):
            raise ValueError(f"Invalid PNG atlas image mode or dimensions: {img.mode}, {img.size}")
        alpha = img.getchannel("A")
        if alpha.getextrema()[0] > 0 or alpha.getextrema()[1] == 0:
            raise ValueError("Atlas must have transparent background and visible geometry")
        for facing in range(directions):
            for row in range(sum(states.values())):
                crop = alpha.crop((facing * FRAME_SIZE, row * FRAME_SIZE,
                                   (facing + 1) * FRAME_SIZE, (row + 1) * FRAME_SIZE))
                if crop.getbbox() is None:
                    raise ValueError(f"Empty animation frame: facing={facing} row={row}")
        if kind in BUILDINGS:
            first_idle = img.crop((0, 0, FRAME_SIZE, FRAME_SIZE))
            second_idle = img.crop((0, FRAME_SIZE, FRAME_SIZE * 2))
            # Compare full RGBA bytes. ImageChops.getbbox() alone checks
            # the alpha channel and misses genuine emissive color pulses.
            if first_idle.tobytes() == second_idle.tobytes():
                raise ValueError("Two building idle frames are pixel-identical")
        copied = img.copy()
    return manifest, spec, copied, sheet_path, source_path


def preview(stage: Path, faction: str, kind: str):
    manifest, spec, sprite, _, _ = inspect(stage, faction, kind)
    states = spec["states"]
    building = kind in BUILDINGS
    choices = [0] if building else [0, 2, 4, 6]
    per_row = 2 if building else 4
    tile = 226
    header = 75
    rows = len(states)
    canvas = Image.new("RGB", (tile * per_row + 30, tile * rows + header + 20), (12, 20, 31))
    draw = ImageDraw.Draw(canvas)
    draw.text((16, 15), f"CHRONO DOMINION  /  BLENDER ASSET STUDIO", fill=(115, 215, 245))
    draw.text((16, 40), f"{faction.upper()}  -  {kind.upper()}  |  160px original frames", fill=(227, 235, 248))
    offset = 0
    for state, frame_count in states.items():
        for col in range(per_row):
            direction = choices[col] if not building else 0
            frame = min(col % max(1, frame_count), frame_count - 1) if building else 0
            sheet_frame = sprite.crop((
                direction * FRAME_SIZE, (offset + frame) * FRAME_SIZE,
                (direction + 1) * FRAME_SIZE, (offset + frame + 1) * FRAME_SIZE
            ))
            x = 15 + col * tile
            y = header + list(states).index(state) * tile
            for gy in range(y, y + 192, 16):
                for gx in range(x, x + 192, 16):
                    color = (45, 57, 71) if ((gx - x + gy - y) // 16) % 2 else (63, 74, 88)
                    draw.rectangle((gx, gy, gx + 15, gy + 15), fill=color)
            frame_big = sheet_frame.resize((192, 192), Image.Resampling.LANCZOS)
            canvas.paste(frame_big, (x, y), frame_big)
            draw.text((x, y + 195), f"{state.upper()}  #{frame + 1}  {direction * 45} deg",
                      fill=(230, 236, 246))
        offset += frame_count
    dst = stage / "preview.png"
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, optimize=True)
    return dst


def publish(stage: Path, repo: Path, faction: str, kind: str, approval: str):
    if approval != "PUBLISH":
        raise PermissionError("Publishing requires --approve PUBLISH")
    manifest, spec, _, atlas_path, source_path = inspect(stage, faction, kind)
    production_dir = repo / "art" / "baked-v1"
    source_dir = repo / "art" / "sources" / "blender"
    current_path = production_dir / "manifest.json"
    current = json.loads(current_path.read_text(encoding="utf8"))
    if current.get("format") != "chrono-blender-v1" or current.get("frameSize") != FRAME_SIZE:
        raise ValueError("Existing production manifest is incompatible")
    old_entries = current.get("entries")
    if not isinstance(old_entries, dict) or any(f not in old_entries for f in FACTIONS):
        raise ValueError("Existing production manifest is incomplete")
    # Preserve every existing asset except the chosen one.
    merged = {f: dict(old_entries[f]) for f in FACTIONS}
    merged[faction][kind] = spec
    source_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(atlas_path, production_dir / atlas_path.name)
    shutil.copy2(source_path, source_dir / source_path.name)
    current["entries"] = merged
    tmp = current_path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(current, indent=2) + "\n", encoding="utf8")
    os.replace(tmp, current_path)
    return len(merged[faction])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "preview", "publish"))
    parser.add_argument("--stage", type=Path, default=Path("generated/chrono-studio"))
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--faction", choices=FACTIONS, required=True)
    parser.add_argument("--kind", choices=KINDS, required=True)
    parser.add_argument("--approve", default="")
    args = parser.parse_args()
    if args.command == "validate":
        _, _, _, sheet, source = inspect(args.stage, args.faction, args.kind)
        print(f"Validated: {sheet}; editable model: {source}")
    elif args.command == "preview":
        print(f"Preview: {preview(args.stage, args.faction, args.kind)}")
    else:
        count = publish(args.stage, args.repo, args.faction, args.kind, args.approve)
        print(f"Published only {args.faction}/{args.kind}; now {count} entries in faction")


if __name__ == "__main__":
    main()
