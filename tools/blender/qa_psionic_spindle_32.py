#!/usr/bin/env python3
"""Strict actual-PNG validation of the original PSI-VEH-003 preview.

Every frame is measured at 160px and 80px. This script only writes review
artifacts in --stage; it never edits production sprite manifests or textures.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

STATES = ("idle","move","attack","destroyed")
FACINGS = 32
SIZE = 160
LIMITS = {
    "move_rgba_80": 25,
    "attack_rgba_80": 45,
    "destroyed_alpha_80": 75,
    "adjacent_rgba_80": 25,
}


def changed(a,b,alpha=False):
    if alpha:
        a,b = a.getchannel("A"),b.getchannel("A")
    diff = ImageChops.difference(a,b)
    return sum(bool(any(p) if isinstance(p,tuple) else p) for p in diff.getdata())


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",type=Path,required=True)
    stage=parser.parse_args().stage
    images={state:{} for state in STATES}
    atlas=Image.new("RGBA",(SIZE*FACINGS,SIZE*len(STATES)))
    report={
        "asset":"Psionic Spindle Cannon Tank",
        "asset_register_id":"PSI-VEH-003",
        "preview_only":True,
        "states":list(STATES),
        "facings":FACINGS,
        "frame_size":SIZE,
        "acceptance":LIMITS,
        "per_facing":{},
        "adjacent_rgba_80":{},
        "source_bytes":(stage/"psionic-spindle-cannon-tank.blend").stat().st_size,
    }
    assert report["source_bytes"]>2000
    for row,state in enumerate(STATES):
        for facing in range(FACINGS):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as im:
                assert im.size==(SIZE,SIZE),(path,im.size)
                assert im.mode=="RGBA",(path,im.mode)
                frame=im.copy()
            bounds=frame.getchannel("A").getbbox()
            assert bounds and bounds[0]>=3 and bounds[1]>=3 and bounds[2]<=157 and bounds[3]<=157,(
                "empty or clipped",state,facing,bounds)
            images[state][facing]=frame
            atlas.paste(frame,(SIZE*facing,SIZE*row))
    preview=stage/"psionic-spindle-cannon-32-preview.png"
    atlas.save(preview,optimize=True)
    report["preview_atlas_sha256"]=hashlib.sha256(preview.read_bytes()).hexdigest()
    for facing in range(FACINGS):
        small={state:images[state][facing].resize((80,80),Image.Resampling.LANCZOS)
               for state in STATES}
        baseline=small["idle"]
        metrics={
            "move_rgba_80":changed(baseline,small["move"]),
            "attack_rgba_80":changed(baseline,small["attack"]),
            "destroyed_rgba_80":changed(baseline,small["destroyed"]),
            "destroyed_alpha_80":changed(baseline,small["destroyed"],True),
            "destroyed_alpha_160":changed(images["idle"][facing],images["destroyed"][facing],True),
        }
        for key in ("move_rgba_80","attack_rgba_80","destroyed_alpha_80"):
            assert metrics[key]>=LIMITS[key],(facing,key,metrics[key],LIMITS[key])
        report["per_facing"][f"{facing:02d}"]=metrics
        following=images["idle"][(facing+1)%FACINGS].resize((80,80),Image.Resampling.LANCZOS)
        delta=changed(baseline,following)
        assert delta>=LIMITS["adjacent_rgba_80"],(facing,"duplicate facing",delta)
        report["adjacent_rgba_80"][f"{facing:02d}"]=delta
    for size in (160,80):
        board=Image.new("RGBA",(size*8,size*4),(18,26,38,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,FACINGS,4)):
                frame=images[state][facing]
                if size==80:
                    frame=frame.resize((80,80),Image.Resampling.LANCZOS)
                board.alpha_composite(frame,(col*size,row*size))
        board.save(stage/f"psionic-spindle-contact-{size}.png")
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS 128 RGBA 160px frames; 32 facings; all 80px gates")
    for key in ("move_rgba_80","attack_rgba_80","destroyed_alpha_80","destroyed_alpha_160"):
        values=[d[key] for d in report["per_facing"].values()]
        print(key,"MIN",min(values),"MAX",max(values))
    print("adjacent_rgba_80 MIN",min(report["adjacent_rgba_80"].values()),
          "MAX",max(report["adjacent_rgba_80"].values()))


if __name__=="__main__":
    main()
