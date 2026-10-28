#!/usr/bin/env python3
"""Strict real-PNG 160px/80px QA: FED-VEH-002 physical destruction preview.

128 new renders are compared against the untouched validated Bull baseline
from Actions #40501761698. This never writes to the archived artifact.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32
SIZE = 160


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(1 for pixel in diff.getdata()
               if (any(pixel) if isinstance(pixel, tuple) else bool(pixel)))


def read(path, issues):
    with Image.open(path) as im:
        if im.mode != "RGBA" or im.size != (SIZE, SIZE):
            issues.append("Invalid PNG %s mode=%s size=%s" %
                          (path, im.mode, im.size))
        image = im.convert("RGBA").copy()
    bounds = image.getchannel("A").getbbox()
    if not bounds or bounds[0] < 2 or bounds[1] < 2 or bounds[2] > 158 or bounds[3] > 158:
        issues.append("Empty or clipped PNG %s bounds=%s" % (path, bounds))
    return image


def small(image):
    return image.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    issues = []
    original = baseline / "federation-bull-battle-tank-32-preview.png"
    baseline_sha = hashlib.sha256(original.read_bytes()).hexdigest()
    frames = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (SIZE * FACINGS, SIZE * len(PHASES)))
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            image = read(stage / "frames" / phase / ("%02d.png" % facing), issues)
            frames[phase][facing] = image
            atlas.paste(image, (SIZE * facing, SIZE * row))
    atlas_path = stage / "federation-bull-four-stage-destruction-32-preview.png"
    atlas.save(atlas_path, optimize=True)
    gates = {
        "impact_to_shear_rgba_80": 60,
        "shear_to_rupture_rgba_80": 60,
        "rupture_to_settle_rgba_80": 60,
        "settle_vs_archived_destroyed_rgba_80": 50,
        "impact_vs_archived_idle_rgba_80": 50,
        "adjacent_impact_rgba_80": 20,
        "rupture_vs_idle_alpha_80": 40,
    }
    report = {
        "asset_register_id": "FED-VEH-002",
        "preview_only": True,
        "baseline_run": 40501761698,
        "baseline_atlas_sha256_before": baseline_sha,
        "facings": FACINGS,
        "phases": list(PHASES),
        "new_frame_count": FACINGS * len(PHASES),
        "acceptance": gates,
        "per_facing": {},
    }
    archived = {"idle": {}, "destroyed": {}}
    for facing in range(FACINGS):
        for state in archived:
            archived[state][facing] = small(read(
                baseline / "frames" / state / ("%02d.png" % facing), issues))
        pose = {phase: small(frames[phase][facing]) for phase in PHASES}
        idle = archived["idle"][facing]
        destroyed = archived["destroyed"][facing]
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
                pose["impact"], small(frames["impact"][(facing + 1) % FACINGS])),
        }
        for metric, minimum in gates.items():
            if row[metric] < minimum:
                issues.append("80px gate %s facing %02d: %d < %d" %
                              (metric, facing, row[metric], minimum))
        report["per_facing"]["%02d" % facing] = row
    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (19, 23, 32, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                image = frames[phase][facing]
                if size == 80:
                    image = small(image)
                sheet.alpha_composite(image, (col * size, row * size))
        sheet.save(stage / ("federation-bull-destruction-contact-%d.png" % size))
    gif_frames = []
    for phase in PHASES:
        canvas = Image.new("RGBA", (80, 80), (19, 23, 32, 255))
        canvas.alpha_composite(small(frames[phase][4]))
        gif_frames.append(canvas.convert("RGB"))
    gif_frames[0].save(
        stage / "federation-bull-destruction-facing04-80px.gif",
        save_all=True, append_images=gif_frames[1:],
        duration=[240, 180, 190, 340], loop=0, optimize=False)
    report["new_atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    report["baseline_atlas_sha256_after"] = hashlib.sha256(original.read_bytes()).hexdigest()
    if report["baseline_atlas_sha256_after"] != baseline_sha:
        issues.append("Immutable baseline atlas changed")
    report["failures"] = issues
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    for metric in next(iter(report["per_facing"].values())):
        values = [row[metric] for row in report["per_facing"].values()]
        print(metric, "MIN", min(values), "MAX", max(values),
              "MEAN", round(sum(values) / len(values), 1))
    if issues:
        raise AssertionError("%d actual-PNG QA failures: %s" %
                             (len(issues), "; ".join(issues[:12])))
    print("PASS: 128 NEW Bull physical destruction RGBA frames; baseline unchanged")


if __name__ == "__main__":
    main()
