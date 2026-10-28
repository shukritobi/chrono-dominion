#!/usr/bin/env python3
"""Strict 160px/80px PNG QA for original Coalition Hunter destruction.

Compares 128 new four-stage frames to the immutable validated 32-facing
Hunter baseline. Alpha-mask changes prove geometry/silhouette changes;
RGB-only glow cannot satisfy the structural gates. Preview only.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32
SIZE = 160
EXPECTED_BASELINE_SHA = "9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d"
GATES = {
    "impact_to_shear_rgba_80": 65,
    "shear_to_rupture_rgba_80": 65,
    "rupture_to_settle_rgba_80": 65,
    "impact_to_shear_alpha_80": 25,
    "shear_to_rupture_alpha_80": 25,
    "rupture_to_settle_alpha_80": 25,
    "settle_vs_archived_destroyed_rgba_80": 55,
    "impact_vs_archived_idle_rgba_80": 50,
    "rupture_vs_idle_alpha_80": 65,
    "adjacent_impact_rgba_80": 20,
}


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(1 for p in diff.getdata()
               if (any(p) if isinstance(p, tuple) else bool(p)))


def read(path, failures):
    try:
        with Image.open(path) as source:
            if source.mode != "RGBA" or source.size != (SIZE, SIZE):
                failures.append("Invalid PNG %s mode=%s size=%s" %
                                (path, source.mode, source.size))
            frame = source.convert("RGBA").copy()
    except (OSError, FileNotFoundError) as exc:
        failures.append("Missing/unreadable PNG %s: %s" % (path, exc))
        return Image.new("RGBA", (SIZE, SIZE))
    bbox = frame.getchannel("A").getbbox()
    if not bbox or min(bbox[:2]) < 3 or max(bbox[2:]) > 157:
        failures.append("Empty or clipped PNG %s bbox=%s" % (path, bbox))
    return frame


def half(frame):
    return frame.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    failures = []
    old_atlas = baseline / "coalition-camouflage-hunter-32-preview.png"
    original_source = baseline / "coalition-camouflage-hunter.blend"
    new_source = stage / "coalition-hunter-four-stage-destruction.blend"
    assert original_source.stat().st_size >= 100000, "Missing validated original Blender source"
    assert new_source.stat().st_size >= 100000, "Missing new editable Blender source"
    before = hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    if before != EXPECTED_BASELINE_SHA:
        failures.append("Original Hunter atlas SHA mismatch: " + before)
    frames = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (SIZE*FACINGS, SIZE*len(PHASES)))
    hashes = {}
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            path = stage / "frames" / phase / ("%02d.png" % facing)
            frame = read(path, failures)
            frames[phase][facing] = frame
            hashes[phase + "/%02d" % facing] = hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
            atlas.paste(frame, (SIZE*facing, SIZE*row))
    if len(set(hashes.values())) != FACINGS*len(PHASES):
        failures.append("Duplicate pixel file hash across four stages or facings")
    atlas_path = stage / "coalition-hunter-four-stage-destruction-32-preview.png"
    atlas.save(atlas_path, optimize=True)
    report = {
        "asset_register_id": "COA-VEH-005",
        "preview_only": True,
        "baseline_run": 40648427473,
        "baseline_atlas_sha256_before": before,
        "original_source_bytes": original_source.stat().st_size,
        "new_source_bytes": new_source.stat().st_size,
        "facings": FACINGS,
        "phases": list(PHASES),
        "new_frame_count": FACINGS*len(PHASES),
        "unique_png_sha256_count": len(set(hashes.values())),
        "acceptance": GATES,
        "per_facing": {},
    }
    for facing in range(FACINGS):
        idle = half(read(baseline/"frames"/"idle"/("%02d.png" % facing), failures))
        destroyed = half(read(baseline/"frames"/"destroyed"/("%02d.png" % facing), failures))
        pose = {phase: half(frames[phase][facing]) for phase in PHASES}
        row = {
            "impact_to_shear_rgba_80": changed(pose["impact"], pose["shear"]),
            "shear_to_rupture_rgba_80": changed(pose["shear"], pose["rupture"]),
            "rupture_to_settle_rgba_80": changed(pose["rupture"], pose["settle"]),
            "impact_to_shear_alpha_80": changed(pose["impact"], pose["shear"], True),
            "shear_to_rupture_alpha_80": changed(pose["shear"], pose["rupture"], True),
            "rupture_to_settle_alpha_80": changed(pose["rupture"], pose["settle"], True),
            "settle_vs_archived_destroyed_rgba_80": changed(pose["settle"], destroyed),
            "settle_vs_archived_destroyed_alpha_80": changed(pose["settle"], destroyed, True),
            "impact_vs_archived_idle_rgba_80": changed(pose["impact"], idle),
            "rupture_vs_idle_alpha_80": changed(pose["rupture"], idle, True),
            "adjacent_impact_rgba_80": changed(
                pose["impact"], half(frames["impact"][(facing+1)%FACINGS])),
        }
        for key, minimum in GATES.items():
            if row[key] < minimum:
                failures.append("80px visual gate %s facing %02d: %d < %d" %
                                (key, facing, row[key], minimum))
        report["per_facing"]["%02d" % facing] = row
    for size in (160, 80):
        sheet = Image.new("RGBA", (size*8, size*4), (20, 25, 34, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                frame = frames[phase][facing]
                sheet.alpha_composite(frame if size == 160 else half(frame),
                                      (col*size, row*size))
        sheet.save(stage / ("coalition-hunter-destruction-contact-%d.png" % size))
    animation = []
    for phase in PHASES:
        canvas = Image.new("RGBA", (80, 80), (20, 25, 34, 255))
        canvas.alpha_composite(half(frames[phase][4]))
        animation.append(canvas.convert("RGB"))
    animation[0].save(
        stage / "coalition-hunter-destruction-facing04-80px.gif",
        save_all=True, append_images=animation[1:],
        duration=[250, 190, 190, 390], loop=0, optimize=False)
    after = hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    report["baseline_atlas_sha256_after"] = after
    report["new_atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    if after != before:
        failures.append("Original validated atlas changed during review")
    report["failures"] = failures
    (stage/"pixel-qa.json").write_text(json.dumps(report, indent=2)+"\n")
    for key in next(iter(report["per_facing"].values())):
        vals = [row[key] for row in report["per_facing"].values()]
        print(key, "MIN", min(vals), "MAX", max(vals),
              "MEAN", round(sum(vals)/len(vals), 1), flush=True)
    if failures:
        raise AssertionError("%d Hunter destruction PNG QA failures: %s" %
                             (len(failures), "; ".join(failures[:12])))
    print("PASS: 128 new 160px RGBA Hunter destruction frames; 80px structural gates; baseline immutable", flush=True)


if __name__ == "__main__":
    main()
