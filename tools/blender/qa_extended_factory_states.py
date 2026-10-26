#!/usr/bin/env python3
"""Pixel-QA for preview-only critical, destroyed and power-out building states."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

def delta_alpha(a, b):
    return sum((x >= 32) != (y >= 32)
               for x, y in zip(a.getchannel("A").tobytes(), b.getchannel("A").tobytes()))

def delta_rgba(a, b):
    return sum(x != y for x, y in zip(a.getdata(), b.getdata()))

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--stage", type=Path, default=Path("generated/psionic-open-factory/psionic/factory"))
    p.add_argument("--extras", type=Path, default=Path("generated/psionic-open-factory/extra-states"))
    a = p.parse_args()
    atlas = a.stage / "packed/psionic-factory.png"
    source = a.extras / "psionic-factory-extended-states.blend"
    assert source.stat().st_size > 1000
    with Image.open(atlas) as im:
        assert im.mode == "RGBA" and im.size == (160, 800)
        original = im.crop((0, 0, 160, 160)).copy()
        atlas_hash = hashlib.sha256(atlas.read_bytes()).hexdigest()
    states = {}
    for state in ("critical", "destroyed", "power_out"):
        with Image.open(a.extras / (state + ".png")) as im:
            assert im.mode == "RGBA" and im.size == (160, 160)
            states[state] = im.copy()
        box = states[state].getchannel("A").getbbox()
        assert box and all((box[0] > 0, box[1] > 0, box[2] < 160, box[3] < 160)), (state, box)
    report = {"unchanged_five_frame_atlas_sha256": atlas_hash, "states": {}}
    for state, im in states.items():
        m = {}
        for scale in (160, 80):
            before = original.resize((scale, scale), Image.Resampling.LANCZOS)
            after = im.resize((scale, scale), Image.Resampling.LANCZOS)
            m[f"alpha_changed_{scale}"] = delta_alpha(before, after)
            m[f"rgba_changed_{scale}"] = delta_rgba(before, after)
        report["states"][state] = m
    assert report["states"]["critical"]["alpha_changed_80"] >= 30, "Critical geometry not visible at 80px"
    assert report["states"]["destroyed"]["alpha_changed_80"] >= 90, "Destroyed silhouette too intact at 80px"
    assert report["states"]["power_out"]["rgba_changed_80"] >= 100, "Power outage invisible at 80px"
    assert report["states"]["power_out"]["alpha_changed_80"] < 80, "Power outage should preserve geometry"
    assert hashlib.sha256(atlas.read_bytes()).hexdigest() == atlas_hash
    a.extras.mkdir(parents=True, exist_ok=True)
    for scale in (160, 80):
        cell = scale + 16
        board = Image.new("RGB", (4 * cell + 24, scale + 76), (15, 24, 37))
        draw = ImageDraw.Draw(board)
        draw.text((12, 11), f"PSIONIC FACTORY / EXTRA PREVIEW STATES / {scale}px / NOT LIVE", fill=(135, 227, 239))
        for i, (name, im) in enumerate((("intact", original), *states.items())):
            fg = im.resize((scale, scale), Image.Resampling.LANCZOS)
            bg = Image.new("RGBA", (scale, scale), (38, 46, 60, 255))
            bg.alpha_composite(fg)
            board.paste(bg.convert("RGB"), (12 + i * cell, 34))
            draw.text((12 + i * cell, scale + 40), name, fill=(233, 238, 246))
        board.save(a.extras / f"extended-states-{scale}px.png", optimize=True)
    (a.extras / "extra-state-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2), flush=True)
    print("PASS: separate preview-only states and untouched five-frame atlas", flush=True)

if __name__ == "__main__":
    main()
