#!/usr/bin/env python3
"""Strict preview-only pixel QA for PSI-VEH-001 original mining crawler."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

STATES = ("idle", "move", "harvest", "destroyed")
MIN = {"move_rgba_80": 90, "harvest_rgba_80": 180,
       "harvest_alpha_80": 90, "destroyed_alpha_80": 145,
       "adjacent_rgba_80": 65}


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    return sum(any(pixel) if isinstance(pixel, tuple) else bool(pixel)
               for pixel in ImageChops.difference(a, b).getdata())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True, type=Path)
    stage = parser.parse_args().stage
    images = {state: {} for state in STATES}
    hashes = set()
    atlas = Image.new("RGBA", (5120, 640))
    report = {"asset_id": "PSI-VEH-001", "asset": "Indenture Mining Crawler",
              "preview_only": True, "states": list(STATES), "facings": 32,
              "frame_size": [160, 160], "minimum_thresholds": MIN,
              "directions": {}, "adjacent_rgba_80": {},
              "minimum_canvas_margin_160": 160}
    for row, state in enumerate(STATES):
        for facing in range(32):
            path = stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as src:
                assert src.mode == "RGBA" and src.size == (160, 160), (path, src.mode, src.size)
                image = src.copy()
            bbox = image.getchannel("A").getbbox()
            assert bbox, (state, facing, "empty frame")
            margin = min(bbox[0], bbox[1], 160-bbox[2], 160-bbox[3])
            assert margin >= 2, (state, facing, "clipped", bbox)
            report["minimum_canvas_margin_160"] = min(
                report["minimum_canvas_margin_160"], margin)
            digest = hashlib.sha256(image.tobytes()).hexdigest()
            assert digest not in hashes, ("duplicate direction or pose", state, facing)
            hashes.add(digest)
            images[state][facing] = image
            atlas.paste(image, (160*facing, 160*row))
    atlas_path = stage/"psionic-indenture-crawler-32-preview.png"
    atlas.save(atlas_path, optimize=True)
    for facing in range(32):
        small = {state: images[state][facing].resize(
            (80, 80), Image.Resampling.LANCZOS) for state in STATES}
        idle = small["idle"]
        metrics = {
            "move_rgba_80": changed(idle, small["move"]),
            "harvest_rgba_80": changed(idle, small["harvest"]),
            "harvest_alpha_80": changed(idle, small["harvest"], True),
            "destroyed_rgba_80": changed(idle, small["destroyed"]),
            "destroyed_alpha_80": changed(idle, small["destroyed"], True),
            "harvest_alpha_160": changed(images["idle"][facing],
                                         images["harvest"][facing], True),
            "destroyed_alpha_160": changed(images["idle"][facing],
                                           images["destroyed"][facing], True),
        }
        for key in ("move_rgba_80", "harvest_rgba_80",
                    "harvest_alpha_80", "destroyed_alpha_80"):
            assert metrics[key] >= MIN[key], (facing, key, metrics[key], MIN[key])
        report["directions"][f"{facing:02d}"] = metrics
        next_image = images["idle"][(facing+1)%32].resize(
            (80, 80), Image.Resampling.LANCZOS)
        adjacent = changed(idle, next_image)
        assert adjacent >= MIN["adjacent_rgba_80"], (facing, adjacent)
        report["adjacent_rgba_80"][f"{facing:02d}"] = adjacent
    for size in (160, 80):
        sheet = Image.new("RGBA", (size*8, size*4), (18, 23, 30, 255))
        for row, state in enumerate(STATES):
            for col, facing in enumerate(range(0, 32, 4)):
                image = images[state][facing]
                if size == 80:
                    image = image.resize((80, 80), Image.Resampling.LANCZOS)
                sheet.alpha_composite(image, (col*size, row*size))
        sheet.save(stage/f"psionic-indenture-crawler-contact-{size}.png")
    report["unique_frame_hashes"] = len(hashes)
    report["ranges"] = {
        key: {"min": min(d[key] for d in report["directions"].values()),
              "max": max(d[key] for d in report["directions"].values())}
        for key in next(iter(report["directions"].values()))
    }
    report["ranges"]["adjacent_rgba_80"] = {
        "min": min(report["adjacent_rgba_80"].values()),
        "max": max(report["adjacent_rgba_80"].values())}
    report["atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    (stage/"pixel-qa.json").write_text(json.dumps(report, indent=2)+"\n")
    print("PASS PSI-VEH-001 128 unique unclipped RGBA sprites, all 32 directions")
    print(json.dumps(report["ranges"], sort_keys=True))


if __name__ == "__main__":
    main()
