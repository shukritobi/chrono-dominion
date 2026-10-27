#!/usr/bin/env python3
"""Federation Hunter Spider Drone: original editable 32-facing Blender preview.

Eight individually articulated paired-strut legs, low arachnid sensor carapace,
jumping penetration lance and genuinely separate collapsed wreckage. The output
is review-only: no game sprites, texture atlases or manifests are overwritten.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")


def strut(name, start, end, width, material, parent):
    """Build a real independently editable rectangular limb along two joints."""
    a, b = Vector(start), Vector(end)
    direction = b - a
    obj = cube(name, tuple((a+b)*.5), (width, direction.length, width),
               material, parent)
    obj.rotation_euler = direction.to_track_quat("Y", "Z").to_euler()
    return obj


def build():
    iron = mat("Spider Federation red ceramic armour", (.49,.17,.14,1), .60)
    dark = mat("Spider oil-black hydraulic carbon", (.035,.042,.052,1), .25)
    rim = mat("Spider warm titanium edge armour", (.74,.44,.27,1), .58)
    steel = mat("Spider brushed leg actuator", (.37,.40,.42,1), .70)
    amber = mat("Spider optical sensor amber", (1,.35,.055,1), .08, 2.2)
    eye = mat("Spider warning scarlet emitter", (1,.055,.025,1), .08, 2.8)
    fracture = mat("Spider hot fracture highlight", (1,.40,.08,1), .12, 1.8)
    root = empty("Federation Hunter Spider Drone - original 32 facing source")
    body = empty("Low armored eight-legged hunting core", root)

    cube("Underslung processor cassette",(-.10,0,.85),(1.43,.86,.41),dark,body)
    cube("Armoured segmented abdomen",(-.60,0,1.16),(1.35,1.18,.42),iron,body)
    wedge("Original sloping hunter carapace", [
        (-1.13,-.56,1.12),(.72,-.52,1.12),(.72,.52,1.12),(-1.13,.56,1.12),
        (-.88,-.38,1.58),(.44,-.30,1.44),(.44,.30,1.44),(-.88,.38,1.58)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        iron,body)
    cube("Ribbed dorsal battery armour",(-.74,0,1.58),(.57,.78,.13),rim,body)
    cube("Hunting mandible face shield",(.77,0,1.10),(.51,.84,.28),steel,body)
    cube("Wide cyclopean tracking eye",(1.05,0,1.20),(.12,.53,.17),amber,body)
    for side in (-1,1):
        cube("Separated articulated piercing mandible",
             (1.12,side*.35,.95),(.70,.15,.16),iron,body)
        cube("Warning optical side slit",
             (.36,side*.57,1.32),(.46,.055,.10),eye,body)
        cyl("Independent rotating hip socket",(-.13,side*.56,.96),
            .18,.15,steel,body,"Y")

    legs = []
    for side in (-1,1):
        for index,x in enumerate((-.89,-.35,.20,.75)):
            # Each leg has an independent hip rig and TWO real limb sections.
            rig = empty("Independent spider leg %s %d"%(("port" if side<0 else "starboard"),index),
                        body,(x,side*.47,.95))
            swing = -.14 if index < 2 else .17
            knee = (swing,side*.71,-.07 if index%2 else .04)
            tip = (swing+.18,side*1.17,-.76)
            cyl("Leg %02d hip ball"%len(legs),(0,0,0),.14,.15,rim,rig,"Y")
            strut("Leg %02d upper tapered armor"%len(legs),
                  (0,0,0),knee,.16,iron,rig)
            cyl("Leg %02d knee hinge"%len(legs),knee,.12,.15,steel,rig,"Y")
            strut("Leg %02d lower exposed piston"%len(legs),
                  knee,tip,.115,steel,rig)
            cube("Leg %02d pointed traction claw"%len(legs),tip,
                 (.30,.15,.10),dark,rig)
            cube("Leg %02d orange knee identifier"%len(legs),
                 (knee[0],knee[1],knee[2]+.10),(.12,.13,.09),amber,rig)
            legs.append((rig,index,side))
    # Raised sting assembly gives the drone an original silhouette distinct
    # from a wheeled or tracked vehicle.
    stinger = empty("Independent dorsal penetration lance",body,(.16,0,1.38))
    cube("Stinger sliding carbon rail",(.52,0,.24),(1.08,.24,.20),dark,stinger)
    strut("Stinger sharpened titanium needle",(.89,0,.24),(1.58,0,.30),
          .12,steel,stinger)
    cube("Stinger charged injector",(.77,0,.29),(.31,.28,.24),amber,stinger)
    shock = cube("Attack-only crimson impact shard",(1.91,0,.31),
                 (.58,.25,.23),eye,stinger)
    shock.hide_render=True
    halo = cyl("Attack-only induction halo",(1.70,0,.31),.27,.055,amber,stinger,"X")
    halo.hide_render=True

    wreck = [
        cube("Wreckage collapsed split carapace",(-.35,-.20,1.06),
             (1.25,.84,.25),iron,root,True),
        cube("Wreckage detached front hunter eye",(.85,-.53,.70),
             (.38,.42,.28),amber,root,True),
        cube("Wreckage fallen penetration lance",(1.05,.55,.59),
             (1.15,.14,.13),steel,root,True),
        cube("Wreckage severed front left leg",(.71,-1.12,.54),
             (.95,.13,.14),steel,root,True),
        cube("Wreckage severed front right leg",(1.06,1.04,.49),
             (.82,.15,.14),iron,root,True),
        cube("Wreckage rear port shattered limb",(-.96,-.93,.57),
             (.81,.15,.15),steel,root,True),
        cube("Wreckage rear starboard shattered limb",(-1.05,1.02,.62),
             (.92,.14,.16),iron,root,True),
        cube("Wreckage exposed broken core",(-.07,.07,.98),
             (.53,.44,.37),fracture,root,True),
        cube("Wreckage upper jagged glowing seam",(-.38,-.38,1.19),
             (.63,.06,.07),fracture,root,True),
        cube("Wreckage second glowing fracture",(.23,.37,1.13),
             (.48,.06,.06),fracture,root,True),
    ]
    for obj,angles in zip(wreck,(
        (.24,-.16,.30),(.30,.21,-.43),(.19,-.40,.38),(.18,.23,-.58),
        (.27,-.21,.40),(.15,.29,-.31),(.18,-.23,.48),(.09,.12,.15),
        (.27,.16,-.25),(.17,-.29,.24))):
        obj.rotation_euler=angles
    return root,body,legs,stinger,shock,halo,wreck


def apply_pose(parts,state,facing):
    root,body,legs,stinger,shock,halo,wreck = parts
    root.rotation_euler=(0,0,facing*math.tau/32)
    body.location.z = .09 if state=="move" else -.30 if state=="destroyed" else .14 if state=="attack" else 0
    body.rotation_euler = (0,-.12 if state=="attack" else .14 if state=="destroyed" else 0,0)
    stinger.rotation_euler.y = -.22 if state=="attack" else .20 if state=="destroyed" else 0
    stinger.location.x = .25 if state=="attack" else .16
    for rig,index,side in legs:
        phase = 1 if (index+(0 if side<0 else 1))%2 else -1
        rig.location.x = (-.89,-.35,.20,.75)[index]+(.17*phase if state=="move" else 0)
        rig.rotation_euler = ((.12*phase*side if state=="move" else 0),
                              (.09*phase if state=="move" else 0),
                              (.14*phase if state=="move" else 0))
    for obj in body.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    shock.hide_render=state!="attack"
    halo.hide_render=state!="attack"
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        for obj in body.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "leg ","hunter carapace","armoured segmented abdomen",
                "piercing mandible","tracking eye","stinger","dorsal battery",
                "optical side slit","hip socket","hunting mandible")):
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
    source=out/"federation-hunter-spider-drone.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 facings",flush=True)
    print("PREVIEW_ONLY",source,"128 independent 160px RGBA frames",flush=True)


if __name__=="__main__":
    main()
