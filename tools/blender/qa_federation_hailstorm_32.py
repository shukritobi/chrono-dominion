#!/usr/bin/env python3
"""Inspect 128 real Federation Hailstorm preview PNGs, including 80px gameplay scale."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops

STATES=("idle","move","attack","destroyed")


def delta(a,b,alpha=False):
    if alpha:
        a,b=a.getchannel("A"),b.getchannel("A")
    diff=ImageChops.difference(a,b)
    return sum(1 for px in diff.getdata()
               if any(px) if isinstance(px,tuple) else px)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",type=Path,required=True)
    stage=parser.parse_args().stage
    images={state:{} for state in STATES}
    atlas=Image.new("RGBA",(160*32,160*len(STATES)))
    report={"asset":"Federation Hailstorm Rocket Artillery",
            "asset_register_id":"FED-VEH-005","preview_only":True,
            "frame_size":160,"facings":32,"states":list(STATES),
            "directions":{},"adjacent_rgba_80":{}}
    for row,state in enumerate(STATES):
        for facing in range(32):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as source:
                assert source.size==(160,160),(path,source.size)
                assert source.mode=="RGBA",(path,source.mode)
                frame=source.copy()
            bbox=frame.getchannel("A").getbbox()
            assert bbox and bbox[0]>=2 and bbox[1]>=2 and bbox[2]<=158 and bbox[3]<=158,(
                state,facing,"empty or clipped",bbox)
            images[state][facing]=frame
            atlas.paste(frame,(160*facing,160*row))
    atlas.save(stage/"federation-hailstorm-32-facing-preview.png",optimize=True)
    for facing in range(32):
        small={state:images[state][facing].resize((80,80),Image.Resampling.LANCZOS)
               for state in STATES}
        idle=small["idle"]
        row={"move_rgba_80":delta(idle,small["move"]),
             "attack_rgba_80":delta(idle,small["attack"]),
             "destroyed_rgba_80":delta(idle,small["destroyed"]),
             "destroyed_alpha_80":delta(idle,small["destroyed"],True)}
        assert row["move_rgba_80"]>=20,(facing,"movement invisible",row)
        assert row["attack_rgba_80"]>=40,(facing,"missile attack invisible",row)
        assert row["destroyed_alpha_80"]>=65,(facing,"wreck silhouette invisible",row)
        report["directions"][f"{facing:02d}"]=row
        adjacent=images["idle"][(facing+1)%32].resize((80,80),Image.Resampling.LANCZOS)
        diff=delta(idle,adjacent)
        assert diff>=20,(facing,"duplicate facing",diff)
        report["adjacent_rgba_80"][f"{facing:02d}"]=diff
    for size in (160,80):
        contact=Image.new("RGBA",(size*8,size*4),(15,23,35,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,32,4)):
                frame=images[state][facing]
                if size==80:
                    frame=frame.resize((80,80),Image.Resampling.LANCZOS)
                contact.alpha_composite(frame,(col*size,row*size))
        contact.save(stage/f"federation-hailstorm-contact-{size}.png")
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS: 128 unique, unclipped 160px RGBA Federation Hailstorm frames")
    for key in ("move_rgba_80","attack_rgba_80","destroyed_alpha_80"):
        values=[r[key] for r in report["directions"].values()]
        print(key,"MIN",min(values),"MAX",max(values))
    print("adjacent_rgba_80 MIN",min(report["adjacent_rgba_80"].values()),
          "MAX",max(report["adjacent_rgba_80"].values()))


if __name__=="__main__":
    main()
