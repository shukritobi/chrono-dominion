#!/usr/bin/env python3
"""Strict pixel QA for original PSI-VEH-004 32-facing preview-only sprites."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

SIZE = 160
FACINGS = 32
STATES = ("idle", "move", "attack", "destroyed")


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    d = ImageChops.difference(a, b)
    return sum(bool(any(pixel) if isinstance(pixel, tuple) else pixel)
               for pixel in d.getdata())


def load(path):
    with Image.open(path) as im:
        assert im.size == (SIZE, SIZE) and im.mode == "RGBA", (
            "Invalid transparent 160px sprite", str(path), im.size, im.mode)
        result = im.copy()
    bbox = result.getchannel("A").getbbox()
    assert bbox and bbox[0] >= 2 and bbox[1] >= 2 and bbox[2] <= 158 and bbox[3] <= 158, (
        "Clipped or empty sprite", str(path), bbox)
    return result


def small(im):
    return im.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--stage", type=Path, required=True)
    args = p.parse_args()
    stage = args.stage
    atlas = Image.new("RGBA", (SIZE * FACINGS, SIZE * len(STATES)))
    frames = {s: {} for s in STATES}
    for row, state in enumerate(STATES):
        for facing in range(FACINGS):
            frame = load(stage / "frames" / state / ("%02d.png" % facing))
            frames[state][facing] = frame
            atlas.paste(frame, (SIZE * facing, SIZE * row))
    atlas_path = stage / "psionic-hallucination-drone-32-preview.png"
    atlas.save(atlas_path, optimize=True)
    report = {
        "asset_register_id": "PSI-VEH-004",
        "preview_only": True,
        "facing_count": FACINGS,
        "states": list(STATES),
        "frame_count": FACINGS * len(STATES),
        "acceptance": {
            "move_vs_idle_rgba_80_min": 50,
            "attack_vs_idle_rgba_80_min": 50,
            "destroyed_vs_idle_alpha_80_min": 90,
            "adjacent_idle_rgba_80_min": 40,
        },
        "per_facing": {},
    }
    for facing in range(FACINGS):
        states = {s: small(frames[s][facing]) for s in STATES}
        next_idle = small(frames["idle"][(facing + 1) % FACINGS])
        row = {
            "move_vs_idle_rgba_80": changed(states["move"], states["idle"]),
            "move_vs_idle_alpha_80": changed(states["move"], states["idle"], True),
            "attack_vs_idle_rgba_80": changed(states["attack"], states["idle"]),
            "attack_vs_idle_alpha_80": changed(states["attack"], states["idle"], True),
            "destroyed_vs_idle_rgba_80": changed(states["destroyed"], states["idle"]),
            "destroyed_vs_idle_alpha_80": changed(states["destroyed"], states["idle"], True),
            "adjacent_idle_rgba_80": changed(states["idle"], next_idle),
        }
        for key, minimum in report["acceptance"].items():
            assert row[key] >= minimum, (
                "Actual 80px art gate failed", facing, key, row[key], minimum)
        report["per_facing"]["%02d" % facing] = row
    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (17, 24, 33, 255))
        for row, state in enumerate(STATES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                im = frames[state][facing]
                if size == 80:
                    im = small(im)
                sheet.alpha_composite(im, (col * size, row * size))
        sheet.save(stage / ("psionic-hallucination-contact-%d.png" % size))
    report["atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print("PASS 128 original Psionic Hallucination Drone sprites; no production outputs")
    for key in next(iter(report["per_facing"].values())):
        vals = [r[key] for r in report["per_facing"].values()]
        print(key, "MIN", min(vals), "MAX", max(vals),
              "MEAN", round(sum(vals) / len(vals), 1))


if __name__ == "__main__":
    main()
