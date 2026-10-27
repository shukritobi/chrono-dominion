#!/usr/bin/env python3
"""Actual RGBA QA for 128 preview-only four-phase Psionic magnetic attack frames."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageChops

PHASES=("charge","grip","discharge","release")
def changed(a,b,alpha=False):
    if alpha:a,b=a.getchannel("A"),b.getchannel("A")
    d=ImageChops.difference(a,b)
    return sum(bool(any(px) if isinstance(px,tuple) else px) for px in d.getdata())

def read(path):
    with Image.open(path) as im:
        assert im.size==(160,160) and im.mode=="RGBA",(path,im.size,im.mode)
        frame=im.copy()
    bbox=frame.getchannel("A").getbbox()
    assert bbox and bbox[0]>=2 and bbox[1]>=2 and bbox[2]<=158 and bbox[3]<=158,(
        "empty or clipped",path,bbox)
    return frame

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",required=True,type=Path)
    p.add_argument("--baseline",required=True,type=Path)
    args=p.parse_args()
    stage=args.stage;archive=args.baseline
    images={phase:{} for phase in PHASES}
    report={"asset":"PSI-VEH-005 temporal magnetic vortex","preview_only":True,
            "facings":32,"phases":list(PHASES),"frame_size":160,"per_facing":{}}
    atlas=Image.new("RGBA",(5120,640))
    for row,phase in enumerate(PHASES):
        for facing in range(32):
            frame=read(stage/"frames"/phase/(f"{facing:02d}.png"))
            images[phase][facing]=frame
            atlas.paste(frame,(160*facing,160*row))
    atlas.save(stage/"psionic-gravitic-temporal-attack-32-preview.png",optimize=True)
    for facing in range(32):
        idle=read(archive/"frames"/"idle"/(f"{facing:02d}.png"))
        original=read(archive/"frames"/"attack"/(f"{facing:02d}.png"))
        small={phase:images[phase][facing].resize((80,80),Image.Resampling.LANCZOS)
               for phase in PHASES}
        idle80=idle.resize((80,80),Image.Resampling.LANCZOS)
        attack80=original.resize((80,80),Image.Resampling.LANCZOS)
        transitions={f"{a}_to_{b}_rgba_80":changed(small[a],small[b])
                     for a,b in zip(PHASES,PHASES[1:])}
        row={**transitions,
             "peak_vs_original_attack_rgba_80":changed(small["discharge"],attack80),
             "peak_vs_idle_rgba_80":changed(small["discharge"],idle80),
             "peak_vs_idle_alpha_80":changed(small["discharge"],idle80,True),
             "release_vs_original_attack_rgba_80":changed(small["release"],attack80)}
        for name,value in transitions.items():
            assert value>=35,("temporal phases indistinguishable",facing,name,value)
        assert row["peak_vs_original_attack_rgba_80"]>=50,("peak not novel",facing,row)
        assert row["peak_vs_idle_rgba_80"]>=80,("peak not visible",facing,row)
        assert row["peak_vs_idle_alpha_80"]>=20,("peak silhouette unchanged",facing,row)
        report["per_facing"][f"{facing:02d}"]=row
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(14,24,34,255))
        for row,phase in enumerate(PHASES):
            for col,facing in enumerate(range(0,32,4)):
                frame=images[phase][facing]
                if size==80:frame=frame.resize((80,80),Image.Resampling.LANCZOS)
                sheet.alpha_composite(frame,(col*size,row*size))
        sheet.save(stage/f"psionic-gravitic-temporal-attack-contact-{size}.png")
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS: 128 unclipped new RGBA frames and 32 facing-specific temporal sequences")
    for name in next(iter(report["per_facing"].values())):
        values=[row[name] for row in report["per_facing"].values()]
        print(name,"MIN",min(values),"MAX",max(values),
              "MEAN",round(sum(values)/len(values),1))

if __name__=="__main__":main()
