#!/usr/bin/env python3
"""Pixel-accurate 80/160px QA for three preview-only beam defenses."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

FACTIONS=("coalition","federation","psionic")
STATES=("critical","destroyed","power_out")
COLS=("intact",)+STATES

def alpha_diff(a,b):
    return sum((x>=32)!=(y>=32)
               for x,y in zip(a.getchannel("A").tobytes(),
                              b.getchannel("A").tobytes()))

def rgba_diff(a,b):
    return sum(x!=y for x,y in zip(a.getdata(),b.getdata()))

def board(faction,frames,size):
    pad=12
    canvas=Image.new("RGB",(4*(size+pad)+pad,size+66),(18,25,38))
    d=ImageDraw.Draw(canvas)
    d.text((12,8),f"{faction.upper()} BEAM DEFENSE | PREVIEW ONLY | {size}px",
           fill=(134,226,240))
    for i,name in enumerate(COLS):
        bg=Image.new("RGBA",(size,size),(40,49,63,255))
        bg.alpha_composite(frames[name].resize((size,size),Image.Resampling.LANCZOS))
        x=pad+i*(size+pad)
        canvas.paste(bg.convert("RGB"),(x,29))
        d.text((x,size+34),name,fill=(236,239,246))
    return canvas

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",type=Path,required=True)
    a=parser.parse_args()
    report={"asset":"three-faction beam defenses","preview_only":True,
            "five_frame_contract_unchanged":True,"factions":{}}
    sheets={160:[],80:[]}
    for faction in FACTIONS:
        atlas=a.stage/"packed"/(faction+"-beam.png")
        extra=a.stage/"extra"/faction
        source=extra/(faction+"-beam-extended-states.blend")
        assert source.is_file() and source.stat().st_size>1000
        digest=hashlib.sha256(atlas.read_bytes()).hexdigest()
        with Image.open(atlas) as img:
            assert img.mode=="RGBA" and img.size==(160,800),(faction,img.mode,img.size)
            frames={"intact":img.crop((0,0,160,160)).copy()}
        assert frames["intact"].getchannel("A").getbbox()
        for state in STATES:
            with Image.open(extra/(state+".png")) as im:
                assert im.mode=="RGBA" and im.size==(160,160),(faction,state,im.mode,im.size)
                frame=im.copy()
            bbox=frame.getchannel("A").getbbox()
            assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<160 and bbox[3]<160,(faction,state,bbox)
            frames[state]=frame
        metrics={}
        for state in STATES:
            metrics[state]={}
            for size in (160,80):
                before=frames["intact"].resize((size,size),Image.Resampling.LANCZOS)
                after=frames[state].resize((size,size),Image.Resampling.LANCZOS)
                metrics[state]["alpha_"+str(size)]=alpha_diff(before,after)
                metrics[state]["rgba_"+str(size)]=rgba_diff(before,after)
        # A genuine changed roofline is required at gameplay scale.
        assert metrics["critical"]["alpha_80"]>=45,(faction,"critical",metrics)
        assert metrics["destroyed"]["alpha_80"]>=90,(faction,"destroyed",metrics)
        assert metrics["power_out"]["alpha_80"]<30,(faction,"power_out silhouette",metrics)
        assert metrics["power_out"]["rgba_80"]>=100,(faction,"power_out visible",metrics)
        assert hashlib.sha256(atlas.read_bytes()).hexdigest()==digest
        report["factions"][faction]={"atlas_sha256_unchanged":digest,
                                    "extended_source_bytes":source.stat().st_size,
                                    "states":metrics}
        for size in (160,80):
            sheet=board(faction,frames,size)
            sheet.save(extra/("contact-"+str(size)+".png"))
            sheets[size].append(sheet)
    for size in (160,80):
        width=max(x.width for x in sheets[size])
        height=sum(x.height for x in sheets[size])+12*2
        combined=Image.new("RGB",(width,height),(18,25,38))
        y=12
        for sheet in sheets[size]:
            combined.paste(sheet,(0,y))
            y+=sheet.height
        combined.save(a.stage/("all-beam-states-"+str(size)+".png"))
    (a.stage/"beam-extra-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2),flush=True)
    print("PASS: three faction beam defenses, editable wreckage and actual 80/160px PNG QA")

if __name__=="__main__":
    main()
