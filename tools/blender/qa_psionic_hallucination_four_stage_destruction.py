#!/usr/bin/env python3
"""Strict 160px/80px PNG acceptance for PSI-VEH-004 physical destruction.

The archived original Hallucination Drone atlas is immutable. This script
only writes new preview contact sheets, atlas, GIF and quantitative JSON.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

PHASES = ("impact", "shatter", "collapse", "aftermath")
FACINGS = 32
SIZE = 160
BASELINE_SHA = "59e25ecc1d6f844370ff2233636b3e61ffd2e82ce09fb92e70fbde1ecf49940d"
LIMITS = {
    "transition_rgba_80_min": 45,
    "aftermath_vs_archived_destroyed_rgba_80_min": 50,
    "impact_vs_archived_idle_rgba_80_min": 50,
    "collapse_vs_archived_idle_alpha_80_min": 40,
    "adjacent_impact_rgba_80_min": 20,
}

def read(path):
    with Image.open(path) as src:
        assert src.size == (SIZE, SIZE) and src.mode == "RGBA", (
            "invalid 160px transparent frame", str(path), src.size, src.mode)
        image = src.copy()
    bounds = image.getchannel("A").getbbox()
    assert bounds is not None and bounds[0] >= 2 and bounds[1] >= 2, (
        "empty or clipped image", str(path), bounds)
    assert bounds[2] <= 158 and bounds[3] <= 158, (
        "clipped image", str(path), bounds)
    return image

def small(image):
    return image.resize((80, 80), Image.Resampling.LANCZOS)

def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(bool(any(p) if isinstance(p, tuple) else p) for p in diff.getdata())

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True, type=Path)
    parser.add_argument("--baseline", required=True, type=Path)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    old_atlas = baseline / "psionic-hallucination-drone-32-preview.png"
    old_sha = hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    assert old_sha == BASELINE_SHA, ("unexpected archived atlas", old_sha)

    images = {p: {} for p in PHASES}
    atlas = Image.new("RGBA", (SIZE * FACINGS, SIZE * len(PHASES)))
    bounds = []
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            img = read(stage / "frames" / phase / ("%02d.png" % facing))
            images[phase][facing] = img
            bounds.append(img.getchannel("A").getbbox())
            atlas.paste(img, (facing * SIZE, row * SIZE))
    atlas_path = stage / "psionic-hallucination-four-stage-destruction-32-preview.png"
    atlas.save(atlas_path, optimize=True)

    report = {
        "asset_register_id": "PSI-VEH-004",
        "preview_only": True,
        "baseline_run": 40583938655,
        "baseline_atlas_sha256_before": old_sha,
        "phases": list(PHASES),
        "facings": FACINGS,
        "frame_count": FACINGS * len(PHASES),
        "acceptance": LIMITS,
        "global_alpha_bounds_160": {
            "min_x": min(b[0] for b in bounds),
            "min_y": min(b[1] for b in bounds),
            "max_x": max(b[2] for b in bounds),
            "max_y": max(b[3] for b in bounds),
        },
        "per_facing": {},
    }
    for facing in range(FACINGS):
        idle = small(read(baseline / "frames" / "idle" / ("%02d.png" % facing)))
        old_destroyed = small(read(baseline / "frames" / "destroyed" / ("%02d.png" % facing)))
        frames = {p: small(images[p][facing]) for p in PHASES}
        transitions = {
            "%s_to_%s_rgba_80" % (a, b): changed(frames[a], frames[b])
            for a, b in zip(PHASES, PHASES[1:])
        }
        row = {
            **transitions,
            "aftermath_vs_archived_destroyed_rgba_80": changed(frames["aftermath"], old_destroyed),
            "aftermath_vs_archived_destroyed_alpha_80": changed(frames["aftermath"], old_destroyed, True),
            "impact_vs_archived_idle_rgba_80": changed(frames["impact"], idle),
            "collapse_vs_archived_idle_alpha_80": changed(frames["collapse"], idle, True),
            "adjacent_impact_rgba_80": changed(frames["impact"], small(images["impact"][(facing + 1) % FACINGS])),
        }
        for metric, count in transitions.items():
            assert count >= LIMITS["transition_rgba_80_min"], (
                "indistinct physical destruction phase", facing, metric, count)
        for metric, limit_key in (
            ("aftermath_vs_archived_destroyed_rgba_80", "aftermath_vs_archived_destroyed_rgba_80_min"),
            ("impact_vs_archived_idle_rgba_80", "impact_vs_archived_idle_rgba_80_min"),
            ("collapse_vs_archived_idle_alpha_80", "collapse_vs_archived_idle_alpha_80_min"),
            ("adjacent_impact_rgba_80", "adjacent_impact_rgba_80_min"),
        ):
            assert row[metric] >= LIMITS[limit_key], (
                "physical silhouette QA failed", facing, metric, row[metric])
        report["per_facing"]["%02d" % facing] = row

    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (15, 23, 35, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                image = images[phase][facing]
                if size == 80:
                    image = small(image)
                sheet.alpha_composite(image, (col * size, row * size))
        sheet.save(stage / ("psionic-hallucination-destruction-contact-%d.png" % size))

    gif = []
    for phase in PHASES:
        canvas = Image.new("RGBA", (80, 80), (15, 23, 35, 255))
        canvas.alpha_composite(small(images[phase][4]))
        gif.append(canvas.convert("RGB"))
    gif[0].save(
        stage / "psionic-hallucination-destruction-facing04-80px.gif",
        save_all=True, append_images=gif[1:], duration=[220, 170, 190, 330],
        loop=0, optimize=False,
    )

    report["new_preview_atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    report["baseline_atlas_sha256_after"] = hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    assert report["baseline_atlas_sha256_after"] == BASELINE_SHA
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print("PASS 128 NEW physical destruction RGBA frames; archived atlas unchanged")
    print("BASELINE_SHA256", old_sha)
    print("NEW_PREVIEW_SHA256", report["new_preview_atlas_sha256"])
    print("GLOBAL_ALPHA_BOUNDS", report["global_alpha_bounds_160"])
    for metric in next(iter(report["per_facing"].values())):
        values = [entry[metric] for entry in report["per_facing"].values()]
        print(metric, "MIN", min(values), "MAX", max(values),
              "MEAN", round(sum(values) / len(values), 1))

if __name__ == "__main__":
    main()
