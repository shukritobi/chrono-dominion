#!/usr/bin/env python3
"""Strict pixel QA for archived-source Bull electrothermal temporal previews."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

PHASES = ("charge", "focus", "discharge", "recover")


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(bool(any(p) if isinstance(p, tuple) else p) for p in diff.getdata())


def read(path):
    with Image.open(path) as im:
        assert im.size == (160, 160) and im.mode == "RGBA", (path, im.size, im.mode)
        frame = im.copy()
    box = frame.getchannel("A").getbbox()
    assert box and box[0] >= 2 and box[1] >= 2 and box[2] <= 158 and box[3] <= 158, (
        "empty/clipped", path, box)
    return frame


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    images = {p: {} for p in PHASES}
    atlas = Image.new("RGBA", (160 * 32, 160 * 4))
    report = {
        "asset": "FED-VEH-002 Federation Bull electrothermal four-phase attack",
        "preview_only": True, "frame_size": 160, "facings": 32,
        "phases": list(PHASES), "per_facing": {},
        "acceptance": {"phase_transition_rgba_80_min": 35,
                       "discharge_vs_old_attack_rgba_80_min": 50,
                       "discharge_vs_idle_alpha_80_min": 20,
                       "adjacent_facing_rgba_80_min": 20},
    }
    for row, phase in enumerate(PHASES):
        for facing in range(32):
            im = read(stage / "frames" / phase / f"{facing:02d}.png")
            images[phase][facing] = im
            atlas.paste(im, (facing * 160, row * 160))
    atlas.save(stage / "federation-bull-temporal-attack-32-preview.png", optimize=True)

    for facing in range(32):
        idle = read(baseline / "frames" / "idle" / f"{facing:02d}.png")
        old = read(baseline / "frames" / "attack" / f"{facing:02d}.png")
        small = {p: images[p][facing].resize((80, 80), Image.Resampling.LANCZOS)
                 for p in PHASES}
        idle80 = idle.resize((80, 80), Image.Resampling.LANCZOS)
        old80 = old.resize((80, 80), Image.Resampling.LANCZOS)
        transitions = {
            f"{a}_to_{b}_rgba_80": changed(small[a], small[b])
            for a, b in zip(PHASES, PHASES[1:])
        }
        row = {
            **transitions,
            "discharge_vs_old_attack_rgba_80": changed(small["discharge"], old80),
            "discharge_vs_idle_rgba_80": changed(small["discharge"], idle80),
            "discharge_vs_idle_alpha_80": changed(small["discharge"], idle80, True),
            "recover_vs_old_attack_rgba_80": changed(small["recover"], old80),
            "charge_vs_idle_rgba_80": changed(small["charge"], idle80),
            "adjacent_charge_rgba_80": changed(
                small["charge"], images["charge"][(facing + 1) % 32].resize(
                    (80, 80), Image.Resampling.LANCZOS)),
        }
        for key, value in transitions.items():
            assert value >= 35, ("invisible phase", facing, key, value)
        assert row["discharge_vs_old_attack_rgba_80"] >= 50, (
            "not a new discharge", facing, row)
        assert row["discharge_vs_idle_alpha_80"] >= 20, (
            "discharge silhouette not readable", facing, row)
        assert row["adjacent_charge_rgba_80"] >= 20, (
            "duplicate facing", facing, row)
        report["per_facing"][f"{facing:02d}"] = row

    for size in (160, 80):
        sheet = Image.new("RGBA", (size * 8, size * 4), (14, 24, 34, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, 32, 4)):
                frame = images[phase][facing]
                if size == 80:
                    frame = frame.resize((80, 80), Image.Resampling.LANCZOS)
                sheet.alpha_composite(frame, (col * size, row * size))
        sheet.save(stage / f"federation-bull-temporal-attack-contact-{size}.png")

    report["generated_atlas_sha256"] = hashlib.sha256(
        (stage / "federation-bull-temporal-attack-32-preview.png").read_bytes()
    ).hexdigest()
    (stage / "pixel-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    print("PASS: 128 new Bull four-phase 160px RGBA frames")
    for key in next(iter(report["per_facing"].values())):
        values = [row[key] for row in report["per_facing"].values()]
        print(key, "MIN", min(values), "MAX", max(values),
              "MEAN", round(sum(values) / len(values), 1))


if __name__ == "__main__":
    main()
