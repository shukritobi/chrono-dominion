#!/usr/bin/env python3
"""Inspect actual Psionic factory preview PNGs, never published textures.

Requires Pillow; reads the 5-frame 160x800 RGBA staging atlas and emits
true 160px and 80px contact sheets and machine-readable quantitative QA.
Optional --baseline points to an older 160x800 atlas for before/after.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

STATES = ("idle A", "idle B", "construction early", "construction late", "damaged")

def frame(atlas, index):
    return atlas.crop((0, index * 160, 160, (index + 1) * 160))

def changed_alpha(a, b):
    aa = a.getchannel("A").tobytes()
    bb = b.getchannel("A").tobytes()
    return sum((x >= 32) != (y >= 32) for x, y in zip(aa, bb))

def changed_rgba(a, b):
    return sum(x != y for x, y in zip(a.getdata(), b.getdata()))

def check(atlas):
    assert atlas.mode == "RGBA" and atlas.size == (160, 800), (
        "Five-frame RGBA 160x800 contract violated", atlas.mode, atlas.size
    )
    frames = [frame(atlas, i) for i in range(5)]
    for index, im in enumerate(frames):
        bbox = im.getchannel("A").getbbox()
        assert bbox and 0 < bbox[0] < bbox[2] < 160 and 0 < bbox[1] < bbox[3] < 160, (
            "Empty/clipped frame", index, bbox
        )
    small = [im.resize((80, 80), Image.Resampling.LANCZOS) for im in frames]
    metrics = {
        "atlas_mode": atlas.mode,
        "atlas_size": list(atlas.size),
        "state_names": list(STATES),
        "idle_rgba_changed_160": changed_rgba(frames[0], frames[1]),
        "idle_alpha_changed_160": changed_alpha(frames[0], frames[1]),
        "construction_alpha_changed_160": changed_alpha(frames[0], frames[2]),
        "construction_alpha_changed_80": changed_alpha(small[0], small[2]),
        "damage_alpha_changed_160": changed_alpha(frames[0], frames[4]),
        "damage_alpha_changed_80": changed_alpha(small[0], small[4]),
        "opaque_pixels_160": sum(x >= 32 for x in frames[0].getchannel("A").tobytes()),
        "bounding_boxes": [list(im.getchannel("A").getbbox()) for im in frames],
    }
    assert metrics["idle_rgba_changed_160"] > 0, "Idle frames are pixel identical"
    assert metrics["opaque_pixels_160"] > 800, "Missing factory silhouette"
    assert metrics["construction_alpha_changed_160"] > 200, "No staged construction"
    assert metrics["damage_alpha_changed_160"] > 70, "No physical damage silhouette"
    return frames, metrics

def contact(frames, output, scale, label):
    margin = 14
    cell = scale + 16
    out = Image.new("RGB", (5 * cell + margin * 2, scale + 72), (18, 25, 38))
    draw = ImageDraw.Draw(out)
    draw.text((margin, 10), f"CHRONO / PSIONIC HOLLOW FACTORY / {label} / {scale}px", fill=(137, 235, 238))
    for i, sprite in enumerate(frames):
        fg = sprite.resize((scale, scale), Image.Resampling.LANCZOS)
        bg = Image.new("RGBA", (scale, scale), (39, 47, 62, 255))
        bg.alpha_composite(fg)
        out.paste(bg.convert("RGB"), (margin + i * cell, 35))
        draw.text((margin + i * cell, scale + 39), STATES[i], fill=(229, 236, 245))
    out.save(output, optimize=True)

def before_after(old, new, output, scale):
    w = 2 * scale + 56
    board = Image.new("RGB", (w, scale + 60), (18, 25, 38))
    d = ImageDraw.Draw(board)
    d.text((12, 8), f"MK-III CLOSED vs MK-V OPEN / {scale}px", fill=(139, 235, 238))
    for i, sprite in enumerate((old, new)):
        sprite = sprite.resize((scale, scale), Image.Resampling.LANCZOS)
        bg = Image.new("RGBA", (scale, scale), (39, 47, 62, 255))
        bg.alpha_composite(sprite)
        board.paste(bg.convert("RGB"), (12 + i * (scale + 16), 30))
        d.text((12 + i * (scale + 16), scale + 34), ("MK-III", "MK-V")[i], fill=(230, 236, 245))
    board.save(output, optimize=True)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--stage", type=Path, default=Path("generated/psionic-open-factory/psionic/factory"))
    p.add_argument("--baseline", type=Path)
    args = p.parse_args()
    stage = args.stage
    atlas_path = stage / "packed/psionic-factory.png"
    with Image.open(atlas_path) as image:
        image.load()
        frames, metrics = check(image)
    for size in (160, 80):
        contact(frames, stage / f"psionic-factory-{size}px.png", size, "five-state preview")
    source = stage / "sources/psionic-factory.blend"
    assert source.stat().st_size > 1000, "Missing editable Blender source"
    metrics["editable_blend_bytes"] = source.stat().st_size
    if args.baseline:
        with Image.open(args.baseline) as old:
            old.load()
            oldframes, _ = check(old)
        for size in (160, 80):
            previous = oldframes[0].resize((size, size), Image.Resampling.LANCZOS)
            current = frames[0].resize((size, size), Image.Resampling.LANCZOS)
            metrics[f"old_new_idle_alpha_changed_{size}"] = changed_alpha(previous, current)
            metrics[f"old_new_idle_rgba_changed_{size}"] = changed_rgba(previous, current)
            before_after(oldframes[0], frames[0], stage / f"old-vs-open-{size}px.png", size)
        assert metrics["old_new_idle_rgba_changed_80"] > 100, "Opening invisible at 80px"
    (stage / "psionic-factory-qa.json").write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2), flush=True)
    print("PASS: five unclipped RGBA states, real image QA, editable Blender source", flush=True)

if __name__ == "__main__":
    main()
