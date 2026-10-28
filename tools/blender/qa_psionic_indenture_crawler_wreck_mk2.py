#!/usr/bin/env python3
"""Independent MK-II destroyed-only visual regression and preservation QA."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image
import qa_psionic_indenture_crawler_32 as base

MIN_CHANGED_RGBA_80=65
MIN_CHANGED_RGBA_160=220

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--stage",type=Path,required=True)
    ap.add_argument("--baseline",type=Path,required=True)
    args=ap.parse_args()
    stage,original=args.stage,args.baseline
    for state in ("idle","move","harvest"):
        for facing in range(32):
            name=f"frames/{state}/{facing:02d}.png"
            assert digest(stage/name)==digest(original/name),("unchanged frame regression",name)
    old=json.loads((original/"pixel-qa.json").read_text())
    new=json.loads((stage/"pixel-qa.json").read_text())
    assert old["asset_id"]==new["asset_id"]=="PSI-VEH-001"
    assert new["unique_frame_hashes"]==128
    delta80=[];delta160=[]
    for facing in range(32):
        name=f"frames/destroyed/{facing:02d}.png"
        with Image.open(stage/name) as im:newimg=im.convert("RGBA")
        with Image.open(original/name) as im:oldimg=im.convert("RGBA")
        assert newimg.size==oldimg.size==(160,160)
        a=base.changed(newimg,oldimg)
        b=base.changed(newimg.resize((80,80),Image.Resampling.LANCZOS),
                       oldimg.resize((80,80),Image.Resampling.LANCZOS))
        assert a>=MIN_CHANGED_RGBA_160,(facing,"160px",a)
        assert b>=MIN_CHANGED_RGBA_80,(facing,"80px",b)
        delta80.append(b);delta160.append(a)
    report={
        "asset_id":"PSI-VEH-001","preview_only":True,
        "baseline_run":40784608098,
        "reused_byte_identical_frames":96,"rerendered_destroyed_frames":32,
        "min_delta_rgba_80_threshold":MIN_CHANGED_RGBA_80,
        "min_delta_rgba_160_threshold":MIN_CHANGED_RGBA_160,
        "destroyed_old_to_mk2_rgba_80":{"min":min(delta80),"max":max(delta80)},
        "destroyed_old_to_mk2_rgba_160":{"min":min(delta160),"max":max(delta160)},
        "old_atlas_sha256":old["atlas_sha256"],
        "mk2_atlas_sha256":new["atlas_sha256"]
    }
    assert report["old_atlas_sha256"]!=report["mk2_atlas_sha256"]
    (stage/"wreck-mk2-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS MK-II: 96 original PNGs byte-identical, 32 changed destroyed sprites",report)

if __name__=="__main__":
    main()
