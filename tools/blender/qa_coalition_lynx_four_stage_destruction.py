#!/usr/bin/env python3
"""Actual 160/80px PNG QA for new four-stage Coalition Lynx destruction.

Checks all 128 frames, 32 directions, clipping, per-phase silhouette and
RGBA deltas; compares against the pinned validated Actions #40494276431
artifact without modifying its source or original atlas.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

PHASES=("impact","shear","rupture","settle")
FACINGS=32
SIZE=160

def changed(a,b,alpha=False):
    if alpha:a,b=a.getchannel("A"),b.getchannel("A")
    diff=ImageChops.difference(a,b)
    return sum(1 for px in diff.getdata()
               if (any(px) if isinstance(px,tuple) else bool(px)))

def read(path,issues):
    with Image.open(path) as im:
        if im.mode!="RGBA" or im.size!=(SIZE,SIZE):
            issues.append("Bad mode/size %s %s %s"%(path,im.mode,im.size))
        img=im.convert("RGBA").copy()
    bounds=img.getchannel("A").getbbox()
    if not bounds or bounds[0]<2 or bounds[1]<2 or bounds[2]>158 or bounds[3]>158:
        issues.append("Empty or clipped %s %s"%(path,bounds))
    return img

def small(img):
    return img.resize((80,80),Image.Resampling.LANCZOS)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",type=Path,required=True)
    parser.add_argument("--baseline",type=Path,required=True)
    args=parser.parse_args()
    stage,baseline=args.stage,args.baseline
    issues=[]
    original=baseline/"coalition-lynx-battle-tank-32-preview.png"
    before=hashlib.sha256(original.read_bytes()).hexdigest()
    frames={phase:{} for phase in PHASES}
    atlas=Image.new("RGBA",(SIZE*FACINGS,SIZE*len(PHASES)))
    for row,phase in enumerate(PHASES):
        for facing in range(FACINGS):
            frame=read(stage/"frames"/phase/("%02d.png"%facing),issues)
            frames[phase][facing]=frame
            atlas.paste(frame,(SIZE*facing,SIZE*row))
    atlas_path=stage/"coalition-lynx-four-stage-destruction-32-preview.png"
    atlas.save(atlas_path,optimize=True)
    gates={
        "impact_to_shear_rgba_80":60,
        "shear_to_rupture_rgba_80":60,
        "rupture_to_settle_rgba_80":60,
        "settle_vs_archived_destroyed_rgba_80":50,
        "impact_vs_archived_idle_rgba_80":50,
        "adjacent_impact_rgba_80":20,
        "rupture_vs_idle_alpha_80":40,
    }
    report={"asset_register_id":"COA-VEH-002","preview_only":True,
            "baseline_run":40494276431,
            "baseline_atlas_sha256_before":before,
            "facings":FACINGS,"phases":list(PHASES),
            "new_frame_count":FACINGS*len(PHASES),
            "acceptance":gates,"per_facing":{}}
    for facing in range(FACINGS):
        pose={p:small(frames[p][facing]) for p in PHASES}
        idle=small(read(baseline/"frames"/"idle"/("%02d.png"%facing),issues))
        destroyed=small(read(baseline/"frames"/"destroyed"/("%02d.png"%facing),issues))
        row={
            "impact_to_shear_rgba_80":changed(pose["impact"],pose["shear"]),
            "shear_to_rupture_rgba_80":changed(pose["shear"],pose["rupture"]),
            "rupture_to_settle_rgba_80":changed(pose["rupture"],pose["settle"]),
            "impact_to_shear_alpha_80":changed(pose["impact"],pose["shear"],True),
            "shear_to_rupture_alpha_80":changed(pose["shear"],pose["rupture"],True),
            "rupture_to_settle_alpha_80":changed(pose["rupture"],pose["settle"],True),
            "settle_vs_archived_destroyed_rgba_80":changed(pose["settle"],destroyed),
            "settle_vs_archived_destroyed_alpha_80":changed(pose["settle"],destroyed,True),
            "impact_vs_archived_idle_rgba_80":changed(pose["impact"],idle),
            "rupture_vs_idle_alpha_80":changed(pose["rupture"],idle,True),
            "adjacent_impact_rgba_80":changed(
                pose["impact"],small(frames["impact"][(facing+1)%FACINGS])),
        }
        for metric,minimum in gates.items():
            if row[metric]<minimum:
                issues.append("80px gate %s facing %02d: %d < %d"%
                              (metric,facing,row[metric],minimum))
        report["per_facing"]["%02d"%facing]=row
    for size in (160,80):
        sheet=Image.new("RGBA",(size*8,size*4),(16,22,34,255))
        for row,phase in enumerate(PHASES):
            for col,facing in enumerate(range(0,FACINGS,4)):
                frame=frames[phase][facing]
                if size==80:frame=small(frame)
                sheet.alpha_composite(frame,(col*size,row*size))
        sheet.save(stage/("coalition-lynx-destruction-contact-%d.png"%size))
    gifs=[]
    for phase in PHASES:
        canvas=Image.new("RGBA",(80,80),(16,22,34,255))
        canvas.alpha_composite(small(frames[phase][4]))
        gifs.append(canvas.convert("RGB"))
    gifs[0].save(stage/"coalition-lynx-destruction-facing04-80px.gif",
                 save_all=True,append_images=gifs[1:],
                 duration=[240,180,190,340],loop=0,optimize=False)
    report["new_atlas_sha256"]=hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    report["baseline_atlas_sha256_after"]=hashlib.sha256(original.read_bytes()).hexdigest()
    if report["baseline_atlas_sha256_after"]!=before:
        issues.append("Immutable baseline atlas changed")
    report["failures"]=issues
    (stage/"pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    for metric in next(iter(report["per_facing"].values())):
        vals=[row[metric] for row in report["per_facing"].values()]
        print(metric,"MIN",min(vals),"MAX",max(vals),
              "MEAN",round(sum(vals)/len(vals),1))
    if issues:
        raise AssertionError("%d actual PNG QA failures: %s"%
                             (len(issues),"; ".join(issues[:12])))
    print("PASS 128 NEW physical Lynx destruction sprites; baseline unchanged")

if __name__=="__main__":
    main()
