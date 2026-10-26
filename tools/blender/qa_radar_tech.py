#!/usr/bin/env python3
"""Preview-only pixel inspection for six Blender radar / research buildings.

Consumes real headless-rendered PNGs and their saved .blend sources. No live
game atlas, art manifest or production source is modified by this script.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path("generated/radar-tech")
FACTIONS=("coalition","federation","psionic")
KINDS=("radar","tech")
SIZE=160
ORDER=("idle 0","idle 1","construct 0","construct 1","damaged 0")


def alpha_mask(img):
    return bytes(255 if a>=32 else 0 for a in img.getchannel("A").tobytes())


def changed(a,b):
    return sum(x!=y for x,y in zip(alpha_mask(a),alpha_mask(b)))


def sprite(atlas,index):
    return atlas.crop((0,index*SIZE,SIZE,(index+1)*SIZE))


def metrics(atlas):
    states=[sprite(atlas,i) for i in range(5)]
    reduced=[im.resize((80,80),Image.Resampling.LANCZOS) for im in states]
    return {
        "idle_alpha_change_160":changed(states[0],states[1]),
        "idle_rgba_distinct":states[0].tobytes()!=states[1].tobytes(),
        "construct_alpha_change_160":changed(states[0],states[2]),
        "construct_alpha_change_80":changed(reduced[0],reduced[2]),
        "damaged_alpha_change_160":changed(states[0],states[4]),
        "damaged_alpha_change_80":changed(reduced[0],reduced[4]),
        "opaque_idle_160":sum(a>=32 for a in states[0].getchannel("A").tobytes()),
    }


def make_sheet(items,scale,filename):
    width=3*(5*scale+22)+24
    height=2*(scale+65)+55
    canvas=Image.new("RGB",(width,height),(15,23,35))
    draw=ImageDraw.Draw(canvas)
    draw.text((15,13),f"CHRONO DOMINION / RADAR + TECHNOLOGY LABS / {scale}px / PREVIEW ONLY",
              fill=(120,223,242))
    for j,(faction,kind,atlas) in enumerate(items):
        col=j%3
        row=j//3
        x=12+col*(5*scale+22)
        y=47+row*(scale+65)
        draw.text((x,y),f"{faction.upper()} / {kind.upper()}",fill=(232,236,246))
        for i in range(5):
            frame=sprite(atlas,i).resize((scale,scale),Image.Resampling.LANCZOS)
            bg=Image.new("RGB",(scale,scale),(37,45,58))
            bg.paste(frame,(0,0),frame)
            canvas.paste(bg,(x+i*scale,y+16))
            draw.text((x+i*scale,y+scale+20),ORDER[i],fill=(185,204,220))
    canvas.save(ROOT/filename,optimize=True)


def main():
    ROOT.mkdir(parents=True,exist_ok=True)
    records=[]
    items=[]
    for kind in KINDS:
        for faction in FACTIONS:
            stage=ROOT/faction/kind
            atlas_path=stage/"packed"/f"{faction}-{kind}.png"
            source=stage/"sources"/f"{faction}-{kind}.blend"
            assert source.stat().st_size>1000,(faction,kind,"missing source")
            with Image.open(atlas_path) as im:
                atlas=im.convert("RGBA")
            assert atlas.mode=="RGBA" and atlas.size==(160,800),(faction,kind,atlas.size)
            frames=[sprite(atlas,i) for i in range(5)]
            assert all(im.getchannel("A").getbbox() for im in frames),(faction,kind,"blank")
            for i,frame in enumerate(frames):
                box=frame.getchannel("A").getbbox()
                assert box and box[0]>0 and box[1]>0 and box[2]<160 and box[3]<160,(
                    faction,kind,i,"clipped",box)
            m=metrics(atlas)
            assert m["idle_rgba_distinct"],(faction,kind,"identical idle")
            assert m["construct_alpha_change_160"]>=250,(faction,kind,"weak construction",m)
            assert m["construct_alpha_change_80"]>=60,(faction,kind,"construction unreadable at 80px",m)
            assert m["damaged_alpha_change_160"]>=25,(faction,kind,"weak damage",m)
            record={"faction":faction,"kind":kind,"source_bytes":source.stat().st_size,
                    **m}
            print(json.dumps(record,sort_keys=True),flush=True)
            records.append(record)
            items.append((faction,kind,atlas))
    make_sheet(items,160,"radar-tech-160px-contact.png")
    make_sheet(items,80,"radar-tech-80px-contact.png")
    (ROOT/"qa-report.json").write_text(json.dumps(records,indent=2)+"\n")
    assert len(records)==6
    print("PASS: 6 Blender radar/tech preview atlases, source files and 80/160px contact sheets")


if __name__=="__main__":
    main()
