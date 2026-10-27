#!/usr/bin/env python3
"""Strict 160px/80px QA of 128 NEW Federation Hunter Spider gait frames.

Checks each of 32 facings, three phase transitions, baseline differences,
alpha clipping, and the immutable original atlas checksum.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

PHASES = ("plant", "lift", "swing", "settle")
SIZE = 160
FACINGS = 32
BASELINE_SHA256 = "0be6b3eb5149dd022e3d904e951fc63e9c8314aff1e084dde451877b3ebe7836"


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    delta = ImageChops.difference(a, b)
    return sum(1 for p in delta.getdata()
               if any(p) if isinstance(p, tuple) else bool(p))


def read(path):
    with Image.open(path) as im:
        assert im.size == (SIZE, SIZE) and im.mode == "RGBA", (
            str(path), im.size, im.mode)
        result = im.copy()
    bbox = result.getchannel("A").getbbox()
    assert bbox and bbox[0] >= 2 and bbox[1] >= 2 and bbox[2] <= 158 and bbox[3] <= 158, (
        "empty/clipped gait frame", str(path), bbox)
    return result


def small(image):
    return image.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    archived_atlas = baseline / "federation-hunter-spider-32-preview.png"
    sha_before = hashlib.sha256(archived_atlas.read_bytes()).hexdigest()
    assert sha_before == BASELINE_SHA256, (
        "Archived validated source atlas checksum differs", sha_before)
    frames = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (SIZE * FACINGS, SIZE * len(PHASES)))
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            image = read(stage / "frames" / phase / ("%02d.png" % facing))
            frames[phase][facing] = image
            atlas.paste(image, (SIZE * facing, SIZE * row))
    atlas_path = stage / "federation-hunter-spider-four-beat-gait-preview.png"
    atlas.save(atlas_path, optimize=True)
    report = {
        "asset_register_id": "FED-VEH-004",
        "preview_only": True,
        "facings": FACINGS,
        "phases": list(PHASES),
        "new_frame_count": FACINGS * len(PHASES),
        "baseline_atlas_sha256_before": sha_before,
        "acceptance": {
            "consecutive_phase_rgba_80_min": 35,
            "swing_vs_archived_move_rgba_80_min": 50,
            "swing_vs_archived_idle_rgba_80_min": 50,
            "adjacent_plant_rgba_80_min": 25,
        },
        "per_facing": {},
    }
    for facing in range(FACINGS):
        prior_idle = small(read(baseline / "frames" / "idle" / ("%02d.png" % facing)))
        prior_move = small(read(baseline / "frames" / "move" / ("%02d.png" % facing)))
        gait = {phase: small(frames[phase][facing]) for phase in PHASES}
        row = {
            "plant_to_lift_rgba_80": changed(gait["plant"], gait["lift"]),
            "lift_to_swing_rgba_80": changed(gait["lift"], gait["swing"]),
            "swing_to_settle_rgba_80": changed(gait["swing"], gait["settle"]),
            "swing_vs_archived_move_rgba_80": changed(gait["swing"], prior_move),
            "swing_vs_archived_idle_rgba_80": changed(gait["swing"], prior_idle),
            "swing_vs_archived_idle_alpha_80": changed(
                gait["swing"], prior_idle, True),
            "adjacent_plant_rgba_80": changed(
                gait["plant"], small(frames["plant"][(facing + 1) % FACINGS])),
        }
        for key in ("plant_to_lift_rgba_80", "lift_to_swing_rgba_80",
                    "swing_to_settle_rgba_80"):
            assert row[key] >= 35, ("unreadable gait phase", facing, key, row[key])
        assert row["swing_vs_archived_move_rgba_80"] >= 50, (
            "gait too similar to archived single-step movement", facing, row)
        assert row["swing_vs_archived_idle_rgba_80"] >= 50, (
            "gait too similar to idle", facing, row)
        assert row["adjacent_plant_rgba_80"] >= 25, (
            "duplicate facing", facing, row)
        report["per_facing"]["%02d" % facing] = row

    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (17, 24, 33, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                frame = frames[phase][facing]
                if size == 80:
                    frame = small(frame)
                sheet.alpha_composite(frame, (col * size, row * size))
        sheet.save(stage / ("federation-hunter-spider-gait-contact-%d.png" % size))
    report["new_atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    report["baseline_atlas_sha256_after"] = hashlib.sha256(
        archived_atlas.read_bytes()).hexdigest()
    assert report["baseline_atlas_sha256_after"] == sha_before
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print("PASS: 128 new four-beat Spider gait sprites; archived atlas unchanged")
    for key in next(iter(report["per_facing"].values())):
        values = [r[key] for r in report["per_facing"].values()]
        print(key, "MIN", min(values), "MAX", max(values),
              "MEAN", round(sum(values) / len(values), 1))


if __name__ == "__main__":
    main()
