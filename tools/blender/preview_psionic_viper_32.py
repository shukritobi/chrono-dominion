#!/usr/bin/env python3
"""Original Psionic Viper Light Tank P0 pilot: 32 facings, four states, preview-only.

A levitating obsidian skirmisher with a bifurcated prow, suspended crystal
heart, articulated gravity skids and asymmetric lateral phase emitters.
This is independently authored geometry, not a copy of any existing tank.
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
    black = mat("Viper midnight amethyst ceramic", (.065,.042,.12,1), .42)
    plum = mat("Viper violet metamaterial plates", (.29,.105,.40,1), .50)
    silver = mat("Viper bone silver edge trims", (.53,.56,.63,1), .72)
    dark = mat("Viper exposed graphite mechanics", (.025,.029,.050,1), .23)
    glow = mat("Viper psionic violet plasma", (.65,.14,1,1), .02, 3.0)
    cyan = mat("Viper suspended core cyan", (.13,1,.92,1), .03, 2.8)
    ember = mat("Viper broken crystal orange", (1,.27,.07,1), .05, 2.8)
    root = empty("Psionic Viper Light Tank - original 32-facing pilot")
    hover = empty("Viper levitating segmented lower hull", root)
    cube("Viper compact suspended central hull", (0,0,.79), (2.57,1.27,.45), black, hover)
    cube("Viper narrow ventral black keel", (-.05,0,.52), (1.88,.58,.30), dark, hover)
    wedge("Viper bifurcated forward prow core", [
        (.45,-.58,.67),(1.60,-.28,.61),(1.60,.28,.61),(.45,.58,.67),
        (.36,-.54,1.09),(1.22,-.20,.92),(1.22,.20,.92),(.36,.54,1.09)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        plum,hover)
    cube("Viper dorsal spine armor",(-.52,0,1.11),(1.18,.70,.21),silver,hover)
    cube("Viper aft engine shroud",(-1.09,0,.94),(.62,1.09,.31),black,hover)
    skids=[]
    for side in (-1,1):
        skid=empty("Viper independently articulated gravitic skid",hover,
                   (-.13,side*.79,.57))
        skids.append(skid)
        cube("Viper blade-shaped anti-gravity side nacelle",
             (-.04,side*.10,0),(2.37,.37,.31),plum,skid)
        cube("Viper nacelle silver leading knife",(.88,side*.11,.05),
             (.61,.12,.12),silver,skid)
        cube("Viper underside hover field slit",(-.10,side*.12,-.18),
             (1.75,.22,.08),glow,skid)
        for x in (-.79,.12,.83):
            cyl("Viper triple field stabilizer emitter",
                (x,side*.13,-.26),.16,.12,cyan,skid,"Z")
        cube("Viper asymmetric fin upper armor",
             (-.81,side*.24,.30),(.79,.23,.48),black,skid)
        cube("Viper luminous forward horn tip",
             (1.16,side*.13,.10),(.32,.15,.16),glow,skid)
        cube("Viper side exposed field cable",
             (-.46,side*.31,.18),(.72,.09,.09),cyan,skid)
    # A separate, articulated forward jaw on each side preserves the
    # characteristic double-prong silhouette from every quarter view.
    mandibles=[]
    for side in (-1,1):
        jaw=empty("Viper independently articulated crescent mandible",hover,
                  (.80,side*.48,1.03))
        mandibles.append(jaw)
        wedge("Viper swept forward phase fang",[
            (-.15,-.17,-.12),(.85,-.12,-.10),(.85,.12,-.10),(-.15,.17,-.12),
            (-.20,-.13,.17),(.55,-.06,.12),(.55,.06,.12),(-.20,.13,.17)],
            [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
            silver,jaw)
        cube("Viper phase fang emissive inner edge",
             (.47,0,.14),(.51,.08,.06),glow,jaw)
    crown=empty("Viper swivelling neural crown and weapon",hover,(-.19,0,1.14))
    cyl("Viper rotating purple magnetic bearing",(0,0,.08),.49,.16,plum,crown,"Z")
    cube("Viper low floating armored crown",(.10,0,.35),(1.00,.91,.35),black,crown)
    cube("Viper raised prismatic crest",(-.23,0,.63),(.52,.37,.34),plum,crown)
    core=cyl("Viper suspended crystalline neural heart",(-.31,0,.86),
             .24,.52,cyan,crown,"Z")
    core.rotation_euler.y=.22
    for side in (-1,1):
        cube("Viper asymmetric neural antenna",
             (-.46,side*.36,.78),(.18,.11,.44),silver,crown)
        cube("Viper dual phase emitter rail",
             (.69,side*.23,.38),(.83,.17,.18),plum,crown)
        cyl("Viper paired ion aperture",(1.10,side*.23,.38),
            .11,.15,glow,crown,"X")
    flash=cube("Viper attack-only twin phase spear",(1.58,0,.38),
               (.91,.42,.20),glow,crown)
    flash.hide_render=True
    halo=cyl("Viper attack-only bifurcated shock disk",(1.19,0,.38),
             .33,.07,cyan,crown,"X")
    halo.hide_render=True
    wreck=[
        cube("Viper wreckage sheared neural crown",(.32,-.66,1.39),
             (1.09,.62,.28),black,root,True),
        cube("Viper wreckage broken left phase fang",(1.22,-.86,1.16),
             (1.18,.21,.22),silver,root,True),
        cube("Viper wreckage broken right phase fang",(.88,.91,1.18),
             (.94,.20,.24),plum,root,True),
        cube("Viper wreckage shattered hover nacelle",(-.63,-1.02,.80),
             (1.10,.33,.29),dark,root,True),
        cube("Viper wreckage ruptured reactor fracture",(-.37,0,1.24),
             (.63,.57,.30),ember,root,True),
        cube("Viper wreckage split dorsal spine",(-.91,.41,1.45),
             (.69,.34,.27),silver,root,True),
        cube("Viper wreckage exposed broken stabilizer",(.61,1.12,.64),
             (.78,.22,.37),cyan,root,True),
        cube("Viper wreckage fallen sensor antenna",(-1.14,-.60,1.58),
             (.19,.16,.72),plum,root,True),
    ]
    for obj,angles in zip(wreck,(
        (.32,.28,-.46),(.15,-.38,-.29),(.19,.25,.48),(.24,-.33,.37),
        (.10,.19,-.18),(.31,-.22,.21),(.38,.28,-.37),(.49,-.30,.44))):
        obj.rotation_euler=angles
    return root,hover,skids,mandibles,crown,core,flash,halo,wreck


def apply_pose(parts,state,facing):
    root,hover,skids,mandibles,crown,core,flash,halo,wreck=parts
    root.rotation_euler=(0,0,facing*math.tau/32)
    hover.location.z=.18 if state=="move" else -.14 if state=="destroyed" else 0
    hover.rotation_euler=(0,-.055 if state=="move" else .14 if state=="destroyed" else 0,0)
    for index,skid in enumerate(skids):
        skid.rotation_euler.x=((-1)**index)*(.19 if state=="move" else -.18 if state=="destroyed" else 0)
        skid.location.z=.04 if state=="move" else 0
    for index,jaw in enumerate(mandibles):
        jaw.rotation_euler.z=((-1)**index)*(.23 if state=="attack" else .045 if state=="move" else 0)
    crown.rotation_euler.z=.14 if state=="attack" else -.04 if state=="move" else 0
    core.location.z=1.04 if state=="attack" else .86
    for obj in hover.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    flash.hide_render=state!="attack"
    halo.hide_render=state!="attack"
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        for obj in hover.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "floating armored crown","prismatic crest","crystalline neural heart",
                "neural antenna","dual phase emitter rail","paired ion aperture",
                "swept forward phase fang","phase fang emissive inner edge",
                "dorsal spine armor","asymmetric fin upper armor",
                "blade-shaped anti-gravity side nacelle")):
                obj.hide_render=True
    bpy.context.view_layer.update()


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve()
    out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup()
    parts=build()
    apply_pose(parts,"idle",0)
    source=out/"psionic-viper-light-tank.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 original facings",flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)


if __name__=="__main__":
    main()
