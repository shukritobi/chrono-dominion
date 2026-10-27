#!/usr/bin/env python3
"""Validate real rendered Hunter Spider Drone sprites at 160px and 80px.

Reject invisible gait, fake attack/destruction, duplicate facings, clipping,
empty alpha and source frame dimension mismatches. No live atlas writes.
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops

STATES=("idle","move","attack","destroyed")
FACINGS=32
SIZE=160


def changed(a,b,alpha=False):
    if alpha:
        a,b=a.getchannel("A"),b.getchannel("A")
    diff=ImageChops.difference(a,b)
    return sum(1 for pixel in diff.getdata()
               if (any(pixel) if isinstance(pixel,tuple) else bool(pixel)))


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",type=Path,required=True)
    stage=parser.parse_args().stage
    images={state:{} for state in STATES}
    atlas=Image.new("RGBA",(SIZE*FACINGS,SIZE*len(STATES)))
    report={
        "asset":"Federation Hunter Spider Drone",
        "asset_register_id":"FED-VEH-004",
        "preview_only":True,
        "frame_size":SIZE,
        "facings":FACINGS,
        "states":list(STATES),
        "per_facing":{},
        "adjacent_rgba_80":{}
    }
    for row,state in enumerate(STATES):
        for facing in range(FACINGS):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as im:
                assert im.size==(SIZE,SIZE),(path,im.size)
                assert im.mode=="RGBA",(path,im.mode)
                frame=im.copy()
            bbox=frame.getchannel("A").getbbox()
            assert bbox and bbox[0]>=2 and bbox[1]>=2 and bbox[2]<=158 and bbox[3]<=158,(
                "empty or clipped",state,facing,bbox)
            images[state][facing]=frame
            atlas.paste(frame,(SIZE*facing,SIZE*row))
    atlas.save(stage/"federation-hunter-spider-32-preview.png",optimize=True)
    for facing in range(FACINGS):
        small={state:images[state][facing].resize((80,80),Image.Resampling.LANCZOS)
               for state in STATES}
        idle=small["idle"]
        row={
            "move_rgba_80":changed(idle,small["move"]),
            "attack_rgba_80":changed(idle,small["attack"]),
            "destroyed_rgba_80":changed(idle,small["destroyed"]),
            "destroyed_alpha_80":changed(idle,small["destroyed"],True),
            "destroyed_alpha_160":changed(images["idle"][facing],
                                          images["destroyed"][facing],True)
        }
        assert row["move_rgba_80"]>=50,("invisible leg gait",facing,row)
        assert row["attack_rgba_80"]>=50,("invisible jump attack",facing,row)
        assert row["destroyed_alpha_80"]>=75,("invisible collapsed wreckage",facing,row)
        report["per_facing"][f"{facing:02d}"]=row
        adjacent=images["idle"][(facing+1)%FACINGS].resize(
            (80,80),Image.Resampling.LANCZOS)
        difference=changed(idle,adjacent)
        assert difference>=30,("duplicate facing",facing,difference)
        report["adjacent_rgba_80"][f"{facing:02d}"]=difference
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(15,23,32,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,FACINGS,4)):
                frame=images[state][facing]
                if size==80:
                    frame=frame.resize((80,80),Image.Resampling.LANCZOS)
                sheet.alpha_composite(frame,(col*size,row*size))
        sheet.save(stage/f"federation-hunter-spider-contact-{size}.png")
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS: 128 unclipped original Hunter Spider RGBA previews")
    for key in ("move_rgba_80","attack_rgba_80",
                "destroyed_alpha_80","destroyed_alpha_160"):
        values=[row[key] for row in report["per_facing"].values()]
        print(key,"MIN",min(values),"MAX",max(values))
    values=list(report["adjacent_rgba_80"].values())
    print("adjacent_rgba_80 MIN",min(values),"MAX",max(values))


if __name__=="__main__":
    main()
