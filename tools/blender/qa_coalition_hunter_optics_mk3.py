#!/usr/bin/env python3
"""MK-III Hunter optical sail visibility and fixed-hull silhouette QA.

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
PREVIOUS_SHA = "7c2ccea7c1c0e0349c10b757755eb4fa0b4cbeb375c6a5d337d66d1125f3b9e6"
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
    p.add_argument("--previous",type=Path,required=True)
    args=p.parse_args()
    stage,baseline,previous=args.stage,args.baseline,args.previous
    errors=[]
    old_atlas=baseline/"coalition-camouflage-hunter-32-preview.png"
    source=stage/"coalition-hunter-optics-mk3.blend"
    assert source.stat().st_size>100000,"Missing editable new Blender source"
    assert (baseline/"coalition-camouflage-hunter.blend").stat().st_size>100000
    before=hashlib.sha256(old_atlas.read_bytes()).hexdigest()
    if before!=BASELINE_SHA:
        errors.append("Baseline atlas SHA mismatch "+before)
    old_optics_atlas=previous/"coalition-hunter-optics-mk2-32-preview.png"
    old_sha=hashlib.sha256(old_optics_atlas.read_bytes()).hexdigest()
    if old_sha!=PREVIOUS_SHA:
        errors.append("Previous optics atlas SHA mismatch "+old_sha)
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
    atlas_path=stage/"coalition-hunter-optics-mk3-32-preview.png"
    atlas.save(atlas_path,optimize=True)
    report={
        "asset_register_id":"COA-VEH-005",
        "preview_only":True,
        "baseline_run":40648427473,
        "previous_optics_run":40670200185,
        "previous_optics_sha256_before":old_sha,
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
    # Compare the original MK-I frames with newly authored MK-III geometry
    # at identical facings and phases. Color alone cannot pass this gate.
    comparisons={}
    for beat in BEATS:
        values=[]
        for facing in range(FACINGS):
            prior=half(read(previous/"frames"/beat/("%02d.png"%facing),errors))
            now=half(frames[beat][facing])
            values.append(diff(prior,now,alpha=True))
        comparisons[beat]={"min":min(values),"max":max(values),
                           "mean":round(sum(values)/len(values),2),
                           "facings_ge_12":sum(v>=12 for v in values),
                           "values":values}
        if comparisons[beat]["facings_ge_12"]<24:
            errors.append("MK-III geometry visibility %s: only %d/32 facings >=12 alpha pixels" %
                          (beat,comparisons[beat]["facings_ge_12"]))
        if comparisons[beat]["mean"]<18:
            errors.append("MK-III %s mean alpha change %.2f <18" %
                          (beat,comparisons[beat]["mean"]))
    report["mk2_vs_mk3_alpha_80"]=comparisons
    # Four fixed-hull frames keep chassis, turret, wheels and tracks
    # stationary. Binary silhouette changes isolate sail/hinge geometry.
    fixed={}
    for beat in BEATS:
        fixed[beat]=read(stage/"fixed_hull"/(beat+".png"),errors)
    fixed_values={}
    for a,b in zip(BEATS,BEATS[1:]):
        aa=half(fixed[a]).getchannel("A").point(lambda v:255 if v>=32 else 0)
        bb=half(fixed[b]).getchannel("A").point(lambda v:255 if v>=32 else 0)
        change=sum(v!=0 for v in ImageChops.difference(aa,bb).getdata())
        fixed_values[a+"_to_"+b]=change
        if change<25:
            errors.append("Fixed-hull binary silhouette %s->%s %d <25 pixels"%(a,b,change))
    report["fixed_hull_binary_silhouette_80"]=fixed_values
    prior_fixed = {}
    for beat in BEATS:
        old = half(read(previous/"fixed_hull"/(beat+".png"),errors)).getchannel("A").point(lambda v:255 if v>=32 else 0)
        new = half(fixed[beat]).getchannel("A").point(lambda v:255 if v>=32 else 0)
        delta = sum(v!=0 for v in ImageChops.difference(old,new).getdata())
        prior_fixed[beat]=delta
        if delta<10:
            errors.append("MK-III notch silhouette %s %d <10"%(beat,delta))
    report["mk2_vs_mk3_fixed_hull_binary_80"]=prior_fixed
    for size in (160,80):
        fixed_sheet=Image.new("RGBA",(size*4,size),(20,25,34,255))
        for col,beat in enumerate(BEATS):
            frame=fixed[beat]
            fixed_sheet.alpha_composite(frame if size==160 else half(frame),(col*size,0))
        fixed_sheet.save(stage/("coalition-hunter-optics-fixed-hull-%d.png"%size))
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(20,25,34,255))
        for row,beat in enumerate(BEATS):
            for col,facing in enumerate(range(0,FACINGS,4)):
                image=frames[beat][facing]
                sheet.alpha_composite(image if size==160 else half(image),(col*size,row*size))
        sheet.save(stage/("coalition-hunter-optics-contact-%d.png"%size))
    comparison = Image.new("RGBA",(80*4,80*2),(20,25,34,255))
    for i,beat in enumerate(BEATS):
        prior = read(previous/"frames"/beat/"04.png",errors)
        comparison.alpha_composite(half(prior),(i*80,0))
        comparison.alpha_composite(half(frames[beat][4]),(i*80,80))
    comparison.save(stage/"hunter-optics-mk2-vs-mk3-80.png")
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
    report["previous_optics_sha256_after"]=hashlib.sha256(old_optics_atlas.read_bytes()).hexdigest()
    report["new_atlas_sha256"]=hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    if before!=after:
        errors.append("Baseline atlas mutated during render")
    if old_sha!=report["previous_optics_sha256_after"]:
        errors.append("Previous optics atlas mutated during render")
    report["failures"]=errors
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    for key in next(iter(report["per_facing"].values())):
        values=[v[key] for v in report["per_facing"].values()]
        print(key,"MIN",min(values),"MAX",max(values),flush=True)
    print("FIXED-HULL BINARY SILHOUETTE",fixed_values,flush=True)
    print("MK-II VS MK-III FIXED HULL",prior_fixed,flush=True)
    print("MK-I VS MK-III",[(b,comparisons[b]["min"],comparisons[b]["mean"],comparisons[b]["facings_ge_12"]) for b in BEATS],flush=True)
    if errors:
        raise AssertionError("%d Hunter optical deployment QA failures: %s"%
                             (len(errors),"; ".join(errors[:12])))
    print("PASS: 128 MK-III RGBA frames, fixed-hull binary silhouette, prior art immutable",flush=True)

if __name__=="__main__":
    main()
