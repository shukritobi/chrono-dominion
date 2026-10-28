#!/usr/bin/env python3
"""FED-VEH-007 independent pixel-level 32-facing QA, preview ONLY."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

STATES=("idle","move","deploy","destroyed")
# Predeclared thresholds: deployment must alter actual alpha, not just RGB.
MIN={"move_rgba_80":65,"deploy_rgba_80":130,"deploy_alpha_80":85,
     "destroyed_alpha_80":110,"adjacent_rgba_80":50}


def changed(a,b,alpha=False):
    if alpha:
        a,b=a.getchannel("A"),b.getchannel("A")
    return sum(any(px) if isinstance(px,tuple) else bool(px)
               for px in ImageChops.difference(a,b).getdata())


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",type=Path,required=True)
    stage=parser.parse_args().stage
    images={state:{} for state in STATES}
    hashes=set()
    atlas=Image.new("RGBA",(5120,640))
    report={"asset_id":"FED-VEH-007","asset":"Federation MCV",
            "preview_only":True,"facings":32,"states":list(STATES),
            "frame_size":[160,160],"minimum_thresholds":MIN,
            "directions":{},"adjacent_rgba_80":{},
            "minimum_canvas_margin_160":160}
    for row,state in enumerate(STATES):
        for facing in range(32):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as source:
                assert source.mode=="RGBA" and source.size==(160,160),(
                    str(path),source.mode,source.size)
                img=source.copy()
            bbox=img.getchannel("A").getbbox()
            assert bbox,(state,facing,"empty frame")
            margin=min(bbox[0],bbox[1],160-bbox[2],160-bbox[3])
            assert margin>=2,(state,facing,"clipped",bbox)
            report["minimum_canvas_margin_160"]=min(
                report["minimum_canvas_margin_160"],margin)
            digest=hashlib.sha256(img.tobytes()).hexdigest()
            assert digest not in hashes,("duplicate pose or direction",state,facing)
            hashes.add(digest)
            images[state][facing]=img
            atlas.paste(img,(160*facing,160*row))
    atlas_path=stage/"federation-mcv-32-preview.png"
    atlas.save(atlas_path,optimize=True)
    for facing in range(32):
        small={state:images[state][facing].resize(
            (80,80),Image.Resampling.LANCZOS) for state in STATES}
        idle=small["idle"]
        m={
            "move_rgba_80":changed(idle,small["move"]),
            "deploy_rgba_80":changed(idle,small["deploy"]),
            "deploy_alpha_80":changed(idle,small["deploy"],True),
            "destroyed_rgba_80":changed(idle,small["destroyed"]),
            "destroyed_alpha_80":changed(idle,small["destroyed"],True),
            "deploy_alpha_160":changed(images["idle"][facing],
                                       images["deploy"][facing],True),
            "destroyed_alpha_160":changed(images["idle"][facing],
                                          images["destroyed"][facing],True),
        }
        for key in ("move_rgba_80","deploy_rgba_80","deploy_alpha_80",
                    "destroyed_alpha_80"):
            assert m[key]>=MIN[key],(facing,key,m[key],MIN[key])
        report["directions"][f"{facing:02d}"]=m
        next_img=images["idle"][(facing+1)%32].resize(
            (80,80),Image.Resampling.LANCZOS)
        adjacent=changed(idle,next_img)
        assert adjacent>=MIN["adjacent_rgba_80"],(
            facing,"adjacent",adjacent,MIN["adjacent_rgba_80"])
        report["adjacent_rgba_80"][f"{facing:02d}"]=adjacent
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(18,23,30,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,32,4)):
                img=images[state][facing]
                if size==80:
                    img=img.resize((80,80),Image.Resampling.LANCZOS)
                sheet.alpha_composite(img,(col*size,row*size))
        sheet.save(stage/f"federation-mcv-contact-{size}.png")
    report["unique_frame_hashes"]=len(hashes)
    report["ranges"]={
        key:{"min":min(d[key] for d in report["directions"].values()),
             "max":max(d[key] for d in report["directions"].values())}
        for key in next(iter(report["directions"].values()))
    }
    report["ranges"]["adjacent_rgba_80"]={
        "min":min(report["adjacent_rgba_80"].values()),
        "max":max(report["adjacent_rgba_80"].values())
    }
    report["atlas_sha256"]=hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS FED-VEH-007: 128 unique unclipped RGBA sprites; "
          "all 32 movement, physical deployment, wreckage and facing gates")
    print(json.dumps(report["ranges"],sort_keys=True))


if __name__=="__main__":
    main()
