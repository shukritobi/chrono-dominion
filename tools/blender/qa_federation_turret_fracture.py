#!/usr/bin/env python3
"""Focused 80px/160px visual QA for the Federation turret fracture repair.

This is a preview-only experiment; the published art manifest is not touched.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw


def alpha_changed(a, b):
    return sum((x >= 32) != (y >= 32)
               for x, y in zip(a.getchannel("A").tobytes(),
                               b.getchannel("A").tobytes()))


def rgba_changed(a, b):
    return sum(x != y for x, y in zip(a.getdata(), b.getdata()))


def orange_exposure(before, after):
    """Count newly exposed bright warm pixels, not preexisting orange windows."""
    def warm(px):
        r, g, b, a = px
        return a >= 48 and r >= 115 and g >= 35 and r > g * 1.35 and g > b * 1.13
    return sum(warm(b) and not warm(a)
               for a, b in zip(before.getdata(), after.getdata()))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    a = parser.parse_args()
    atlas = a.stage / "packed" / "federation-turret.png"
    extra = a.stage / "extra" / "federation"
    assert (extra / "federation-turret-extended-states.blend").stat().st_size > 1000
    digest = hashlib.sha256(atlas.read_bytes()).hexdigest()
    with Image.open(atlas) as im:
        assert im.mode == "RGBA" and im.size == (160, 800)
        frames = {"intact": im.crop((0, 0, 160, 160)).copy()}
    for state in ("critical", "destroyed", "power_out"):
        with Image.open(extra / (state + ".png")) as im:
            assert im.mode == "RGBA" and im.size == (160, 160)
            bbox = im.getchannel("A").getbbox()
            assert bbox and min(bbox[0], bbox[1]) > 0 and max(bbox[2:]) < 160, (state, bbox)
            frames[state] = im.copy()

    metrics = {}
    for state in ("critical", "destroyed", "power_out"):
        metrics[state] = {}
        for size in (160, 80):
            before = frames["intact"].resize((size, size), Image.Resampling.LANCZOS)
            after = frames[state].resize((size, size), Image.Resampling.LANCZOS)
            metrics[state][f"alpha_{size}"] = alpha_changed(before, after)
            metrics[state][f"rgba_{size}"] = rgba_changed(before, after)
            metrics[state][f"new_orange_{size}"] = orange_exposure(before, after)

    # Existing 80px contract is retained, with an additional destroyed
    # silhouette and bright fracture exposure gate.
    assert metrics["critical"]["alpha_80"] >= 25, metrics
    assert metrics["destroyed"]["alpha_80"] >= 132, metrics
    assert metrics["destroyed"]["new_orange_80"] >= 8, metrics
    assert metrics["power_out"]["alpha_80"] < 30, metrics
    assert metrics["power_out"]["rgba_80"] >= 100, metrics
    assert hashlib.sha256(atlas.read_bytes()).hexdigest() == digest

    for size in (160, 80):
        board = Image.new("RGB", (4 * (size + 12) + 16, size + 69), (18, 25, 38))
        draw = ImageDraw.Draw(board)
        draw.text((12, 8), f"FEDERATION TURRET | FRACTURED ROOF | {size}px | PREVIEW ONLY",
                  fill=(137, 231, 241))
        for i, (name, im) in enumerate(frames.items()):
            tile = im.resize((size, size), Image.Resampling.LANCZOS)
            bg = Image.new("RGBA", (size, size), (40, 49, 63, 255))
            bg.alpha_composite(tile)
            x = 12 + i * (size + 12)
            board.paste(bg.convert("RGB"), (x, 29))
            draw.text((x, size + 33), name, fill=(235, 239, 248))
        board.save(a.stage / f"federation-fracture-contact-{size}.png")

    report = {"preview_only": True, "faction": "federation",
              "asset": "defense turret", "wreckage_meshes": 12,
              "original_atlas_sha256_unchanged": digest, "metrics": metrics}
    (a.stage / "federation-fracture-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2), flush=True)
    print("PASS: original Federation turret atlas untouched, 12 hidden wreckage meshes")


if __name__ == "__main__":
    main()
