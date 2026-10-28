#!/usr/bin/env python3
"""Strict 160/80px FED-VEH-004 QA; no game artwork publication."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image,ImageChops

STATES=("idle","move","attack","destroyed")


def delta(a,b,alpha=False):
    if alpha:
        a,b=a.getchannel("A"),b.getchannel("A")
    diff=ImageChops.difference(a,b)
    return sum(bool(any(v) if isinstance(v,tuple) else v) for v in diff.getdata())


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    stage=p.parse_args().stage
    imgs={state:{} for state in STATES}
    report={"asset_id":"FED-VEH-004","asset":"Federation Hunter Spider Drone",
            "preview_only":True,"frame_size":[160,160],"facings":32,
            "states":list(STATES),"directions":{},"adjacent_rgba_80":{}}
    unique=set()
    atlas=Image.new("RGBA",(160*32,160*4))
    for row,state in enumerate(STATES):
        for facing in range(32):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as src:
                assert src.mode=="RGBA" and src.size==(160,160),(path,src.mode,src.size)
                img=src.copy()
            bounds=img.getchannel("A").getbbox()
            assert bounds and bounds[0]>=2 and bounds[1]>=2 and bounds[2]<=158 and bounds[3]<=158,(state,facing,bounds)
            digest=hashlib.sha256(img.tobytes()).hexdigest()
            assert digest not in unique,("duplicate frame",state,facing)
            unique.add(digest)
            imgs[state][facing]=img
            atlas.paste(img,(160*facing,160*row))
    atlas.save(stage/"federation-spider-drone-32-preview.png",optimize=True)
    for facing in range(32):
        small={s:imgs[s][facing].resize((80,80),Image.Resampling.LANCZOS) for s in STATES}
        baseline=small["idle"]
        metrics={
            "move_rgba_80":delta(baseline,small["move"]),
            "attack_rgba_80":delta(baseline,small["attack"]),
            "attack_alpha_80":delta(baseline,small["attack"],True),
            "destroyed_rgba_80":delta(baseline,small["destroyed"]),
            "destroyed_alpha_80":delta(baseline,small["destroyed"],True),
            "destroyed_alpha_160":delta(imgs["idle"][facing],imgs["destroyed"][facing],True),
        }
        assert metrics["move_rgba_80"]>=45,(facing,"move",metrics)
        assert metrics["attack_rgba_80"]>=80,(facing,"attack",metrics)
        assert metrics["attack_alpha_80"]>=25,(facing,"physical attack silhouette",metrics)
        assert metrics["destroyed_alpha_80"]>=95,(facing,"physical wreckage",metrics)
        report["directions"][f"{facing:02d}"]=metrics
        other=imgs["idle"][(facing+1)%32].resize((80,80),Image.Resampling.LANCZOS)
        adjacent=delta(baseline,other)
        assert adjacent>=40,(facing,"duplicate direction",adjacent)
        report["adjacent_rgba_80"][f"{facing:02d}"]=adjacent
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(17,23,31,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,32,4)):
                image=imgs[state][facing]
                if size==80:
                    image=image.resize((80,80),Image.Resampling.LANCZOS)
                sheet.alpha_composite(image,(col*size,row*size))
        sheet.save(stage/f"federation-spider-drone-contact-{size}.png")
    report["unique_frame_hashes"]=len(unique)
    report["ranges"]={key:{"min":min(d[key] for d in report["directions"].values()),
                            "max":max(d[key] for d in report["directions"].values())}
                       for key in next(iter(report["directions"].values()))}
    report["ranges"]["adjacent_rgba_80"]={
        "min":min(report["adjacent_rgba_80"].values()),
        "max":max(report["adjacent_rgba_80"].values())}
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS: 128 unique, unclipped transparent RGBA frames; 32 facings")
    print("RANGES:",json.dumps(report["ranges"],sort_keys=True))


if __name__=="__main__":
    main()
