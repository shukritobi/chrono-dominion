#!/usr/bin/env python3
"""Targeted Federation siege-lab damage correction QA, preview only."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
from qa_radar_tech_damage import frame,alpha_changed

ROOT=Path("generated/federation-tech-damage/federation/tech")
OUT=ROOT.parent.parent
BASELINE_MKII_80=104
FAILED_MKIV_FIRST_80=111

def main():
    atlas_path=ROOT/"packed/federation-tech.png"
    source=ROOT/"sources/federation-tech.blend"
    assert source.stat().st_size>1000
    with Image.open(atlas_path) as img:
        assert img.mode=="RGBA" and img.size==(160,800)
        atlas=img.copy()
    states=[frame(atlas,i) for i in range(5)]
    reduced=[im.resize((80,80),Image.Resampling.LANCZOS) for im in states]
    for i,im in enumerate(states):
        b=im.getchannel("A").getbbox()
        assert b and min(b[0],b[1])>0 and max(b[2],b[3])<160,(i,b)
    delta_80=alpha_changed(reduced[0],reduced[4])
    delta_160=alpha_changed(states[0],states[4])
    construct_80=alpha_changed(reduced[0],reduced[2])
    idle_80=alpha_changed(reduced[0],reduced[1])
    record={
        "faction":"federation","kind":"tech",
        "mk2_damage_alpha_80":BASELINE_MKII_80,
        "failed_mkiv_first_damage_alpha_80":FAILED_MKIV_FIRST_80,
        "corrected_damage_alpha_80":delta_80,
        "corrected_damage_alpha_160":delta_160,
        "damage_improvement_over_mk2_80":delta_80-BASELINE_MKII_80,
        "damage_improvement_over_first_attempt_80":delta_80-FAILED_MKIV_FIRST_80,
        "construction_alpha_80":construct_80,
        "idle_alpha_80":idle_80,
        "idle_rgba_distinct":states[0].tobytes()!=states[1].tobytes(),
        "editable_source_bytes":source.stat().st_size,
    }
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"federation-tech-damage-qa.json").write_text(json.dumps(record,indent=2)+"\n")
    for scale in (160,80):
        canvas=Image.new("RGB",(scale*5+32,scale+76),(18,24,36))
        draw=ImageDraw.Draw(canvas)
        draw.text((12,9),
            "FEDERATION LAB / PHYSICAL FURNACE COLLAPSE / %dPX / PREVIEW"%scale,
            fill=(242,177,109))
        for i,im in enumerate(states):
            f=im.resize((scale,scale),Image.Resampling.LANCZOS)
            bg=Image.new("RGB",(scale,scale),(42,47,58))
            bg.paste(f,(0,0),f)
            canvas.paste(bg,(12+i*scale,34))
            draw.text((12+i*scale,scale+38),
                ("idle 0","idle 1","construct 0","construct 1","damaged 0")[i],
                fill=(216,222,235))
        canvas.save(OUT/("federation-tech-damage-%d.png"%scale))
    print(json.dumps(record,sort_keys=True),flush=True)
    assert record["idle_rgba_distinct"],"idle animation regressed"
    assert construct_80>=60,"construction state regressed"
    assert delta_80>=BASELINE_MKII_80+20,"damaged silhouette still unreadable"
    assert delta_80>=FAILED_MKIV_FIRST_80+20,"failed to fix previous QA"
    print("PASS: physical furnace collapse, distinct idle, construction and damage at 80px")

if __name__=="__main__":
    main()
