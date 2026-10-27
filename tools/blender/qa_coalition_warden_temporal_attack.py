#!/usr/bin/env python3
"""Strict actual-pixel QA for the Warden's four NEW dual-ion attack phases."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

PHASES = ("charge", "synchronize", "volley", "cooldown")
FACINGS = 32
SIZE = 160


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(bool(any(p) if isinstance(p, tuple) else p)
               for p in diff.getdata())


def read(path):
    with Image.open(path) as image:
        assert image.size == (SIZE, SIZE) and image.mode == "RGBA", (
            str(path), image.size, image.mode)
        result = image.copy()
    bounds = result.getchannel("A").getbbox()
    assert bounds and bounds[0] >= 2 and bounds[1] >= 2 and (
        bounds[2] <= 158 and bounds[3] <= 158), (
        "clipped or empty frame", str(path), bounds)
    return result


def small(image):
    return image.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    archived_atlas = baseline / "coalition-autonomous-warden-32-preview.png"
    original_sha = hashlib.sha256(archived_atlas.read_bytes()).hexdigest()
    images = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (SIZE*FACINGS, SIZE*len(PHASES)))
    report = {
        "asset": "COA-VEH-004 Coalition Autonomous Warden dual-ion temporal attack",
        "preview_only": True,
        "facings": FACINGS,
        "frame_size": SIZE,
        "phases": list(PHASES),
        "archived_atlas_sha256_before": original_sha,
        "acceptance": {
            "phase_transition_rgba_80_min": 30,
            "volley_vs_old_attack_rgba_80_min": 50,
            "volley_vs_idle_alpha_80_min": 20,
            "adjacent_charge_rgba_80_min": 20
        },
        "per_facing": {}
    }
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            image = read(stage/"frames"/phase/f"{facing:02d}.png")
            images[phase][facing] = image
            atlas.paste(image, (facing*SIZE, row*SIZE))
    new_atlas = stage/"coalition-warden-temporal-attack-32-preview.png"
    atlas.save(new_atlas, optimize=True)

    for facing in range(FACINGS):
        idle = small(read(baseline/"frames"/"idle"/f"{facing:02d}.png"))
        attack = small(read(baseline/"frames"/"attack"/f"{facing:02d}.png"))
        frames = {phase: small(images[phase][facing]) for phase in PHASES}
        transitions = {
            f"{a}_to_{b}_rgba_80": changed(frames[a], frames[b])
            for a, b in zip(PHASES, PHASES[1:])
        }
        row = {
            **transitions,
            "volley_vs_old_attack_rgba_80": changed(frames["volley"], attack),
            "volley_vs_idle_rgba_80": changed(frames["volley"], idle),
            "volley_vs_idle_alpha_80": changed(frames["volley"], idle, True),
            "charge_vs_idle_rgba_80": changed(frames["charge"], idle),
            "adjacent_charge_rgba_80": changed(
                frames["charge"], small(images["charge"][(facing+1)%FACINGS]))
        }
        for key, value in transitions.items():
            assert value >= 30, ("weak temporal phase", facing, key, value)
        assert row["volley_vs_old_attack_rgba_80"] >= 50, (
            "volley too similar to original single-frame attack", facing, row)
        assert row["volley_vs_idle_alpha_80"] >= 20, (
            "volley silhouette invisible at gameplay scale", facing, row)
        assert row["adjacent_charge_rgba_80"] >= 20, (
            "indistinct neighboring facing", facing, row)
        report["per_facing"][f"{facing:02d}"] = row

    for size in (160, 80):
        sheet = Image.new("RGBA", (size*8, size*4), (14, 24, 34, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                frame = images[phase][facing]
                if size == 80:
                    frame = small(frame)
                sheet.alpha_composite(frame, (col*size, row*size))
        sheet.save(stage/f"coalition-warden-temporal-contact-{size}.png")

    report["new_atlas_sha256"] = hashlib.sha256(new_atlas.read_bytes()).hexdigest()
    report["archived_atlas_sha256_after"] = hashlib.sha256(
        archived_atlas.read_bytes()).hexdigest()
    assert original_sha == report["archived_atlas_sha256_after"]
    (stage/"pixel-qa.json").write_text(json.dumps(report, indent=2)+"\n")
    print("PASS: 128 NEW Warden temporal frames; archived atlas unchanged")
    print("ARCHIVED_ATLAS_SHA256", original_sha)
    for key in next(iter(report["per_facing"].values())):
        values = [row[key] for row in report["per_facing"].values()]
        print(key, "MIN", min(values), "MAX", max(values),
              "MEAN", round(sum(values)/len(values), 1))


if __name__ == "__main__":
    main()
