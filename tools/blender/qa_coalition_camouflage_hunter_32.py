#!/usr/bin/env python3
"""Strict pixel validation for original COA-VEH-005 preview, 160px and 80px.

No gameplay textures or manifests are written. Failed measurements remain
failures, never relaxed automatically. Output includes a separate preview atlas.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

STATES=("idle","move","attack","destroyed")
FACINGS=32
SIZE=160
LIMITS={
    "move_rgba_80":45,
    "attack_rgba_80":55,
    "destroyed_alpha_80":100,
    "adjacent_rgba_80":30,
}


def count_changed(a,b,alpha=False):
    if alpha:
        a,b=a.getchannel("A"),b.getchannel("A")
    diff=ImageChops.difference(a,b)
    return sum(any(v) if isinstance(v,tuple) else bool(v) for v in diff.getdata())


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    stage=p.parse_args().stage
    source=stage/"coalition-camouflage-hunter.blend"
    assert source.stat().st_size>2000,("missing editable Blender source",source)
    images={state:{} for state in STATES}
    atlas=Image.new("RGBA",(SIZE*FACINGS,SIZE*len(STATES)))
    report={
        "asset":"Coalition Camouflage Hunter",
        "asset_register_id":"COA-VEH-005",
        "preview_only":True,
        "states":list(STATES),
        "facings":FACINGS,
        "frame_size":SIZE,
        "acceptance":LIMITS,
        "source_bytes":source.stat().st_size,
        "per_facing":{},
        "adjacent_rgba_80":{},
    }
    for row,state in enumerate(STATES):
        for facing in range(FACINGS):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as im:
                assert im.mode=="RGBA" and im.size==(SIZE,SIZE),(
                    "invalid format",path,im.mode,im.size)
                frame=im.copy()
            bounds=frame.getchannel("A").getbbox()
            assert bounds and bounds[0]>=3 and bounds[1]>=3 and bounds[2]<=157 and bounds[3]<=157,(
                "empty or clipped",state,facing,bounds)
            images[state][facing]=frame
            atlas.paste(frame,(SIZE*facing,SIZE*row))
    preview=stage/"coalition-camouflage-hunter-32-preview.png"
    atlas.save(preview,optimize=True)
    report["preview_atlas_sha256"]=hashlib.sha256(preview.read_bytes()).hexdigest()
    for facing in range(FACINGS):
        small={state:images[state][facing].resize((80,80),Image.Resampling.LANCZOS)
               for state in STATES}
        baseline=small["idle"]
        metrics={
            "move_rgba_80":count_changed(baseline,small["move"]),
            "attack_rgba_80":count_changed(baseline,small["attack"]),
            "destroyed_rgba_80":count_changed(baseline,small["destroyed"]),
            "destroyed_alpha_80":count_changed(baseline,small["destroyed"],True),
            "destroyed_alpha_160":count_changed(images["idle"][facing],images["destroyed"][facing],True),
        }
        report["per_facing"][f"{facing:02d}"]=metrics
        for key in ("move_rgba_80","attack_rgba_80","destroyed_alpha_80"):
            assert metrics[key]>=LIMITS[key],(
                "failed visible-state gate",facing,key,metrics[key],LIMITS[key])
        next_facing=(facing+1)%FACINGS
        next_frame=images["idle"][next_facing].resize((80,80),Image.Resampling.LANCZOS)
        delta=count_changed(baseline,next_frame)
        assert delta>=LIMITS["adjacent_rgba_80"],(
            "duplicate or imperceptible direction",facing,delta)
        report["adjacent_rgba_80"][f"{facing:02d}"]=delta
    for size in (160,80):
        board=Image.new("RGBA",(size*8,size*4),(22,28,37,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,FACINGS,4)):
                frame=images[state][facing]
                if size==80:
                    frame=frame.resize((80,80),Image.Resampling.LANCZOS)
                board.alpha_composite(frame,(col*size,row*size))
        board.save(stage/f"coalition-camouflage-hunter-contact-{size}.png")
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS 128 original RGBA frames, 32 facings, all 80px QA gates",flush=True)
    for key in ("move_rgba_80","attack_rgba_80","destroyed_alpha_80","destroyed_alpha_160"):
        values=[m[key] for m in report["per_facing"].values()]
        print(key,"MIN",min(values),"MAX",max(values),flush=True)
    print("adjacent_rgba_80 MIN",min(report["adjacent_rgba_80"].values()),
          "MAX",max(report["adjacent_rgba_80"].values()),flush=True)


if __name__=="__main__":
    main()
