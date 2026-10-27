#!/usr/bin/env python3
"""Strict 160px/80px alpha and RGB checks for three defense turret pilots."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

def changed_alpha(a,b):
    return sum((x>=32)!=(y>=32) for x,y in zip(a.getchannel("A").tobytes(),b.getchannel("A").tobytes()))

def changed_rgba(a,b):
    return sum(x!=y for x,y in zip(a.getdata(),b.getdata()))

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    args=p.parse_args()
    report={"pilot":"three faction defense turrets","preview_only":True,"factions":{}}
    for faction in ("coalition","federation","psionic"):
        atlas=args.stage/"packed"/(faction+"-turret.png")
        extra=args.stage/"extra"/faction
        source=extra/(faction+"-turret-extended-states.blend")
        assert source.stat().st_size>1000
        checksum=hashlib.sha256(atlas.read_bytes()).hexdigest()
        with Image.open(atlas) as image:
            assert image.mode=="RGBA" and image.size==(160,800)
            original=image.crop((0,0,160,160)).copy()
        frames={"intact":original}
        for state in ("critical","destroyed","power_out"):
            with Image.open(extra/(state+".png")) as image:
                assert image.mode=="RGBA" and image.size==(160,160)
                frames[state]=image.copy()
                box=image.getchannel("A").getbbox()
                assert box and box[0]>0 and box[1]>0 and box[2]<160 and box[3]<160,(faction,state,box)
        metrics={}
        for state in ("critical","destroyed","power_out"):
            metrics[state]={}
            for size in (160,80):
                before=original.resize((size,size),Image.Resampling.LANCZOS)
                after=frames[state].resize((size,size),Image.Resampling.LANCZOS)
                metrics[state]["alpha_"+str(size)]=changed_alpha(before,after)
                metrics[state]["rgba_"+str(size)]=changed_rgba(before,after)
        assert metrics["critical"]["alpha_80"]>=25,(faction,metrics)
        assert metrics["destroyed"]["alpha_80"]>=65,(faction,metrics)
        assert metrics["power_out"]["alpha_80"]<30,(faction,metrics)
        assert metrics["power_out"]["rgba_80"]>=100,(faction,metrics)
        assert hashlib.sha256(atlas.read_bytes()).hexdigest()==checksum
        report["factions"][faction]={"atlas_sha256_unchanged":checksum,"states":metrics}
        for size in (160,80):
            board=Image.new("RGB",(4*(size+12)+16,size+69),(18,25,38))
            draw=ImageDraw.Draw(board)
            draw.text((12,8),f"{faction.upper()} TURRET | EXTRA STATES | {size}px | PREVIEW ONLY",fill=(137,231,241))
            for i,(name,img) in enumerate(frames.items()):
                resized=img.resize((size,size),Image.Resampling.LANCZOS)
                bg=Image.new("RGBA",(size,size),(40,49,63,255))
                bg.alpha_composite(resized)
                x=12+i*(size+12)
                board.paste(bg.convert("RGB"),(x,29))
                draw.text((x,size+33),name,fill=(235,239,248))
            board.save(extra/("contact-"+str(size)+".png"))
    (args.stage/"defense-extra-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2),flush=True)
    print("PASS: 3 editable faction defense sources and 9 separate preview states")

if __name__=="__main__":
    main()
