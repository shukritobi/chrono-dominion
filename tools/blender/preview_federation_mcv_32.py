#!/usr/bin/env python3
"""FED-VEH-007 original Federation Mobile Construction Vehicle.

Preview ONLY. Produces 32 facings x idle/move/deploy/destroyed, separate
editable .blend and RGBA PNGs. Does not write any production art or manifests.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "deploy", "destroyed")


def shard(name, loc, scale, angles, material, parent):
    """Irregular closed 12-vertex prism: six-sided asymmetric fractured shell."""
    ring = [(-.58, -.19), (-.29, -.53), (.34, -.41),
            (.62, -.05), (.19, .49), (-.43, .35)]
    sx, sy, sz = scale
    verts = [(x*sx, y*sy, -.5*sz) for x, y in ring]
    verts += [(x*sx, y*sy, .5*sz) for x, y in ring]
    faces = [tuple(range(5, -1, -1)), tuple(range(6, 12))]
    faces += [(i, (i+1)%6, (i+1)%6+6, i+6) for i in range(6)]
    obj = wedge(name, verts, faces, material, parent)
    obj.location = loc
    obj.rotation_euler = angles
    obj["closed_fracture"] = True
    obj["wreckage_only"] = True
    obj.hide_render = True
    return obj


def deployment_mesh(obj):
    obj["deployment_only"] = True
    obj.hide_render = True
    return obj


def build():
    armor = mat("MCV Federation scarlet armored plate", (.34, .115, .11, 1), .78)
    steel = mat("MCV worn cast titanium", (.54, .46, .36, 1), .72)
    black = mat("MCV graphite hydraulic steel", (.052, .061, .070, 1), .60)
    tyre = mat("MCV reinforced rubber", (.027, .030, .036, 1), .06)
    bronze = mat("MCV brass actuator collar", (.76, .44, .17, 1), .70)
    amber = mat("MCV restrained construction beacon", (1.0, .49, .09, 1), .18, 1.3)
    split = mat("MCV fractured molten inner core", (.92, .37, .12, 1), .28, .22)

    root = empty("FED-VEH-007 ORIGINAL Federation MCV")
    chassis = empty("MCV independently animated armored chassis", root)

    # Purpose-authored ten-sided upper and lower outlines: NOT a box primitive.
    footprint = [(1.72,-.69), (1.87,-.40), (1.87,.40), (1.72,.69),
                 (1.18,.86), (-1.37,.86), (-1.84,.57), (-1.84,-.57),
                 (-1.37,-.86), (1.18,-.86)]
    bottom = [(x,y,.56) for x,y in footprint]
    top = [(x*.88,y*.83,1.40 if x<1.3 else 1.13) for x,y in footprint]
    faces = [tuple(range(9,-1,-1)), tuple(range(10,20))]
    faces += [(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
    hull = wedge("MCV ORIGINAL 20-vertex chamfered deployer hull",
                 bottom+top, faces, armor, chassis)
    hull["custom_hull"] = True
    cube("MCV structural load-bearing lower deck", (0,0,.48),
         (3.54,1.58,.33), black, chassis)
    cube("MCV near-side asymmetric service panel", (-.78,-.81,1.16),
         (.91,.09,.34), steel, chassis)
    cube("MCV forward reinforced driver viewport", (1.54,-.22,1.13),
         (.11,.42,.15), amber, chassis)
    cube("MCV rear hydraulic manifold", (-1.38,0,1.45),
         (.64,1.24,.29), black, chassis)

    wheels = []
    for side in (-1,1):
        cube("MCV independently removable wheel arch", (-.12,side*.96,.87),
             (3.30,.19,.28), steel, chassis)
        for x in (-1.27,-.42,.43,1.28):
            wheel = empty("MCV independent eight-wheel drive pivot",
                          chassis,(x,side*.95,.43))
            wheels.append(wheel)
            cyl("MCV 20-sided traction wheel", (0,0,0), .38,.22,tyre,wheel,"Y")
            cyl("MCV independent wheel hub", (0,-side*.14,0),.17,.045,bronze,wheel,"Y")
            for theta in (0,math.tau/3,2*math.tau/3):
                cube("MCV rotating hub spoke",
                     (.11*math.cos(theta),-side*.17,.11*math.sin(theta)),
                     (.13,.025,.038),steel,wheel)
        cube("MCV offset road safety stripe", (.78,side*1.07,1.04),
             (.55,.05,.07),amber,chassis)

    # Two transport roof leaves pivot outwards only when construction deploys.
    leaves = []
    for side in (-1,1):
        leaf = empty("MCV independently folding roof leaf hinge",
                     chassis,(-.36,side*.48,1.48))
        leaves.append(leaf)
        cube("MCV mechanically folding armored roof leaf",
             (.08,side*.22,.07),(1.43,.56,.18),steel,leaf)
        cube("MCV raised roof warning edge",
             (.08,side*.48,.19),(1.15,.055,.07),bronze,leaf)

    # A true articulated mast, two separate spreader arms and raised hoist.
    mast = empty("MCV articulated construction gantry mast",
                 chassis,(-.59,0,1.51))
    cube("MCV hydraulic gantry column", (0,0,.55),
         (.29,.32,1.20),black,mast)
    cube("MCV gantry sliding upper carriage", (.08,0,1.18),
         (.53,.50,.28),steel,mast)
    cube("MCV overhead hoist crosshead", (.26,0,1.34),
         (.86,.66,.18),armor,mast)
    cyl("MCV exposed hydraulic ram", (-.15,0,.54),.065,1.00,bronze,mast,"Z")
    arms = []
    for side in (-1,1):
        arm = empty("MCV independent left-right unfolding gantry arm",
                    mast,(.23,side*.30,1.34))
        arms.append(arm)
        cube("MCV telescopic gantry jib",
             (.24,side*.45,.02),(.31,1.03,.19),steel,arm)
        cube("MCV separate jib extension",
             (.33,side*.96,.02),(.21,.38,.16),armor,arm)
        cube("MCV safety tip beacon",
             (.33,side*1.12,.03),(.16,.14,.12),amber,arm)

    # Four physically distinct deployment outriggers: folded vehicle has none
    # visible; deployment adds substantial lateral ground-contact silhouette.
    outriggers = []
    for x in (-1.24,1.22):
        for side in (-1,1):
            pivot = empty("MCV independent telescopic stabilizer pivot",
                          chassis,(x,side*.78,.76))
            outriggers.append(pivot)
            deployment_mesh(cube("MCV deployed structural diagonal jack",
                                 (.02,side*.57,-.18),
                                 (.18,1.13,.18),steel,pivot))
            deployment_mesh(cube("MCV deployed piston rod",
                                 (.02,side*1.04,-.31),
                                 (.11,.49,.11),bronze,pivot))
            deployment_mesh(cube("MCV deployed grounded stabilizer foot",
                                 (.02,side*1.34,-.51),
                                 (.57,.47,.16),black,pivot))
            deployment_mesh(cube("MCV stabilizer amber alignment plate",
                                 (.02,side*1.34,-.42),
                                 (.34,.24,.055),amber,pivot))

    # Mechanical construction core is exposed only when deployed.
    core = deployment_mesh(cube("MCV deployed exposed fabrication core",
                                (-.22,0,1.66),(.77,.80,.35),black,chassis))
    deployment_mesh(cube("MCV deployed fabrication status rail",
                         (-.21,-.41,1.84),(.61,.10,.08),amber,chassis))
    deployment_mesh(cube("MCV deployed lift platform",
                         (1.03,0,1.25),(.93,.97,.14),steel,chassis))

    wreck = []
    pieces = [
        ("torn forward glacis",(1.48,-.65,.69),(.98,.52,.37),(.29,.25,-.42),armor),
        ("sheared driver cabin",(1.34,.48,.76),(.86,.55,.32),(.34,-.19,.39),steel),
        ("left broken roof leaf",(-.31,-1.02,.89),(.92,.44,.26),(.42,.20,-.49),steel),
        ("right broken roof leaf",(-.86,.92,.76),(.88,.42,.27),(.24,-.26,.52),armor),
        ("collapsed gantry base",(-.67,-.32,1.01),(.82,.55,.31),(.31,.18,.27),black),
        ("fractured mast segment",(-1.28,.32,.95),(.71,.27,.26),(.39,-.22,-.43),steel),
        ("broken hoist carriage",(.32,.90,.77),(.70,.35,.24),(.18,.27,.56),bronze),
        ("left crushed wheel arch",(-1.08,-1.18,.53),(.84,.32,.28),(.27,.28,-.32),armor),
        ("right crushed wheel arch",(.85,1.16,.55),(.83,.34,.27),(.32,-.28,.34),steel),
        ("exposed engine fracture",(-.44,-.06,1.04),(.85,.60,.22),(.18,.17,-.24),split),
        ("rear twisted manifold",(-1.48,-.40,.64),(.68,.40,.24),(.28,.39,-.28),black),
        ("detached stabilizer housing",(.38,-1.22,.52),(.69,.29,.22),(.24,-.29,.47),bronze),
    ]
    for label,loc,size,angles,material in pieces:
        wreck.append(shard("MCV wreck "+label,loc,size,angles,material,root))
    return dict(root=root,chassis=chassis,hull=hull,wheels=wheels,
                leaves=leaves,mast=mast,arms=arms,outriggers=outriggers,
                core=core,wreck=wreck)


def pose(p, state, facing):
    assert state in STATES
    p["root"].rotation_euler.z = facing*math.tau/32
    chassis = p["chassis"]
    chassis.location.z = .055 if state=="move" else -.13 if state=="destroyed" else 0
    chassis.rotation_euler.y = .025 if state=="move" else -.13 if state=="destroyed" else 0
    for i,wheel in enumerate(p["wheels"]):
        wheel.rotation_euler.y = (.64 if i%2 else -.64) if state=="move" else 0
    for i,leaf in enumerate(p["leaves"]):
        leaf.rotation_euler.x = (-.65 if i==0 else .65) if state=="deploy" else 0
    # Transport stows the entire 1.2-unit mast horizontally above the roof; 
    # deployment physically lifts it upright instead of merely lighting it.
    p["mast"].rotation_euler.y = -.08 if state=="deploy" else 1.25
    p["mast"].location.z = 1.72 if state=="deploy" else 1.51
    for i,arm in enumerate(p["arms"]):
        arm.rotation_euler.z = (-.25 if i==0 else .25) if state=="deploy" else (-.95 if i==0 else .95)
    for obj in chassis.children_recursive:
        if obj.type=="MESH":
            obj.hide_render = bool(obj.get("deployment_only")) and state!="deploy"
    for obj in p["wreck"]:
        obj.hide_render = state!="destroyed"
    if state=="destroyed":
        p["hull"].hide_render = True
        for obj in chassis.children_recursive:
            if obj.type=="MESH" and any(key in obj.name.lower() for key in
                  ("roof leaf","gantry","hydraulic ram","service panel",
                   "driver viewport","wheel arch","road safety stripe",
                   "rear hydraulic manifold")):
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
    pose(parts,"idle",0)
    source=out/"federation-mcv.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 original facings",flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA PNGs; no live art",flush=True)


if __name__=="__main__":
    main()
