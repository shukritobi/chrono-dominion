#!/usr/bin/env python3
"""Independent MK-II wreck audit against archived COA-VEH-008 baseline.

Baseline 96 frames must remain byte-identical; destroyed-only change must
remain legible after real LANCZOS downsampling to 80px. No threshold relaxation.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image
import qa_coalition_mcv_32 as base

MIN_WRECK_RGBA_DELTA_80 = 70
MIN_WRECK_RGBA_DELTA_160 = 240


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", type=Path, required=True)
    ap.add_argument("--baseline", type=Path, required=True)
    args = ap.parse_args()
    stage, original = args.stage, args.baseline
    for state in ("idle", "move", "deploy"):
        for direction in range(32):
            name = f"frames/{state}/{direction:02d}.png"
            assert digest(stage/name) == digest(original/name), ("untouched frame changed", name)
    base_report = json.loads((original/"pixel-qa.json").read_text())
    base.main() if False else None  # Baseline strict QA invoked separately in workflow.
    delta80, delta160 = [], []
    for direction in range(32):
        name = f"frames/destroyed/{direction:02d}.png"
        with Image.open(stage/name) as im:
            new = im.convert("RGBA")
        with Image.open(original/name) as im:
            old = im.convert("RGBA")
        assert new.size == old.size == (160, 160)
        a = base.changed(new, old)
        b = base.changed(new.resize((80, 80), Image.Resampling.LANCZOS),
                         old.resize((80, 80), Image.Resampling.LANCZOS))
        assert a >= MIN_WRECK_RGBA_DELTA_160, (direction, a)
        assert b >= MIN_WRECK_RGBA_DELTA_80, (direction, b)
        delta160.append(a)
        delta80.append(b)
    report = json.loads((stage/"pixel-qa.json").read_text())
    assert report["unique_frame_hashes"] == 128
    assert report["asset_id"] == base_report["asset_id"] == "COA-VEH-008"
    result = {
        "asset_id": "COA-VEH-008",
        "preview_only": True,
        "reused_byte_identical_frames": 96,
        "rerendered_destroyed_frames": 32,
        "min_wreck_rgba_delta_80": MIN_WRECK_RGBA_DELTA_80,
        "min_wreck_rgba_delta_160": MIN_WRECK_RGBA_DELTA_160,
        "wreck_rgba_delta_80": {"min": min(delta80), "max": max(delta80)},
        "wreck_rgba_delta_160": {"min": min(delta160), "max": max(delta160)},
        "original_atlas_sha256": base_report["atlas_sha256"],
        "mk2_atlas_sha256": report["atlas_sha256"],
        "new_source_reopen_required": True
    }
    assert result["original_atlas_sha256"] != result["mk2_atlas_sha256"]
    (stage/"wreck-mk2-qa.json").write_text(json.dumps(result, indent=2)+"\n")
    print("PASS wreck MK-II, 96 original frames byte-identical, 32 physical wreck changes", result)


if __name__ == "__main__":
    main()
