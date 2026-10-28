#!/usr/bin/env python3
"""PSI-VEH-004 strict 160px/80px independent pixel QA; preview-only."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

STATES=("idle","move","attack","destroyed")
# Declared before the first render. Attack alpha requires physical silhouette
# changes, not only an emission/color change.
MIN={"move_rgba_80":95,"attack_rgba_80":150,
     "attack_alpha_80":60,"destroyed_alpha_80":125,
     "adjacent_rgba_80":65}


def changed(a,b,alpha=False):
    if alpha:
        a,b=a.getchannel("A"),b.getchannel("A")
    return sum(any(p) if isinstance(p,tuple) else bool(p)
               for p in ImageChops.difference(a,b).getdata())


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",type=Path,required=True)
    stage=parser.parse_args().stage
    images={state:{} for state in STATES}
    hashes=set()
    atlas=Image.new("RGBA",(5120,640))
    report={"asset_id":"PSI-VEH-004",
            "asset":"Psionic Hallucination Drone",
            "preview_only":True,"facings":32,
            "states":list(STATES),"frame_size":[160,160],
            "minimum_thresholds":MIN,
            "directions":{},"adjacent_rgba_80":{},
            "minimum_canvas_margin_160":160}
    for row,state in enumerate(STATES):
        for facing in range(32):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as raw:
                assert raw.mode=="RGBA" and raw.size==(160,160),(
                    str(path),raw.mode,raw.size)
                img=raw.copy()
            bbox=img.getchannel("A").getbbox()
            assert bbox,(state,facing,"empty alpha")
            margin=min(bbox[0],bbox[1],160-bbox[2],160-bbox[3])
            assert margin>=2,(state,facing,"clipped",bbox)
            report["minimum_canvas_margin_160"]=min(
                report["minimum_canvas_margin_160"],margin)
            digest=hashlib.sha256(img.tobytes()).hexdigest()
            assert digest not in hashes,("duplicate facing or state",state,facing)
            hashes.add(digest)
            images[state][facing]=img
            atlas.paste(img,(160*facing,160*row))
    atlas_path=stage/"psionic-hallucination-drone-32-preview.png"
    atlas.save(atlas_path,optimize=True)
    for facing in range(32):
        small={state:images[state][facing].resize(
            (80,80),Image.Resampling.LANCZOS) for state in STATES}
        idle=small["idle"]
        metrics={
            "move_rgba_80":changed(idle,small["move"]),
            "attack_rgba_80":changed(idle,small["attack"]),
            "attack_alpha_80":changed(idle,small["attack"],True),
            "destroyed_rgba_80":changed(idle,small["destroyed"]),
            "destroyed_alpha_80":changed(idle,small["destroyed"],True),
            "attack_alpha_160":changed(
                images["idle"][facing],images["attack"][facing],True),
            "destroyed_alpha_160":changed(
                images["idle"][facing],images["destroyed"][facing],True),
        }
        for key in ("move_rgba_80","attack_rgba_80","attack_alpha_80",
                    "destroyed_alpha_80"):
            assert metrics[key]>=MIN[key],(
                facing,key,metrics[key],MIN[key])
        report["directions"][f"{facing:02d}"]=metrics
        nxt=images["idle"][(facing+1)%32].resize(
            (80,80),Image.Resampling.LANCZOS)
        adjacent=changed(idle,nxt)
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
        sheet.save(stage/f"psionic-hallucination-drone-contact-{size}.png")
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
    print("PASS PSI-VEH-004: 128 unique RGBA frames; 32 strict 80px directions")
    print(json.dumps(report["ranges"],sort_keys=True))


if __name__=="__main__":
    main()
