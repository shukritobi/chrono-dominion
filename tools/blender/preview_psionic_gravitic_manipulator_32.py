#!/usr/bin/env python3
"""PSI-VEH-005 Gravitic Manipulator: original 32-facing editable Blender preview.

Four mechanically distinct states; suspended four-pad field-drive chassis,
twin articulated horseshoe magnet jaws, floating flux core and broken wreckage.
Only writes to --output; never edits approved game art or manifests.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")


def build():
    purple = mat("Manipulator deep purple forged alloy", (.24,.11,.38,1), .62)
    lavender = mat("Manipulator pearlescent armored bevel", (.62,.41,.80,1), .48)
    graphite = mat("Manipulator black levitation core", (.032,.028,.058,1), .31)
    mint = mat("Manipulator mint superconducting field", (.06,1,.69,1), .06, 2.7)
    azure = mat("Manipulator azure field focus", (.13,.67,1,1), .12, 2.0)
    amber = mat("Manipulator exposed hot broken coil", (1,.34,.085,1), .24, 1.9)
    scorched = mat("Manipulator scorched broken armor", (.23,.16,.19,1), .25)

    root = empty("Psionic Gravitic Manipulator PSI-VEH-005 - original 32 facings")
    suspension = empty("Four-pad independently floating gravitic carriage", root)
    cube("Low central field-drive armored spine", (0,0,.64), (3.0,1.42,.51),
         purple,suspension)
    cube("Underslung exposed flux resonator", (-.30,0,.33), (1.66,1.03,.22),
         graphite,suspension)
    wedge("Tapered forward magnetic prow", [
        (.84,-.70,.48),(1.74,-.38,.48),(1.74,.38,.48),(.84,.70,.48),
        (.72,-.67,.93),(1.40,-.30,.81),(1.40,.30,.81),(.72,.67,.93)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        lavender,suspension)
    cube("Rear raised shielded power housing", (-1.02,0,1.08),
         (.86,1.13,.51),purple,suspension)
    cube("Forward identification visor", (1.41,0,.72), (.09,.57,.14),
         mint,suspension)
    skids=[]
    for side in (-1,1):
        for x in (-1.02,.94):
            skid=empty("Articulated gravitic traction pad",suspension,
                       (x,side*.96,.45))
            cube("Black floating traction shoe", (0,side*.09,0),
                 (1.03,.49,.28),graphite,skid)
            cube("Levitation outer armored float", (-.08,side*.15,.21),
                 (.87,.31,.16),lavender,skid)
            cube("Bright under-pad field strip", (.04,side*.10,-.18),
                 (.74,.23,.075),mint,skid)
            skids.append(skid)
        cube("Left or right exposed magnetic return bus",
             (-.14,side*.68,.92),(1.36,.14,.13),azure,suspension)
    # Two separate moving horseshoe-jaw roots; vertical uprights and top
    # bridges frame actual empty space instead of a painted portal.
    jaws=[]
    for side in (-1,1):
        jaw=empty("Independent articulated horseshoe magnetic jaw",
                  suspension,(-.12,side*.62,1.03))
        cube("Jaw vertical superconducting spar",(.05,side*.12,.55),
             (.37,.31,1.12),purple,jaw)
        cube("Jaw raised field-bearing crown",(.11,side*.12,1.16),
             (.57,.39,.23),lavender,jaw)
        cube("Jaw inward angled flux tip",(.25,-side*.22,1.36),
             (.41,.44,.24),mint,jaw)
        cube("Jaw inner luminous return conductor",(.26,-side*.08,.58),
             (.12,.09,.93),azure,jaw)
        cube("Jaw base articulated knuckle",(-.13,side*.11,.07),
             (.71,.54,.32),graphite,jaw)
        jaws.append(jaw)
    # Central vertical flux tower gives a very different silhouette from
    # the previously rendered fork-nosed Phase-Loom logistics hovercraft.
    tower=empty("Independent rotating central gravitic lifting spindle",
                suspension,(-.40,0,1.04))
    cyl("Lower magnet induction bearing",(0,0,.14),.43,.24,graphite,tower,"Z")
    cyl("Wide turquoise levitation toroid",(0,0,.43),.55,.11,mint,tower,"Z")
    cyl("Central tall hexagonal magnetic post",(0,0,.83),.22,.94,
        lavender,tower,"Z")
    cyl("Elevated field compression ring",(0,0,1.34),.48,.16,azure,tower,"Z")
    cube("Visible lifted crystal shard",(0,0,1.67),(.35,.38,.47),
         mint,tower)
    cube("Rear segmented antenna blade",(-.38,0,1.25),(.12,.20,.86),
         purple,tower)
    # Attack-only lifted target field and beam, not present in idle.
    pulse=cyl("Attack-only vertical gravitational lift beam",
              (.93,0,1.32),.22,1.08,mint,suspension,"Z")
    pulse.hide_render=True
    focus=cube("Attack-only suspended field target crystal",
               (.93,0,1.94),(.59,.52,.37),azure,suspension)
    focus.hide_render=True
    for obj in (pulse,focus):
        obj["attack_only"]=True

    wreck=[
        cube("Wreckage fallen port horseshoe jaw",(.31,-1.00,1.17),
             (1.02,.33,.30),purple,root,True),
        cube("Wreckage fractured starboard flux spar",(-.38,.98,1.42),
             (.43,.37,1.05),lavender,root,True),
        cube("Wreckage ruptured glowing induction coil",(-.48,-.37,1.28),
             (.63,.51,.28),amber,root,True),
        cube("Wreckage sheared central magnetic post",(-.20,.20,1.54),
             (.32,.33,.86),scorched,root,True),
        cube("Wreckage port lifted traction skid",(.82,-1.11,.78),
             (.98,.43,.31),graphite,root,True),
        cube("Wreckage exposed forward mint conductor",(1.19,-.35,.97),
             (.57,.15,.27),mint,root,True),
        cube("Wreckage detached starboard roof armor",(-1.00,.78,1.33),
             (.90,.49,.22),purple,root,True),
        cube("Wreckage orange torn field-drive heart",(.24,.27,1.09),
             (.48,.43,.40),amber,root,True),
    ]
    for obj,angles in zip(wreck,(
        (.31,.26,-.42),(.18,-.30,.42),(.24,.40,-.27),
        (.36,-.21,.19),(.21,.32,-.45),(.42,-.22,.23),
        (.25,.26,.47),(.17,.39,-.19))):
        obj.rotation_euler=angles
    return root,suspension,skids,jaws,tower,pulse,focus,wreck


def apply_pose(parts,state,facing):
    root,suspension,skids,jaws,tower,pulse,focus,wreck=parts
    root.rotation_euler=(0,0,facing*math.tau/32)
    suspension.location.z = (.14 if state=="move" else
                             -.11 if state=="destroyed" else 0)
    suspension.rotation_euler=(0,.06 if state=="move" else
                               .12 if state=="destroyed" else 0,0)
    for i,skid in enumerate(skids):
        skid.location.z=.45 + ((.12 if i%2 else -.10) if state=="move" else 0)
        skid.rotation_euler.x=(.09 if i%2 else -.09) if state=="move" else 0
    for side,jaw in zip((-1,1),jaws):
        jaw.rotation_euler.x=side*(.29 if state=="attack" else
                                  -.07 if state=="move" else 0)
    tower.rotation_euler.z=.35 if state=="attack" else .16 if state=="move" else 0
    tower.location.z=.12 if state=="attack" else 0
    for obj in suspension.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    pulse.hide_render=state!="attack"
    focus.hide_render=state!="attack"
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        for obj in suspension.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "horseshoe","superconducting spar","field-bearing crown",
                "flux tip","return conductor","central tall hexagonal",
                "elevated field compression","lifted crystal shard",
                "levitation toroid","rear segmented antenna",
                "outer armored float")):
                obj.hide_render=True
    bpy.context.view_layer.update()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve()
    out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup()
    parts=build()
    apply_pose(parts,"idle",0)
    source=out/"psionic-gravitic-manipulator.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts,state,facing)
            path=out/"frames"/state/f"{facing:02d}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 original facings",flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)


if __name__=="__main__":
    main()
