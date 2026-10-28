#!/usr/bin/env python3
"""FED-VEH-006 strict gameplay-scale QA, preview-only; does not publish sprites."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

STATES=("idle","move","attack","destroyed")
MIN={"move_rgba_80":65,"attack_rgba_80":100,"attack_alpha_80":25,
     "destroyed_alpha_80":110,"adjacent_rgba_80":50}


def delta(a,b,alpha=False):
    if alpha:a,b=a.getchannel("A"),b.getchannel("A")
    d=ImageChops.difference(a,b)
    return sum(bool(any(x) if isinstance(x,tuple) else x) for x in d.getdata())


def main():
    p=argparse.ArgumentParser();p.add_argument("--stage",type=Path,required=True)
    stage=p.parse_args().stage
    images={s:{} for s in STATES}
    hashes=set()
    atlas=Image.new("RGBA",(5120,640))
    report={"asset_id":"FED-VEH-006","asset":"Federation Mammoth Siege Tank",
            "preview_only":True,"facings":32,"states":list(STATES),
            "frame_size":[160,160],"minimum_thresholds":MIN,
            "directions":{},"adjacent_rgba_80":{},"minimum_canvas_margin_160":160}
    for row,state in enumerate(STATES):
        for facing in range(32):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as f:
                assert f.mode=="RGBA" and f.size==(160,160),(path,f.mode,f.size)
                img=f.copy()
            bbox=img.getchannel("A").getbbox()
            assert bbox,(state,facing,"transparent empty")
            margin=min(bbox[0],bbox[1],160-bbox[2],160-bbox[3])
            assert margin>=2,(state,facing,"clipped",bbox)
            report["minimum_canvas_margin_160"]=min(report["minimum_canvas_margin_160"],margin)
            digest=hashlib.sha256(img.tobytes()).hexdigest()
            assert digest not in hashes,("duplicate facing or state",state,facing)
            hashes.add(digest)
            images[state][facing]=img
            atlas.paste(img,(facing*160,row*160))
    atlas.save(stage/"federation-mammoth-siege-32-preview.png",optimize=True)
    for facing in range(32):
        small={s:images[s][facing].resize((80,80),Image.Resampling.LANCZOS) for s in STATES}
        idle=small["idle"]
        metrics={
            "move_rgba_80":delta(idle,small["move"]),
            "attack_rgba_80":delta(idle,small["attack"]),
            "attack_alpha_80":delta(idle,small["attack"],True),
            "destroyed_rgba_80":delta(idle,small["destroyed"]),
            "destroyed_alpha_80":delta(idle,small["destroyed"],True),
            "destroyed_alpha_160":delta(images["idle"][facing],images["destroyed"][facing],True)
        }
        for key in ("move_rgba_80","attack_rgba_80","attack_alpha_80","destroyed_alpha_80"):
            assert metrics[key]>=MIN[key],(facing,key,metrics[key],MIN[key])
        report["directions"][f"{facing:02d}"]=metrics
        nxt=images["idle"][(facing+1)%32].resize((80,80),Image.Resampling.LANCZOS)
        adjacent=delta(idle,nxt)
        assert adjacent>=MIN["adjacent_rgba_80"],(facing,"adjacent",adjacent)
        report["adjacent_rgba_80"][f"{facing:02d}"]=adjacent
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(18,23,30,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,32,4)):
                img=images[state][facing]
                if size==80:img=img.resize((80,80),Image.Resampling.LANCZOS)
                sheet.alpha_composite(img,(col*size,row*size))
        sheet.save(stage/f"federation-mammoth-siege-contact-{size}.png")
    report["unique_frame_hashes"]=len(hashes)
    report["ranges"]={key:{"min":min(m[key] for m in report["directions"].values()),
                           "max":max(m[key] for m in report["directions"].values())}
                      for key in next(iter(report["directions"].values()))}
    report["ranges"]["adjacent_rgba_80"]={
        "min":min(report["adjacent_rgba_80"].values()),
        "max":max(report["adjacent_rgba_80"].values())}
    report["atlas_sha256"]=hashlib.sha256(
        (stage/"federation-mammoth-siege-32-preview.png").read_bytes()).hexdigest()
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS FED-VEH-006: 128 unique, unclipped RGBA frames and 32 strict 80px facings")
    print(json.dumps(report["ranges"],sort_keys=True))

if __name__=="__main__":main()
