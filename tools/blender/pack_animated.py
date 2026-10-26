#!/usr/bin/env python3
"""Pack Chrono Dominion original Blender renders into transparent PNG atlases.

Sheet layout:
- unit kinds: eight facing columns; rows in order idle (1), move (2), attack (1).
- structures: one column; idle (2), construct (2), damaged (1).
- per-faction / per-kind atlases validated before manifest publication.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageStat

FACTIONS=("coalition","federation","psionic")
UNITS=("soldier","specialist","tank","heavy","recon","harvester","aircraft")
BUILDINGS=("hq","generator","refinery","barracks","factory","radar","tech","turret","beam","airfield")
STATES={"unit":{"idle":1,"move":2,"attack":1},
        "building":{"idle":2,"construct":2,"damaged":1}}

def pack(source:Path,output:Path,size=160,allow_partial=False):
    output.mkdir(parents=True,exist_ok=True)
    entries={}
    for faction in FACTIONS:
        entries[faction]={}
        for kind in UNITS+BUILDINGS:
            states=STATES["unit" if kind in UNITS else "building"]
            directions=8 if kind in UNITS else 1
            files=[(state,d,f,source/"frames"/faction/kind/state/f"{d:02d}_{f:02d}.png")
                   for state,count in states.items()
                   for d in range(directions) for f in range(count)]
            if not any(path.exists() for _,_,_,path in files):continue
            missing=[str(path) for _,_,_,path in files if not path.is_file()]
            if missing:
                if allow_partial:continue
                raise FileNotFoundError("Incomplete render for "+faction+"/"+kind+": "+missing[0])
            sheet=Image.new("RGBA",(size*directions,size*sum(states.values())))
            base=0
            for state,count in states.items():
                for d in range(directions):
                    for frame in range(count):
                        path=source/"frames"/faction/kind/state/f"{d:02d}_{frame:02d}.png"
                        with Image.open(path) as img:
                            if img.size!=(size,size):raise ValueError(f"{path} has wrong size {img.size}")
                            layer=img.convert("RGBA")
                            if not layer.getbbox():raise ValueError("Transparent empty sprite: "+str(path))
                            sheet.paste(layer,(d*size,(base+frame)*size))
                base+=count
            filename=f"{faction}-{kind}.png"
            sheet.save(output/filename,optimize=True)
            entries[faction][kind]={
                "file":filename,"directions":directions,"states":states,
                "pivot":[size//2,round(size*.88)],
                "canvasSize":[size*directions,size*sum(states.values())]
            }
    if not any(entries.values()):raise RuntimeError("No models were rendered")
    manifest={"format":"chrono-blender-v1","renderer":"Blender procedural PBR",
              "frameSize":size,"atlasRoot":"art/baked-v1","entries":entries,
              "source":"original editable Blender models","fallback":"procedural-live-art"}
    (output/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print("Packed",sum(map(len,entries.values())),"faction models with animation",flush=True)
    return manifest

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--input",type=Path,default=Path("generated/chrono-hd"))
    p.add_argument("--output",type=Path,default=Path("art/baked-v1"))
    p.add_argument("--size",type=int,default=160)
    p.add_argument("--allow-partial",action="store_true")
    args=p.parse_args()
    pack(args.input,args.output,args.size,args.allow_partial)
