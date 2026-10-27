#!/usr/bin/env python3
"""Quantitative pixel QA for the original Psionic Phase-Loom 32-facing preview.

Reads only generated preview PNGs, writes contact sheets and JSON; never edits
production atlases or game manifests. Every direction/state is checked at 80px.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops

STATES = ("idle", "move", "attack", "destroyed")


def difference(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(1 for pixel in diff.getdata()
               if (any(pixel) if isinstance(pixel, tuple) else pixel))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    stage = parser.parse_args().stage
    images = {}
    atlas = Image.new("RGBA", (160 * 32, 160 * len(STATES)))
    report = {"asset": "Psionic Phase-Loom Hover Carrier",
              "asset_register_id": "PSI-VEH-008",
              "frame_size": 160, "facings": 32,
              "states": list(STATES), "directions": {}, "adjacent_rgba_80": {}}
    for row, state in enumerate(STATES):
        images[state] = {}
        for facing in range(32):
            path = stage / "frames" / state / f"{facing:02d}.png"
            with Image.open(path) as source:
                assert source.size == (160, 160), (path, source.size)
                assert source.mode == "RGBA", (path, source.mode)
                image = source.copy()
            bbox = image.getchannel("A").getbbox()
            assert bbox and bbox[0] >= 2 and bbox[1] >= 2 and bbox[2] <= 158 and bbox[3] <= 158, (
                state, facing, "empty or clipped", bbox)
            images[state][facing] = image
            atlas.paste(image, (facing * 160, row * 160))
    atlas.save(stage / "psionic-phase-loom-carrier-32-facing-preview.png", optimize=True)

    for facing in range(32):
        small = {state: images[state][facing].resize(
            (80, 80), Image.Resampling.LANCZOS) for state in STATES}
        idle = small["idle"]
        metrics = {
            "move_rgba_80": difference(idle, small["move"]),
            "attack_rgba_80": difference(idle, small["attack"]),
            "destroyed_rgba_80": difference(idle, small["destroyed"]),
            "destroyed_alpha_80": difference(idle, small["destroyed"], True),
        }
        assert metrics["move_rgba_80"] >= 20, (facing, "no hover motion", metrics)
        assert metrics["attack_rgba_80"] >= 40, (facing, "no phase attack", metrics)
        assert metrics["destroyed_alpha_80"] >= 65, (facing, "wreckage silhouette", metrics)
        report["directions"][f"{facing:02d}"] = metrics
        adjacent = images["idle"][(facing + 1) % 32].resize(
            (80, 80), Image.Resampling.LANCZOS)
        delta = difference(idle, adjacent)
        assert delta >= 20, (facing, "duplicate facing", delta)
        report["adjacent_rgba_80"][f"{facing:02d}"] = delta

    for size in (160, 80):
        contact = Image.new("RGBA", (size * 8, size * 4), (15, 23, 35, 255))
        for row, state in enumerate(STATES):
            for col, facing in enumerate(range(0, 32, 4)):
                frame = images[state][facing]
                if size == 80:
                    frame = frame.resize((80, 80), Image.Resampling.LANCZOS)
                contact.alpha_composite(frame, (col * size, row * size))
        contact.save(stage / f"psionic-phase-loom-contact-{size}.png")
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print("PASS: 128 unique, unclipped, 160px RGBA Psionic vehicle frames")
    for key in ("move_rgba_80", "attack_rgba_80", "destroyed_alpha_80"):
        vals = [row[key] for row in report["directions"].values()]
        print(key, "MIN", min(vals), "MAX", max(vals))


if __name__ == "__main__":
    main()
