#!/usr/bin/env python3
"""Real PNG-level QA for 32-facing, four-stage Hunter Spider destruction.

Validates 128 newly rendered RGBA frames at 160px and 80px, detects clipping,
quantifies every phase transition and verifies immutable archived art.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

PHASES = ("impact", "shear", "rupture", "settle")
SIZE = 160
FACINGS = 32
BASELINE_SHA256 = "0be6b3eb5149dd022e3d904e951fc63e9c8314aff1e084dde451877b3ebe7836"


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    delta = ImageChops.difference(a, b)
    return sum(1 for p in delta.getdata()
               if (any(p) if isinstance(p, tuple) else bool(p)))


def read(path, issues):
    with Image.open(path) as im:
        if im.mode != "RGBA" or im.size != (SIZE, SIZE):
            issues.append("Bad PNG mode/dimensions: %s %s %s" %
                          (path, im.mode, im.size))
        result = im.convert("RGBA").copy()
    bbox = result.getchannel("A").getbbox()
    if not bbox or bbox[0] < 2 or bbox[1] < 2 or bbox[2] > 158 or bbox[3] > 158:
        issues.append("Empty or clipped: %s bbox=%s" % (path, bbox))
    return result


def small(im):
    return im.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    issues = []
    original = baseline / "federation-hunter-spider-32-preview.png"
    before = hashlib.sha256(original.read_bytes()).hexdigest()
    if before != BASELINE_SHA256:
        issues.append("Original atlas SHA-256 mismatch: " + before)

    frames = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (SIZE * FACINGS, SIZE * len(PHASES)))
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            frame = read(stage / "frames" / phase / ("%02d.png" % facing), issues)
            frames[phase][facing] = frame
            atlas.paste(frame, (facing * SIZE, row * SIZE))
    atlas_path = stage / "federation-hunter-spider-four-stage-destruction-preview.png"
    atlas.save(atlas_path, optimize=True)

    gates = {
        "impact_to_shear_rgba_80": 45,
        "shear_to_rupture_rgba_80": 45,
        "rupture_to_settle_rgba_80": 45,
        "settle_vs_archived_destroyed_rgba_80": 35,
        "impact_vs_archived_idle_rgba_80": 35,
        "adjacent_impact_rgba_80": 25,
    }
    report = {
        "asset_register_id": "FED-VEH-004",
        "preview_only": True,
        "new_frame_count": FACINGS * len(PHASES),
        "facings": FACINGS,
        "phases": list(PHASES),
        "acceptance": gates,
        "baseline_atlas_sha256_before": before,
        "per_facing": {},
    }
    for facing in range(FACINGS):
        pose = {p: small(frames[p][facing]) for p in PHASES}
        old_idle = small(read(baseline / "frames" / "idle" /
                              ("%02d.png" % facing), issues))
        old_destroyed = small(read(baseline / "frames" / "destroyed" /
                                   ("%02d.png" % facing), issues))
        row = {
            "impact_to_shear_rgba_80": changed(pose["impact"], pose["shear"]),
            "shear_to_rupture_rgba_80": changed(pose["shear"], pose["rupture"]),
            "rupture_to_settle_rgba_80": changed(pose["rupture"], pose["settle"]),
            "impact_to_shear_alpha_80": changed(pose["impact"], pose["shear"], True),
            "shear_to_rupture_alpha_80": changed(pose["shear"], pose["rupture"], True),
            "rupture_to_settle_alpha_80": changed(pose["rupture"], pose["settle"], True),
            "settle_vs_archived_destroyed_rgba_80": changed(
                pose["settle"], old_destroyed),
            "settle_vs_archived_destroyed_alpha_80": changed(
                pose["settle"], old_destroyed, True),
            "impact_vs_archived_idle_rgba_80": changed(pose["impact"], old_idle),
            "adjacent_impact_rgba_80": changed(
                pose["impact"], small(frames["impact"][(facing + 1) % FACINGS])),
        }
        for key, minimum in gates.items():
            if row[key] < minimum:
                issues.append("80px gate %s facing %02d: %d < %d" %
                              (key, facing, row[key], minimum))
        report["per_facing"]["%02d" % facing] = row

    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (17, 24, 33, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                im = frames[phase][facing]
                if size == 80:
                    im = small(im)
                sheet.alpha_composite(im, (col * size, row * size))
        sheet.save(stage / ("federation-hunter-spider-destruction-contact-%d.png" % size))

    report["baseline_atlas_sha256_after"] = hashlib.sha256(original.read_bytes()).hexdigest()
    report["new_atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    if report["baseline_atlas_sha256_after"] != before:
        issues.append("Immutable original atlas changed during QA")
    report["failures"] = issues
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    for key in next(iter(report["per_facing"].values())):
        vals = [row[key] for row in report["per_facing"].values()]
        print(key, "MIN", min(vals), "MAX", max(vals),
              "MEAN", round(sum(vals) / len(vals), 1))
    if issues:
        raise AssertionError("%d genuine image QA failures: %s" %
                             (len(issues), "; ".join(issues[:12])))
    print("PASS: 128 NEW physical destruction sprites; baseline atlas unchanged")


if __name__ == "__main__":
    main()
