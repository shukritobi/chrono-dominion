#!/usr/bin/env python3
"""Strict 160/80px real-PNG QA for PSI-VEH-002 destruction (preview only).

Compares 128 new four-stage renders with the untouched validated Viper
source from Actions #40508990419. Checks alpha silhouettes independently
from RGBA color changes; does not mistake glow alone for physical wreckage.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32
SIZE = 160
EXPECTED_BASELINE_SHA = "0c1229bd01f0e874822546a6ef53780b2f5ef1ddc41466a74cdd994176acee78"


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(1 for p in diff.getdata()
               if (any(p) if isinstance(p, tuple) else bool(p)))


def read(path, failures):
    with Image.open(path) as source:
        if source.mode != "RGBA" or source.size != (SIZE, SIZE):
            failures.append("Invalid PNG %s mode=%s size=%s" %
                            (path, source.mode, source.size))
        frame = source.convert("RGBA").copy()
    bbox = frame.getchannel("A").getbbox()
    if not bbox or min(bbox[:2]) < 2 or max(bbox[2:]) > 158:
        failures.append("Empty or clipped PNG %s bbox=%s" % (path, bbox))
    return frame


def half(frame):
    return frame.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True, type=Path)
    parser.add_argument("--baseline", required=True, type=Path)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    failures = []
    old_atlas = baseline / "psionic-viper-light-tank-32-preview.png"
    before = hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    if before != EXPECTED_BASELINE_SHA:
        failures.append("Unexpected original Viper atlas SHA: " + before)

    frames = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (SIZE * FACINGS, SIZE * len(PHASES)))
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            frame = read(stage / "frames" / phase / ("%02d.png" % facing), failures)
            frames[phase][facing] = frame
            atlas.paste(frame, (SIZE * facing, SIZE * row))
    atlas_path = stage / "psionic-viper-four-stage-destruction-32-preview.png"
    atlas.save(atlas_path, optimize=True)

    gates = {
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
    report = {
        "asset_register_id": "PSI-VEH-002",
        "preview_only": True,
        "baseline_run": 40508990419,
        "baseline_atlas_sha256_before": before,
        "facings": FACINGS,
        "phases": list(PHASES),
        "new_frame_count": FACINGS * len(PHASES),
        "acceptance": gates,
        "per_facing": {},
    }
    for facing in range(FACINGS):
        idle = half(read(baseline / "frames" / "idle" /
                         ("%02d.png" % facing), failures))
        destroyed = half(read(baseline / "frames" / "destroyed" /
                              ("%02d.png" % facing), failures))
        pose = {phase: half(frames[phase][facing]) for phase in PHASES}
        row = {
            "impact_to_shear_rgba_80": changed(pose["impact"], pose["shear"]),
            "shear_to_rupture_rgba_80": changed(pose["shear"], pose["rupture"]),
            "rupture_to_settle_rgba_80": changed(pose["rupture"], pose["settle"]),
            "impact_to_shear_alpha_80": changed(pose["impact"], pose["shear"], True),
            "shear_to_rupture_alpha_80": changed(pose["shear"], pose["rupture"], True),
            "rupture_to_settle_alpha_80": changed(pose["rupture"], pose["settle"], True),
            "settle_vs_archived_destroyed_rgba_80": changed(pose["settle"], destroyed),
            "settle_vs_archived_destroyed_alpha_80": changed(
                pose["settle"], destroyed, True),
            "impact_vs_archived_idle_rgba_80": changed(pose["impact"], idle),
            "rupture_vs_idle_alpha_80": changed(pose["rupture"], idle, True),
            "adjacent_impact_rgba_80": changed(
                pose["impact"], half(frames["impact"][(facing + 1) % FACINGS])),
        }
        for metric, minimum in gates.items():
            if row[metric] < minimum:
                failures.append("80px gate %s facing %02d: %d < %d" %
                                (metric, facing, row[metric], minimum))
        report["per_facing"]["%02d" % facing] = row

    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (20, 21, 32, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                frame = frames[phase][facing]
                sheet.alpha_composite(frame if size == 160 else half(frame),
                                      (col * size, row * size))
        sheet.save(stage / ("psionic-viper-destruction-contact-%d.png" % size))
    animation = []
    for phase in PHASES:
        canvas = Image.new("RGBA", (80, 80), (20, 21, 32, 255))
        canvas.alpha_composite(half(frames[phase][4]))
        animation.append(canvas.convert("RGB"))
    animation[0].save(
        stage / "psionic-viper-destruction-facing04-80px.gif",
        save_all=True, append_images=animation[1:],
        duration=[240, 180, 190, 350], loop=0, optimize=False)

    after = hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    report["baseline_atlas_sha256_after"] = after
    report["new_atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    if after != before:
        failures.append("Immutable baseline atlas changed")
    report["failures"] = failures
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    for metric in next(iter(report["per_facing"].values())):
        vals = [row[metric] for row in report["per_facing"].values()]
        print(metric, "MIN", min(vals), "MAX", max(vals),
              "MEAN", round(sum(vals) / len(vals), 1))
    if failures:
        raise AssertionError("%d Viper physical destruction PNG QA failures: %s" %
                             (len(failures), "; ".join(failures[:12])))
    print("PASS: 128 new Viper destruction RGBA frames, baseline SHA unchanged")


if __name__ == "__main__":
    main()
