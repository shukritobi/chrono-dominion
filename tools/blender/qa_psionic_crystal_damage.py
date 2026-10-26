#!/usr/bin/env python3
"""Quantitative 160px/80px review of three Psionic damaged crystal poses.

Preview-only: never edits approved game textures or their manifests.
Compare against the final 2026-10-27 nine-building damage baseline.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT=Path("generated/psionic-crystal-damage-qa")
KINDS=("hq","refinery","barracks")
STATES=("idle-0","idle-1","construct-0","construct-1","damaged")
BASELINE_80={"hq":134,"refinery":69,"barracks":54}
# Require substantial additional damaged-silhouette change, not just a
# different emission value in otherwise identical intact architecture.
MIN_GAIN_80={"hq":40,"refinery":40,"barracks":40}


def frame(atlas,index):
    return atlas.crop((0,index*160,160,(index+1)*160))


def mask(im):
    return tuple(v>=32 for v in im.getchannel("A").tobytes())


def delta(a,b):
    return sum(x!=y for x,y in zip(mask(a),mask(b)))


def diff_view(a,b):
    aa,bb=mask(a),mask(b)
    pixels=[]
    for x,y in zip(aa,bb):
        if x and not y:pixels.append((245,88,90,255))
        elif y and not x:pixels.append((79,220,255,255))
        elif x:pixels.append((50,54,71,255))
        else:pixels.append((22,24,34,255))
    out=Image.new("RGBA",a.size)
    out.putdata(pixels)
    return out


def contact_sheet(entries,size):
    tile=320
    pad=34
    sheet=Image.new("RGB",(3*tile,3*(tile+pad)+20),(22,24,34))
    draw=ImageDraw.Draw(sheet)
    for row,(kind,images) in enumerate(entries):
        frames=[images[0],images[4],diff_view(images[0],images[4])]
        for col,im in enumerate(frames):
            if size==80:im=im.resize((80,80),Image.Resampling.LANCZOS)
            im=im.resize((300,300),Image.Resampling.NEAREST)
            sheet.paste(im,(col*tile+10,row*(tile+pad)+pad),im if im.mode=="RGBA" else None)
            draw.text((col*tile+10,row*(tile+pad)+8),
                      f"{kind} / {('idle','damaged','alpha difference')[col]} / {size}px",
                      fill="white")
    return sheet


def main():
    measurements={}
    entries=[]
    for kind in KINDS:
        stage=ROOT/"psionic"/kind
        source=stage/"sources"/f"psionic-{kind}.blend"
        atlas=stage/"packed"/f"psionic-{kind}.png"
        assert source.stat().st_size>1000,(kind,"no saved Blender source")
        with Image.open(atlas) as im:
            im.load()
            assert im.mode=="RGBA" and im.size==(160,800),(kind,"invalid RGBA atlas")
            images=[frame(im,i) for i in range(5)]
        assert all(im.getchannel("A").getbbox() for im in images),(kind,"blank state")
        for i,im in enumerate(images):
            box=im.getchannel("A").getbbox()
            assert box[0]>0 and box[1]>0 and box[2]<160 and box[3]<160,(kind,i,box)
        small=[im.resize((80,80),Image.Resampling.LANCZOS) for im in images]
        change80=delta(small[0],small[4])
        gain=change80-BASELINE_80[kind]
        measure={
            "faction":"psionic","kind":kind,
            "source_bytes":source.stat().st_size,
            "atlas_dimensions":[160,800],
            "damaged_alpha_delta_160":delta(images[0],images[4]),
            "damaged_alpha_delta_80":change80,
            "prior_damaged_alpha_delta_80":BASELINE_80[kind],
            "damage_improvement_80":gain,
            "construction_early_delta_160":delta(images[0],images[2]),
            "construction_late_delta_160":delta(images[0],images[3]),
            "idle_alpha_delta_160":delta(images[0],images[1]),
            "idle_rgba_distinct":images[0].tobytes()!=images[1].tobytes(),
        }
        measurements[kind]=measure
        assert measure["idle_rgba_distinct"],(kind,"static idle")
        assert measure["construction_early_delta_160"]>100,(kind,"missing scaffold")
        assert gain>=MIN_GAIN_80[kind],(kind,"insufficient damage silhouette gain",measure)
        print(json.dumps(measure,sort_keys=True),flush=True)
        entries.append((kind,images))
    ROOT.mkdir(parents=True,exist_ok=True)
    for size in (160,80):
        contact_sheet(entries,size).save(ROOT/f"psionic-crystal-damage-contact-{size}.png")
    (ROOT/"psionic-crystal-damage-qa.json").write_text(
        json.dumps(measurements,indent=2,sort_keys=True)+"\\n")
    print("PASS: all three Psionic damaged poses visibly differ at 80px",flush=True)


if __name__=="__main__":
    main()
