#!/usr/bin/env python3
"""Quantitative preview-only QA for the Federation MK-III translating test clamp.

Requires the actual Blender-rendered atlas and saved editable .blend.
Never reads/writes live production art.
"""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT=Path("generated/federation-tech-clamp")
STAGE=ROOT/"federation"/"tech"
ATLAS=STAGE/"packed"/"federation-tech.png"
SOURCE=STAGE/"sources"/"federation-tech.blend"

def frame(im,n):
    return im.crop((0,160*n,160,160*(n+1)))

def alpha_delta(a,b):
    aa=a.getchannel("A").point(lambda x: 255 if x>=32 else 0)
    bb=b.getchannel("A").point(lambda x: 255 if x>=32 else 0)
    return sum(x!=y for x,y in zip(aa.tobytes(),bb.tobytes()))

def checker(im):
    bg=Image.new("RGB",im.size,(39,47,62))
    bg.paste(im,(0,0),im)
    return bg

def main():
    assert SOURCE.is_file() and SOURCE.stat().st_size>1000,"Missing editable Blender source"
    with Image.open(ATLAS) as original:
        assert original.mode=="RGBA" and original.size==(160,800),(original.mode,original.size)
        im=original.copy()
    frames=[frame(im,i) for i in range(5)]
    for i,f in enumerate(frames):
        bbox=f.getchannel("A").getbbox()
        assert bbox and 0<bbox[0]<bbox[2]<160 and 0<bbox[1]<bbox[3]<160,(i,bbox)
    half=[f.resize((80,80),Image.Resampling.LANCZOS) for f in frames]
    data={
        "faction":"federation","kind":"tech",
        "atlas_rgba_size":[160,800],
        "editable_blend_bytes":SOURCE.stat().st_size,
        "idle_alpha_delta_160":alpha_delta(frames[0],frames[1]),
        "idle_alpha_delta_80":alpha_delta(half[0],half[1]),
        "idle_rgba_distinct":frames[0].tobytes()!=frames[1].tobytes(),
        "construction_alpha_delta_80":alpha_delta(half[0],half[2]),
        "damage_alpha_delta_80":alpha_delta(half[0],half[4]),
    }
    # Earlier Federation Tech idle frames had 0 changed alpha pixels at 160px.
    # Test the outer silhouette at the actual 80px gameplay presentation size.
    assert data["idle_rgba_distinct"]
    assert data["idle_alpha_delta_160"]>=100,("Clamp invisible at 160px",data)
    assert data["idle_alpha_delta_80"]>=20,("Clamp invisible at 80px",data)
    assert data["construction_alpha_delta_80"]>=60,("Construction regression",data)
    assert data["damage_alpha_delta_80"]>=40,("Damage regression",data)
    ROOT.mkdir(parents=True,exist_ok=True)
    for scale,images in ((160,frames),(80,half)):
        gap=15
        title=62
        w=scale*5+gap*6
        canvas=Image.new("RGB",(w,title+scale+38),(18,27,40))
        draw=ImageDraw.Draw(canvas)
        draw.text((14,12),"CHRONO DOMINION / FEDERATION SIEGE LAB MK-III",fill=(240,220,189))
        draw.text((14,33),f"{scale}px original Blender frames | preview only",fill=(130,203,230))
        for i,source in enumerate(images):
            x=gap+i*(scale+gap)
            canvas.paste(checker(source),(x,title))
            draw.text((x,title+scale+6),["idle 0","idle 1","build 0","build 1","damaged"][i],fill=(229,235,241))
        canvas.save(ROOT/f"federation-tech-clamp-{scale}px.png",optimize=True)
    diff=ImageChops.difference(half[0].getchannel("A"),half[1].getchannel("A"))
    diff.save(ROOT/"federation-tech-idle-alpha-diff-80px.png")
    (ROOT/"qa-report.json").write_text(json.dumps(data,indent=2)+"\n",encoding="utf8")
    print(json.dumps(data,sort_keys=True),flush=True)
    print("PASS: Federation Tech physically distinct idle silhouettes at 80px and 160px")

if __name__=="__main__":
    main()
