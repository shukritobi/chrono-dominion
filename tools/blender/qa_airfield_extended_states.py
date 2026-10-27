#!/usr/bin/env python3
"""Strict visual QA of original Blender airfield extra-state PNGs at 160/80px."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

FACTIONS=("coalition","federation","psionic")
STATES=("critical","destroyed","power_out")

def alpha_diff(a,b):
    return sum((x>=32)!=(y>=32) for x,y in zip(a.getchannel("A").tobytes(),b.getchannel("A").tobytes()))

def rgba_diff(a,b):
    return sum(x!=y for x,y in zip(a.getdata(),b.getdata()))

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    args=p.parse_args()
    report={"asset":"three faction airfields","preview_only":True,"states_separate":True,"factions":{}}
    for faction in FACTIONS:
        atlas=args.stage/"packed"/(faction+"-airfield.png")
        extra=args.stage/"extra"/faction
        source=extra/(faction+"-airfield-extended-states.blend")
        assert source.stat().st_size>1000,(faction,"missing editable source")
        digest=hashlib.sha256(atlas.read_bytes()).hexdigest()
        with Image.open(atlas) as im:
            assert im.mode=="RGBA" and im.size==(160,800),(faction,im.size,im.mode)
            intact=im.crop((0,0,160,160)).copy()
        frames={"intact":intact}
        for state in STATES:
            with Image.open(extra/(state+".png")) as im:
                assert im.mode=="RGBA" and im.size==(160,160),(faction,state,im.size,im.mode)
                frame=im.copy()
                bbox=frame.getchannel("A").getbbox()
                assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<160 and bbox[3]<160,(faction,state,bbox)
                frames[state]=frame
        metrics={}
        for state in STATES:
            metrics[state]={}
            for size in (160,80):
                before=intact.resize((size,size),Image.Resampling.LANCZOS)
                after=frames[state].resize((size,size),Image.Resampling.LANCZOS)
                metrics[state]["alpha_"+str(size)]=alpha_diff(before,after)
                metrics[state]["rgba_"+str(size)]=rgba_diff(before,after)
        assert metrics["critical"]["alpha_80"]>=45,(faction,"critical",metrics)
        assert metrics["destroyed"]["alpha_80"]>=90,(faction,"destroyed",metrics)
        assert metrics["power_out"]["alpha_80"]<30,(faction,"power_out silhouette",metrics)
        assert metrics["power_out"]["rgba_80"]>=100,(faction,"power_out visible",metrics)
        assert hashlib.sha256(atlas.read_bytes()).hexdigest()==digest
        report["factions"][faction]={"atlas_sha256_unchanged":digest,"states":metrics}
        for size in (160,80):
            w=4*(size+12)+16
            board=Image.new("RGB",(w,size+68),(18,25,38))
            draw=ImageDraw.Draw(board)
            draw.text((12,8),f"{faction.upper()} AIRFIELD | PREVIEW ONLY | {size}px",fill=(137,231,241))
            for i,(name,img) in enumerate(frames.items()):
                bg=Image.new("RGBA",(size,size),(40,49,63,255))
                bg.alpha_composite(img.resize((size,size),Image.Resampling.LANCZOS))
                x=12+i*(size+12)
                board.paste(bg.convert("RGB"),(x,29))
                draw.text((x,size+33),name,fill=(235,239,248))
            board.save(extra/("contact-"+str(size)+".png"))
    (args.stage/"airfield-extra-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2),flush=True)
    print("PASS: all 3 airfields have editable extra-state sources and 80/160px visual QA")

if __name__=="__main__":
    main()
