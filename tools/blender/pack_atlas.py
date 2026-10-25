#!/usr/bin/env python3
"""Pack exported transparent Blender frames into browser-ready tank atlases.

Requires Pillow: python -m pip install Pillow
Usage:
 python tools/blender/pack_atlas.py --input generated/vehicle-frames --output art/rendered

Copies no third-party imagery. Expected exports are faction/{hull,turret}_00.png ...
"""
import argparse
import json
import math
from pathlib import Path
from PIL import Image

FACTIONS=("coalition","federation","psionic")
PARTS=("hull","turret")

def pack(input_dir:Path, output_dir:Path, directions=32, columns=8, size=128):
    if not directions or directions%columns: raise ValueError("Directions must be divisible by columns")
    output_dir.mkdir(parents=True,exist_ok=True)
    rows=math.ceil(directions/columns)
    atlases={}
    for faction in FACTIONS:
        pairs={}
        for part in PARTS:
            files=[input_dir/faction/f"{part}_{i:02d}.png" for i in range(directions)]
            if not all(path.is_file() for path in files):
                print(f"SKIP {faction}/{part}: incomplete source frames")
                continue
            sheet=Image.new("RGBA",(size*columns,size*rows),(0,0,0,0))
            for index,path in enumerate(files):
                with Image.open(path) as image:
                    frame=image.convert("RGBA")
                    if frame.size!=(size,size):
                        raise ValueError(f"{path} has {frame.size}, expected {(size,size)}")
                    sheet.paste(frame,((index%columns)*size,(index//columns)*size))
            filename=f"{faction}-{part}.png"
            sheet.save(output_dir/filename,optimize=True)
            pairs[part]=filename
        if len(pairs)==2: atlases[faction]=pairs
    manifest={"format":"png-atlas-v1","directions":directions,"frameSize":size,
              "columns":columns,"rows":rows,"atlases":atlases,
              "status":"generated-original-art"}
    (output_dir/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    return manifest

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--input",type=Path,default=Path("generated/vehicle-frames"))
    ap.add_argument("--output",type=Path,default=Path("art/rendered"))
    ap.add_argument("--directions",type=int,default=32)
    ap.add_argument("--columns",type=int,default=8)
    ap.add_argument("--size",type=int,default=128)
    args=ap.parse_args()
    manifest=pack(args.input,args.output,args.directions,args.columns,args.size)
    print("Packed atlases:",list(manifest["atlases"]))

if __name__=="__main__":
    main()
