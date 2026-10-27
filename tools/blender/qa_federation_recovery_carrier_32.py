#!/usr/bin/env python3
"""Validate all 128 Federation recovery carrier RGBA frames at 160px and 80px.

Only packs preview artifacts. Never writes the live game atlas/manifest.
"""
import argparse,json
from pathlib import Path
from PIL import Image,ImageChops
STATES=("idle","move","attack","destroyed")
def difference(a,b,alpha=False):
    if alpha:a,b=a.getchannel("A"),b.getchannel("A")
    return sum(1 for px in ImageChops.difference(a,b).getdata()
               if (any(px) if isinstance(px,tuple) else px))
def main():
    p=argparse.ArgumentParser();p.add_argument("--stage",type=Path,required=True)
    stage=p.parse_args().stage
    images={};sheet=Image.new("RGBA",(5120,640))
    report={"asset":"Iron Federation AR-9 Recovery Carrier","facings":32,
            "frame_size":160,"states":list(STATES),"directions":{}}
    for row,state in enumerate(STATES):
        images[state]={}
        for facing in range(32):
            path=stage/"frames"/state/f"{facing:02d}.png"
            with Image.open(path) as src:
                assert src.size==(160,160),(path,src.size)
                assert src.mode=="RGBA",(path,src.mode)
                im=src.copy()
            bounds=im.getchannel("A").getbbox()
            assert bounds and bounds[0]>=2 and bounds[1]>=2 and bounds[2]<=158 and bounds[3]<=158,(state,facing,"clipped",bounds)
            images[state][facing]=im
            sheet.paste(im,(160*facing,160*row))
    sheet.save(stage/"federation-recovery-carrier-32-facing-preview.png",optimize=True)
    for facing in range(32):
        small={state:images[state][facing].resize((80,80),Image.Resampling.LANCZOS)
               for state in STATES}
        baseline=small["idle"]
        d={"move_rgba_80":difference(baseline,small["move"]),
           "attack_rgba_80":difference(baseline,small["attack"]),
           "destroyed_rgba_80":difference(baseline,small["destroyed"]),
           "destroyed_alpha_80":difference(baseline,small["destroyed"],True)}
        assert d["move_rgba_80"]>=12,(facing,d)
        assert d["attack_rgba_80"]>=20,(facing,d)
        assert d["destroyed_alpha_80"]>=25,(facing,d)
        report["directions"][f"{facing:02d}"]=d
    report["adjacent_rgba_80"]={}
    for facing in range(32):
        a=images["idle"][facing].resize((80,80),Image.Resampling.LANCZOS)
        b=images["idle"][(facing+1)%32].resize((80,80),Image.Resampling.LANCZOS)
        delta=difference(a,b)
        assert delta>=20,(facing,"duplicate facing",delta)
        report["adjacent_rgba_80"][f"{facing:02d}"]=delta
    for size in (160,80):
        contact=Image.new("RGBA",(size*8,size*4),(15,23,35,255))
        for row,state in enumerate(STATES):
            for col,facing in enumerate(range(0,32,4)):
                im=images[state][facing]
                if size==80:im=im.resize((80,80),Image.Resampling.LANCZOS)
                contact.alpha_composite(im,(col*size,row*size))
        contact.save(stage/f"federation-recovery-carrier-contact-{size}.png")
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS: 128 original 32-facing unclipped RGBA frames")
    print("MIN_80PX",{k:min(d[k] for d in report["directions"].values())
                     for k in ("move_rgba_80","attack_rgba_80","destroyed_alpha_80")})
if __name__=="__main__":main()
