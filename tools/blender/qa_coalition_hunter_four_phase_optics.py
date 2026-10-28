#!/usr/bin/env python3
"""Strict independent 160px/80px pixel QA for preview-only Hunter optics.

Physical silhouette deltas are tested separately from RGBA color changes;
all 32 directions and four distinct deployment beats must pass.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

BEATS = ("fold","spread","refract","glide")
FACINGS = 32
SIZE = 160
BASELINE_SHA = "9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d"
GATES = {
    "fold_spread_rgba_80": 55,
    "spread_refract_rgba_80": 55,
    "refract_glide_rgba_80": 55,
    "fold_spread_alpha_80": 20,
    "spread_refract_alpha_80": 15,
    "refract_glide_alpha_80": 15,
    "adjacent_glide_rgba_80": 25,
    "glide_vs_idle_rgba_80": 50,
}

def diff(a,b,alpha=False):
    if alpha:
        a,b = a.getchannel("A"),b.getchannel("A")
    return sum(bool(any(v) if isinstance(v,tuple) else v)
               for v in ImageChops.difference(a,b).getdata())

def read(path,errors):
    try:
        with Image.open(path) as src:
            if src.mode != "RGBA" or src.size != (SIZE,SIZE):
                errors.append("Bad mode or size %s %s %s" % (path,src.mode,src.size))
            frame=src.convert("RGBA").copy()
    except (OSError,FileNotFoundError) as e:
        errors.append("Missing PNG %s %s" % (path,e))
        return Image.new("RGBA",(SIZE,SIZE))
    box=frame.getchannel("A").getbbox()
    if not box or min(box[:2])<3 or max(box[2:])>157:
        errors.append("Empty or clipped %s %s" % (path,box))
    return frame

def half(frame):
    return frame.resize((80,80),Image.Resampling.LANCZOS)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    p.add_argument("--baseline",type=Path,required=True)
    args=p.parse_args()
    stage,baseline=args.stage,args.baseline
    errors=[]
    old_atlas=baseline/"coalition-camouflage-hunter-32-preview.png"
    source=stage/"coalition-hunter-four-phase-optics.blend"
    assert source.stat().st_size>100000,"Missing editable new Blender source"
    assert (baseline/"coalition-camouflage-hunter.blend").stat().st_size>100000
    before=hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    if before!=BASELINE_SHA:
        errors.append("Baseline atlas SHA mismatch "+before)
    frames={b:{} for b in BEATS}
    hashes={}
    atlas=Image.new("RGBA",(SIZE*FACINGS,SIZE*len(BEATS)))
    for row,beat in enumerate(BEATS):
        for facing in range(FACINGS):
            path=stage/"frames"/beat/("%02d.png"%facing)
            frame=read(path,errors)
            frames[beat][facing]=frame
            hashes["%s/%02d"%(beat,facing)]=hashlib.sha256(frame.tobytes()).hexdigest()
            atlas.paste(frame,(facing*SIZE,row*SIZE))
    if len(set(hashes.values()))!=128:
        errors.append("Not all 128 frames have distinct pixel contents")
    atlas_path=stage/"coalition-hunter-four-phase-optics-32-preview.png"
    atlas.save(atlas_path,optimize=True)
    report={
        "asset_register_id":"COA-VEH-005",
        "preview_only":True,
        "baseline_run":40648427473,
        "baseline_sha256_before":before,
        "source_bytes":source.stat().st_size,
        "beats":list(BEATS),
        "facings":FACINGS,
        "frame_count":128,
        "unique_pixel_hashes":len(set(hashes.values())),
        "acceptance":GATES,
        "per_facing":{},
    }
    for facing in range(FACINGS):
        poses={b:half(frames[b][facing]) for b in BEATS}
        idle=half(read(baseline/"frames"/"idle"/("%02d.png"%facing),errors))
        row={
            "fold_spread_rgba_80":diff(poses["fold"],poses["spread"]),
            "spread_refract_rgba_80":diff(poses["spread"],poses["refract"]),
            "refract_glide_rgba_80":diff(poses["refract"],poses["glide"]),
            "fold_spread_alpha_80":diff(poses["fold"],poses["spread"],True),
            "spread_refract_alpha_80":diff(poses["spread"],poses["refract"],True),
            "refract_glide_alpha_80":diff(poses["refract"],poses["glide"],True),
            "adjacent_glide_rgba_80":diff(poses["glide"],half(frames["glide"][(facing+1)%FACINGS])),
            "glide_vs_idle_rgba_80":diff(poses["glide"],idle),
            "glide_vs_idle_alpha_80":diff(poses["glide"],idle,True),
        }
        for key,minimum in GATES.items():
            if row[key]<minimum:
                errors.append("80px gate %s facing %02d: %d < %d"%(key,facing,row[key],minimum))
        report["per_facing"]["%02d"%facing]=row
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(20,25,34,255))
        for row,beat in enumerate(BEATS):
            for col,facing in enumerate(range(0,FACINGS,4)):
                image=frames[beat][facing]
                sheet.alpha_composite(image if size==160 else half(image),(col*size,row*size))
        sheet.save(stage/("coalition-hunter-optics-contact-%d.png"%size))
    animation=[]
    for beat in BEATS:
        canvas=Image.new("RGBA",(80,80),(20,25,34,255))
        canvas.alpha_composite(half(frames[beat][4]))
        animation.append(canvas.convert("RGB"))
    animation[0].save(stage/"coalition-hunter-optics-facing04-80px.gif",
                      save_all=True,append_images=animation[1:],
                      duration=[240,240,240,360],loop=0,optimize=False)
    after=hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    report["baseline_sha256_after"]=after
    report["new_atlas_sha256"]=hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    if before!=after:
        errors.append("Baseline atlas mutated during render")
    report["failures"]=errors
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    for key in next(iter(report["per_facing"].values())):
        values=[v[key] for v in report["per_facing"].values()]
        print(key,"MIN",min(values),"MAX",max(values),flush=True)
    if errors:
        raise AssertionError("%d Hunter optical deployment QA failures: %s"%
                             (len(errors),"; ".join(errors[:12])))
    print("PASS: 128 original 160px RGBA frames; 80px geometry gates; baseline immutable",flush=True)

if __name__=="__main__":
    main()
