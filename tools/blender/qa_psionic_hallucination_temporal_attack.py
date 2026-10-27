#!/usr/bin/env python3
"""Strict actual-PNG QA for PSI-VEH-004 four-phase psychic discharge."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

PHASES = ("charge", "focus", "burst", "cooldown")
FACINGS = 32
SIZE = 160
ARCHIVED_SHA = "59e25ecc1d6f844370ff2233636b3e61ffd2e82ce09fb92e70fbde1ecf49940d"


def changed(a, b, alpha=False):
    if alpha:
        a, b = a.getchannel("A"), b.getchannel("A")
    diff = ImageChops.difference(a, b)
    return sum(bool(any(p) if isinstance(p, tuple) else p)
               for p in diff.getdata())


def read(path):
    with Image.open(path) as image:
        assert image.size == (SIZE, SIZE) and image.mode == "RGBA", (
            "invalid transparent 160px frame", str(path), image.size, image.mode)
        result = image.copy()
    bounds = result.getchannel("A").getbbox()
    assert bounds and bounds[0] >= 2 and bounds[1] >= 2 and (
        bounds[2] <= 158 and bounds[3] <= 158), (
        "empty or clipped 160px sprite", str(path), bounds)
    return result


def small(image):
    return image.resize((80, 80), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    args = parser.parse_args()
    stage, baseline = args.stage, args.baseline
    old_atlas = baseline / "psionic-hallucination-drone-32-preview.png"
    old_sha = hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    assert old_sha == ARCHIVED_SHA, (
        "Unexpected baseline: refuse to compare or overwrite", old_sha)

    images = {phase: {} for phase in PHASES}
    atlas = Image.new("RGBA", (SIZE*FACINGS, SIZE*len(PHASES)))
    for row, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            image = read(stage/"frames"/phase/("%02d.png" % facing))
            images[phase][facing] = image
            atlas.paste(image, (facing*SIZE, row*SIZE))
    atlas_path = stage/"psionic-hallucination-temporal-attack-32-preview.png"
    atlas.save(atlas_path, optimize=True)

    report = {
        "asset_register_id": "PSI-VEH-004",
        "preview_only": True,
        "baseline_run": 40583938655,
        "baseline_atlas_sha256_before": old_sha,
        "facings": FACINGS,
        "phases": list(PHASES),
        "frame_count": FACINGS*len(PHASES),
        "acceptance": {
            "phase_transition_rgba_80_min": 30,
            "burst_vs_old_attack_rgba_80_min": 50,
            "burst_vs_idle_alpha_80_min": 25,
            "adjacent_charge_rgba_80_min": 20,
        },
        "per_facing": {},
    }
    for facing in range(FACINGS):
        idle = small(read(baseline/"frames"/"idle"/("%02d.png" % facing)))
        attack = small(read(baseline/"frames"/"attack"/("%02d.png" % facing)))
        frames = {phase: small(images[phase][facing]) for phase in PHASES}
        transitions = {
            "%s_to_%s_rgba_80" % (a, b): changed(frames[a], frames[b])
            for a, b in zip(PHASES, PHASES[1:])
        }
        row = {
            **transitions,
            "burst_vs_old_attack_rgba_80": changed(frames["burst"], attack),
            "burst_vs_idle_rgba_80": changed(frames["burst"], idle),
            "burst_vs_idle_alpha_80": changed(frames["burst"], idle, True),
            "charge_vs_idle_rgba_80": changed(frames["charge"], idle),
            "adjacent_charge_rgba_80": changed(
                frames["charge"], small(images["charge"][(facing+1)%FACINGS])),
        }
        for metric, count in transitions.items():
            assert count >= 30, ("weak phase transition", facing, metric, count)
        assert row["burst_vs_old_attack_rgba_80"] >= 50, (
            "burst indistinct from old attack", facing, row)
        assert row["burst_vs_idle_alpha_80"] >= 25, (
            "burst silhouette not visible at 80px", facing, row)
        assert row["adjacent_charge_rgba_80"] >= 20, (
            "neighboring facings too similar", facing, row)
        report["per_facing"]["%02d" % facing] = row

    for size in (160, 80):
        sheet = Image.new("RGBA", (size*8, size*4), (15, 23, 35, 255))
        for row, phase in enumerate(PHASES):
            for col, facing in enumerate(range(0, FACINGS, 4)):
                frame = images[phase][facing]
                if size == 80:
                    frame = small(frame)
                sheet.alpha_composite(frame, (col*size, row*size))
        sheet.save(stage/("psionic-hallucination-temporal-contact-%d.png" % size))

    # An actual gameplay-scale temporal preview, never a production asset.
    gif_frames = []
    for phase in PHASES:
        canvas = Image.new("RGBA", (80, 80), (15, 23, 35, 255))
        canvas.alpha_composite(small(images[phase][4]))
        gif_frames.append(canvas.convert("RGB"))
    gif_frames[0].save(
        stage/"psionic-hallucination-temporal-facing04-80px.gif",
        save_all=True, append_images=gif_frames[1:],
        duration=[240, 180, 160, 240], loop=0, optimize=False)

    report["new_atlas_sha256"] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    report["baseline_atlas_sha256_after"] = hashlib.sha256(
        old_atlas.read_bytes()).hexdigest()
    assert report["baseline_atlas_sha256_after"] == ARCHIVED_SHA
    (stage/"pixel-qa.json").write_text(json.dumps(report, indent=2)+"\n")
    print("PASS 128 NEW Hallucination temporal frames; baseline atlas unchanged")
    print("BASELINE_SHA256", old_sha)
    for key in next(iter(report["per_facing"].values())):
        values = [row[key] for row in report["per_facing"].values()]
        print(key, "MIN", min(values), "MAX", max(values),
              "MEAN", round(sum(values)/len(values), 1))


if __name__ == "__main__":
    main()
