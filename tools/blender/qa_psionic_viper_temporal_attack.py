#!/usr/bin/env python3
"""Pixel QA of actual 160px/80px four-phase Viper Blender renders.

Read archived original Viper idle and attack PNGs. Validate all new facings,
non-clipping, animation phase changes and non-replacement of existing art.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops

PHASES = ("charge", "focus", "burst", "cooldown")


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(bool(any(p) if isinstance(p, tuple) else p) for p in diff.getdata())


def read(path):
    with Image.open(path) as im:
        assert im.size == (160, 160) and im.mode == "RGBA", (path, im.size, im.mode)
        frame = im.copy()
    bbox = frame.getchannel("A").getbbox()
    assert bbox and bbox[0] >= 2 and bbox[1] >= 2 and bbox[2] <= 158 and bbox[3] <= 158, (
        "empty or clipped frame", path, bbox)
    return frame


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    images = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (5120, 640))
    report = {
        "asset": "PSI-VEH-002 Viper original four-beat twin phase lance",
        "preview_only": True, "facings": 32, "frame_size": 160,
        "phases": list(PHASES), "per_facing": {},
        "acceptance": {"transition_rgba_80_min": 35,
                       "burst_vs_original_rgba_80_min": 50,
                       "burst_vs_idle_alpha_80_min": 20},
    }
    for row, phase in enumerate(PHASES):
        for facing in range(32):
            frame = read(stage / "frames" / phase / f"{facing:02d}.png")
            images[phase][facing] = frame
            atlas.paste(frame, (160 * facing, 160 * row))
    atlas.save(stage / "psionic-viper-temporal-attack-32-preview.png", optimize=True)
    for facing in range(32):
        idle = read(baseline / "frames" / "idle" / f"{facing:02d}.png")
        old_attack = read(baseline / "frames" / "attack" / f"{facing:02d}.png")
        small = {phase: images[phase][facing].resize((80, 80), Image.Resampling.LANCZOS)
                 for phase in PHASES}
        idle80 = idle.resize((80, 80), Image.Resampling.LANCZOS)
        old80 = old_attack.resize((80, 80), Image.Resampling.LANCZOS)
        transitions = {f"{a}_to_{b}_rgba_80": changed(small[a], small[b])
                       for a, b in zip(PHASES, PHASES[1:])}
        row = {**transitions,
               "burst_vs_old_attack_rgba_80": changed(small["burst"], old80),
               "burst_vs_idle_rgba_80": changed(small["burst"], idle80),
               "burst_vs_idle_alpha_80": changed(small["burst"], idle80, True),
               "cooldown_vs_old_attack_rgba_80": changed(small["cooldown"], old80)}
        for name, value in transitions.items():
            assert value >= 35, ("invisible temporal transition", facing, name, value)
        assert row["burst_vs_old_attack_rgba_80"] >= 50, ("no novel burst", facing, row)
        assert row["burst_vs_idle_rgba_80"] >= 80, ("invisible burst", facing, row)
        assert row["burst_vs_idle_alpha_80"] >= 20, ("burst silhouette unchanged", facing, row)
        report["per_facing"][f"{facing:02d}"] = row
    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (14, 24, 34, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, 32, 4)):
                frame = images[phase][facing]
                if size == 80:
                    frame = frame.resize((80, 80), Image.Resampling.LANCZOS)
                sheet.alpha_composite(frame, (col * size, row * size))
        sheet.save(stage / f"psionic-viper-temporal-attack-contact-{size}.png")
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print("PASS: 128 new unclipped original Viper temporal RGBA frames")
    for key in next(iter(report["per_facing"].values())):
        values = [row[key] for row in report["per_facing"].values()]
        print(key, "MIN", min(values), "MAX", max(values),
              "MEAN", round(sum(values) / len(values), 1))


if __name__ == "__main__":
    main()
