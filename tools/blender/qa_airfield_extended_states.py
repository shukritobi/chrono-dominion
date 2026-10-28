#!/usr/bin/env python3
"""Strict airfield preview QA: source baseline, 80px geometry and power-out."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image,ImageDraw

FACTIONS=("coalition","federation","psionic")
STATES=("critical","destroyed","power_out")
def changed_alpha(a,b):
    return sum((x>=32)!=(y>=32) for x,y in zip(a.getchannel("A").tobytes(),b.getchannel("A").tobytes()))
def changed_rgba(a,b):
    return sum(x!=y for x,y in zip(a.getdata(),b.getdata()))
def frame(path,size):
    with Image.open(path) as im:
        assert im.mode=="RGBA" and im.size==size,(path,im.mode,im.size)
        return im.copy()
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    a=p.parse_args()
    report={"asset":"three original faction airfields","preview_only":True,"factions":{}}
    for faction in FACTIONS:
        atlas=a.stage/"packed"/(faction+"-airfield.png")
        extra=a.stage/"extra"/faction
        src=extra/(faction+"-airfield-extended-states.blend")
        assert src.stat().st_size>1000,src
        before_hash=hashlib.sha256(atlas.read_bytes()).hexdigest()
        sheet=frame(atlas,(160,800))
        original=sheet.crop((0,0,160,160))
        baseline=frame(extra/"baseline.png",(160,160))
        baseline_diff=changed_rgba(original,baseline)
        assert baseline_diff==0,(faction,"source-to-atlas baseline drift",baseline_diff)
        frames={"intact":original}
        for state in STATES:
            im=frame(extra/(state+".png"),(160,160))
            box=im.getchannel("A").getbbox()
            assert box and min(box[:2])>0 and max(box[2:])<160,(faction,state,box)
            frames[state]=im
        metrics={}
        for state in STATES:
            metrics[state]={}
            for size in (160,80):
                before=original.resize((size,size),Image.Resampling.LANCZOS)
                after=frames[state].resize((size,size),Image.Resampling.LANCZOS)
                metrics[state]["alpha_"+str(size)]=changed_alpha(before,after)
                metrics[state]["rgba_"+str(size)]=changed_rgba(before,after)
        # These are geometric silhouette gates, not RGB-only glow changes.
        assert metrics["critical"]["alpha_80"]>=35,(faction,"critical silhouette",metrics)
        assert metrics["destroyed"]["alpha_80"]>=90,(faction,"destroyed silhouette",metrics)
        assert metrics["power_out"]["alpha_80"]==0,(faction,"power-out changed silhouette",metrics)
        assert metrics["power_out"]["rgba_80"]>=200,(faction,"power-out still glowing",metrics)
        assert hashlib.sha256(atlas.read_bytes()).hexdigest()==before_hash
        report["factions"][faction]={"atlas_sha256_unchanged":before_hash,
            "source_baseline_rgba_diff_160":baseline_diff,"states":metrics}
        for size in (160,80):
            board=Image.new("RGB",(4*(size+12)+16,size+70),(18,25,38))
            draw=ImageDraw.Draw(board)
            draw.text((12,8),f"{faction.upper()} AIRFIELD | EXTRA STATES | {size}px | PREVIEW ONLY",fill=(137,231,241))
            for i,(name,im) in enumerate(frames.items()):
                fg=im.resize((size,size),Image.Resampling.LANCZOS)
                bg=Image.new("RGBA",(size,size),(40,49,63,255))
                bg.alpha_composite(fg)
                x=12+i*(size+12)
                board.paste(bg.convert("RGB"),(x,29))
                draw.text((x,size+34),name,fill=(235,239,248))
            board.save(extra/("contact-"+str(size)+".png"))
    (a.stage/"airfield-extra-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2),flush=True)
    print("PASS: 3 editable faction airfield sources, 9 independent states, pixel-exact baseline")
if __name__=="__main__":
    main()
