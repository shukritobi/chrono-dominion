#!/usr/bin/env python3
"""Targeted six-building Blender damage QA. No production artwork is modified.

Reads real headless Blender PNGs, creates both 160px and 80px inspection sheets,
checks saved .blend source presence, atlas states, and compares with the
previous MK-II damaged-silhouette baselines at the actual 80px game zoom.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path("generated/radar-tech-damage")
FACTIONS=("coalition","federation","psionic")
KINDS=("radar","tech")
SIZE=160
BASELINE_80={
    ("coalition","radar"):122,
    ("federation","radar"):181,
    ("psionic","radar"):146,
    ("coalition","tech"):120,
    ("federation","tech"):104,
    ("psionic","tech"):139,
}
ORDER=("idle 0","idle 1","construct 0","construct 1","damaged 0")

def alpha_mask(image):
    return bytes(255 if a>=32 else 0 for a in image.getchannel("A").tobytes())

def alpha_changed(a,b):
    return sum(x!=y for x,y in zip(alpha_mask(a),alpha_mask(b)))

def frame(atlas,index):
    return atlas.crop((0,index*SIZE,SIZE,(index+1)*SIZE))

def sheet(items,scale):
    width=3*(5*scale+28)+28
    height=2*(scale+79)+62
    canvas=Image.new("RGB",(width,height),(16,23,34))
    draw=ImageDraw.Draw(canvas)
    draw.text((15,12),
        "CHRONO DOMINION / PHYSICAL RADAR + LAB DAMAGE / PREVIEW ONLY / %dPX"%scale,
        fill=(130,226,243))
    for j,(faction,kind,atlas,metrics) in enumerate(items):
        col=j%3
        row=j//3
        x=14+col*(5*scale+28)
        y=44+row*(scale+79)
        draw.text((x,y),"%s / %s / DAMAGE %dPX"%(
            faction.upper(),kind.upper(),metrics["damage_alpha_change_80"]),
            fill=(235,237,244))
        for i in range(5):
            img=frame(atlas,i).resize((scale,scale),Image.Resampling.LANCZOS)
            bg=Image.new("RGB",(scale,scale),(41,49,60))
            bg.paste(img,(0,0),img)
            canvas.paste(bg,(x+i*scale,y+19))
            draw.text((x+i*scale,y+scale+22),ORDER[i],fill=(190,211,228))
        diff_a=frame(atlas,0).resize((80,80),Image.Resampling.LANCZOS)
        diff_b=frame(atlas,4).resize((80,80),Image.Resampling.LANCZOS)
        mask_a=alpha_mask(diff_a)
        mask_b=alpha_mask(diff_b)
        delta=Image.new("RGB",(80,80),(23,29,39))
        pix=delta.load()
        for p,(a,b) in enumerate(zip(mask_a,mask_b)):
            if a!=b:
                pix[p%80,p//80]=(242,183,57) if a else (65,235,169)
        delta=delta.resize((scale,scale),Image.Resampling.NEAREST)
        # Keep alpha-diff images separately to avoid shrinking contact-sheet frames.
        delta.save(ROOT/("%s-%s-damage-difference-%d.png"%(faction,kind,scale)))
    output=ROOT/("radar-tech-damage-contact-%d.png"%scale)
    canvas.save(output,optimize=True)
    return output

def main():
    ROOT.mkdir(parents=True,exist_ok=True)
    items=[]
    records=[]
    failures=[]
    for kind in KINDS:
        for faction in FACTIONS:
            stage=ROOT/faction/kind
            src=stage/"sources"/("%s-%s.blend"%(faction,kind))
            atlas_file=stage/"packed"/("%s-%s.png"%(faction,kind))
            assert src.is_file() and src.stat().st_size>1000,(faction,kind,"blend missing")
            with Image.open(atlas_file) as source:
                assert source.mode=="RGBA",(faction,kind,source.mode)
                atlas=source.copy()
            assert atlas.size==(160,800),(faction,kind,atlas.size)
            frames=[frame(atlas,i) for i in range(5)]
            for i,im in enumerate(frames):
                bbox=im.getchannel("A").getbbox()
                assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<160 and bbox[3]<160,(
                    faction,kind,i,"blank/clipped",bbox)
            reduced=[im.resize((80,80),Image.Resampling.LANCZOS) for im in frames]
            m={
                "faction":faction,
                "kind":kind,
                "source_bytes":src.stat().st_size,
                "idle_distinct_rgba":frames[0].tobytes()!=frames[1].tobytes(),
                "construction_alpha_change_80":alpha_changed(reduced[0],reduced[2]),
                "damage_alpha_change_80":alpha_changed(reduced[0],reduced[4]),
                "damage_alpha_change_160":alpha_changed(frames[0],frames[4]),
                "mk2_damage_baseline_80":BASELINE_80[(faction,kind)],
            }
            m["damage_improvement_80"]=m["damage_alpha_change_80"]-m["mk2_damage_baseline_80"]
            records.append(m)
            items.append((faction,kind,atlas,m))
            print(json.dumps(m,sort_keys=True),flush=True)
            if not m["idle_distinct_rgba"]:
                failures.append((faction,kind,"identical idle frames"))
            if m["construction_alpha_change_80"]<60:
                failures.append((faction,kind,"construction too subtle"))
            # Require a genuine pixel improvement over previously inspected MK-II,
            # not merely the presence of hidden wreckage meshes in the .blend.
            if m["damage_improvement_80"]<20:
                failures.append((faction,kind,"insufficient damage improvement at 80px"))
    for scale in (160,80):
        sheet(items,scale)
    (ROOT/"damage-qa.json").write_text(json.dumps(records,indent=2)+"\n")
    assert len(records)==6
    if failures:
        raise AssertionError("Visual QA failures: "+repr(failures))
    print("PASS: six editable radar/lab preview sources, five-frame RGBA atlases, "
          "physical damage and both 80px/160px contact sheets")

if __name__=="__main__":
    main()
