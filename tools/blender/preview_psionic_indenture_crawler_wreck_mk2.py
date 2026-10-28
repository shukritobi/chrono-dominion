#!/usr/bin/env python3
"""PSI-VEH-001 MK-II physical wreck polish; 32 destroyed-only facings.

The validated 96 idle/move/harvest frames are copied from workflow 40784608098.
Suppresses intact glowing cutter drums in wreck and adds four independently
editable, manifold sheared cutter fragments. Preview-only; never live art.
"""
import argparse
import sys
from pathlib import Path
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import preview_psionic_indenture_crawler_32 as baseline
from preview_coalition_carrier_32 import mat

def build():
    p=baseline.build()
    copper=mat("Crawler MK-II torn cutting teeth",(.78,.39,.16,1),.41,.08)
    steel=mat("Crawler MK-II broken drum steel",(.26,.16,.31,1),.48)
    shapes=[
      ("port sheared cutter half",(1.32,-.58,.48),(.55,.30,.23),(.28,.17,-.42),copper),
      ("starboard sheared cutter half",(1.39,.60,.43),(.52,.29,.24),(.24,-.18,.38),steel),
      ("port copper fracture tooth",(1.72,-.34,.39),(.42,.24,.18),(.31,.21,-.31),copper),
      ("starboard exposed tooth",(1.63,.42,.43),(.44,.24,.19),(.22,-.19,.34),copper),
    ]
    p["mk2_wreck"]=[]
    for name,loc,size,rot,material in shapes:
        obj=baseline.closed_shard("Crawler MK-II "+name,loc,size,rot,material,p["root"])
        obj["mk2_wreck_only"]=True
        p["mk2_wreck"].append(obj)
    p["intact_cutter_drums"]=[
        o for o in p["chassis"].children_recursive
        if o.type=="MESH" and "cutting drum" in o.name.lower()
    ]
    assert len(p["intact_cutter_drums"])==4
    return p

def pose(p,state,facing):
    baseline.pose(p,state,facing)
    destroyed=state=="destroyed"
    for o in p["intact_cutter_drums"]:
        o.hide_render=destroyed
    for o in p["mk2_wreck"]:
        o.hide_render=not destroyed
    bpy.context.view_layer.update()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    scene=baseline.scene_setup()
    p=build()
    pose(p,"idle",0)
    source=out/"psionic-indenture-crawler-wreck-mk2.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for facing in range(32):
        pose(p,"destroyed",facing)
        path=out/"frames"/"destroyed"/f"{facing:02d}.png"
        path.parent.mkdir(parents=True,exist_ok=True)
        scene.render.filepath=str(path)
        bpy.ops.render.render(write_still=True)
    print("MK-II PREVIEW ONLY: 32 corrected destroyed frames, 96 validated originals copied",flush=True)

if __name__=="__main__":
    main()
