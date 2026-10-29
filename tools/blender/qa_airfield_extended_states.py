#!/usr/bin/env python3
"""Strict preview-only 160/80px inspection of three original airfield wrecks."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

FACTIONS=("coalition","federation","psionic")
STATES=("critical","destroyed","power_out")

def changed_alpha(a,b):
    return sum((x>=32)!=(y>=32) for x,y in
               zip(a.getchannel("A").tobytes(),b.getchannel("A").tobytes()))

def changed_rgba(a,b):
    return sum(x!=y for x,y in zip(a.getdata(),b.getdata()))

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    args=p.parse_args()
    report={"asset":"three original faction airfields","preview_only":True,
            "thresholds_80":{"critical_alpha_min":35,
                              "destroyed_alpha_min":85,
                              "power_out_alpha_max":12,
                              "power_out_rgba_min":120},
            "factions":{}}
    for faction in FACTIONS:
        atlas=args.stage/"packed"/(faction+"-airfield.png")
        extra=args.stage/"extra"/faction
        source=extra/(faction+"-airfield-extended-states.blend")
        assert source.stat().st_size>1000
        sha=hashlib.sha256(atlas.read_bytes()).hexdigest()
        with Image.open(atlas) as im:
            im.load()
            assert im.mode=="RGBA" and im.size==(160,800),(faction,"atlas",im.size,im.mode)
            intact=im.crop((0,0,160,160)).copy()
        frames={"intact":intact}
        for state in STATES:
            with Image.open(extra/(state+".png")) as im:
                im.load()
                assert im.mode=="RGBA" and im.size==(160,160),(faction,state,im.size,im.mode)
                frames[state]=im.copy()
        metrics={}
        for state in STATES:
            im=frames[state]
            bounds=im.getchannel("A").getbbox()
            assert bounds and all((bounds[0]>0,bounds[1]>0,bounds[2]<160,bounds[3]<160)),(faction,state,bounds)
            metrics[state]={"bbox_160":bounds}
            for size in (160,80):
                before=intact.resize((size,size),Image.Resampling.LANCZOS)
                after=im.resize((size,size),Image.Resampling.LANCZOS)
                metrics[state]["alpha_"+str(size)]=changed_alpha(before,after)
                metrics[state]["rgba_"+str(size)]=changed_rgba(before,after)
        assert metrics["critical"]["alpha_80"]>=35,(faction,"critical too subtle",metrics)
        assert metrics["destroyed"]["alpha_80"]>=85,(faction,"destroyed too subtle",metrics)
        assert metrics["power_out"]["alpha_80"]<=12,(faction,"power out changed geometry",metrics)
        assert metrics["power_out"]["rgba_80"]>=120,(faction,"power out not readable",metrics)
        # Critical and destroyed must not be the same pose.
        assert changed_rgba(frames["critical"].resize((80,80),Image.Resampling.LANCZOS),
                            frames["destroyed"].resize((80,80),Image.Resampling.LANCZOS))>=150
        assert hashlib.sha256(atlas.read_bytes()).hexdigest()==sha
        report["factions"][faction]={
            "original_atlas_sha256":sha,
            "source_bytes":source.stat().st_size,
            "states":metrics}
        for size in (160,80):
            board=Image.new("RGB",(4*(size+14)+22,size+77),(18,25,38))
            draw=ImageDraw.Draw(board)
            draw.text((12,8),f"{faction.upper()} AIRFIELD / {size}px / PREVIEW ONLY",
                      fill=(126,227,240))
            for i,(state,frame) in enumerate(frames.items()):
                fg=frame.resize((size,size),Image.Resampling.LANCZOS)
                bg=Image.new("RGBA",(size,size),(40,49,63,255))
                bg.alpha_composite(fg)
                x=12+i*(size+14)
                board.paste(bg.convert("RGB"),(x,32))
                draw.text((x,size+36),state,fill=(234,239,247))
            board.save(extra/("contact-"+str(size)+".png"),optimize=True)
    path=args.stage/"airfield-extra-qa.json"
    path.write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2),flush=True)
    print("PASS: 3 editable airfields, 9 separate extra-state PNGs, no atlas edits")

if __name__=="__main__":
    main()
