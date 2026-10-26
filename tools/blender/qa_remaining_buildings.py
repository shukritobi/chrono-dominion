#!/usr/bin/env python3
"""Compare real staged-construction and damage sprites for 9 faction buildings.

For QA only. No production sprites or art manifests are written.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path("generated/remaining-building-qa")
FACTIONS=("coalition","federation","psionic")
KINDS=("hq","refinery","barracks")
STATES=("idle-0","idle-1","construct-0","construct-1","damaged")


def mask(image):
    return tuple(x>=32 for x in image.getchannel("A").tobytes())


def delta(a,b):
    return sum(x!=y for x,y in zip(mask(a),mask(b)))


def frame(sheet,index):
    return sheet.crop((0,index*160,160,(index+1)*160))


def check(faction,kind):
    stage=ROOT/faction/kind
    source=stage/"sources"/f"{faction}-{kind}.blend"
    atlas=stage/"packed"/f"{faction}-{kind}.png"
    assert source.stat().st_size>1000,(faction,kind,"no editable source")
    with Image.open(atlas) as image:
        image.load()
        assert image.mode=="RGBA" and image.size==(160,800),(faction,kind,"bad atlas")
        frames=[frame(image,i) for i in range(5)]
    assert all(x.getchannel("A").getbbox() for x in frames),(faction,kind,"blank frame")
    for index,x in enumerate(frames):
        b=x.getchannel("A").getbbox()
        assert b[0]>0 and b[1]>0 and b[2]<160 and b[3]<160,(faction,kind,index,b)
    small=[x.resize((80,80),Image.Resampling.LANCZOS) for x in frames]
    m={
        "faction":faction,"kind":kind,
        "source_bytes":source.stat().st_size,
        "construction_early_160":delta(frames[0],frames[2]),
        "construction_late_160":delta(frames[0],frames[3]),
        "damaged_160":delta(frames[0],frames[4]),
        "damaged_80":delta(small[0],small[4]),
        "idle_alpha_160":delta(frames[0],frames[1]),
        "idle_rgb_distinct":frames[0].tobytes()!=frames[1].tobytes(),
    }
    assert m["idle_rgb_distinct"],(faction,kind,"static idle")
    assert m["construction_early_160"]>100,(faction,kind,"missing scaffold")
    assert m["damaged_160"]>0,(faction,kind,"no damage")
    m["warning"]=(
        "damage subtle at 80px" if m["damaged_80"]<50 else
        "construction too similar" if m["construction_early_160"]<400 else None
    )
    print(json.dumps(m,sort_keys=True),flush=True)
    return m,frames


def sheet(items,scale):
    w=3*(5*scale+18)+20
    h=3*(scale+55)+50
    image=Image.new("RGB",(w,h),(16,25,36))
    draw=ImageDraw.Draw(image)
    draw.text((12,14),f"CHRONO DOMINION / HQ REFINERY BARRACKS / {scale}px / PREVIEW ONLY",
              fill=(117,220,240))
    for index,(m,frames) in enumerate(items):
        x=10+(index%3)*(5*scale+18)
        y=45+(index//3)*(scale+55)
        draw.text((x,y),f"{m['faction'].upper()} / {m['kind'].upper()}",fill=(230,235,242))
        for j,frame in enumerate(frames):
            fg=frame.resize((scale,scale),Image.Resampling.LANCZOS)
            bg=Image.new("RGB",(scale,scale),(39,46,60))
            bg.paste(fg,(0,0),fg)
            image.paste(bg,(x+j*scale,y+16))
            draw.text((x+j*scale,y+scale+19),STATES[j],fill=(181,199,217))
    image.save(ROOT/f"remaining-buildings-{scale}px.png",optimize=True)


def main():
    ROOT.mkdir(parents=True,exist_ok=True)
    results=[check(faction,kind) for kind in KINDS for faction in FACTIONS]
    for size in (160,80):
        sheet(results,size)
    (ROOT/"qa-report.json").write_text(
        json.dumps([m for m,_ in results],indent=2)+"\n")
    print("PASS: nine five-state preview atlases, editable sources, contact sheets")
    print("NOTE: low 80px damage contrast is reported, not hidden by pass/fail.")


if __name__=="__main__":
    main()
