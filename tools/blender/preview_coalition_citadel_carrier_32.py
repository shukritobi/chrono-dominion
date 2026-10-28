#!/usr/bin/env python3
"""COA-VEH-007 original Citadel Assault Carrier; 32-facing PREVIEW ONLY.

A 20-vertex armored fortress hull, ten independent wheels, four moving
roof firing shields, six recessed physical gunports, twin articulated
sponson cannons, an armored rear access ramp and twelve manifold fracture
meshes. Writes only --output, never published artwork or manifests.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES=("idle","move","attack","destroyed")


def beam(name, a, b, width, material, parent):
    from mathutils import Vector
    aa,bb=Vector(a),Vector(b)
    d=bb-aa
    center=(aa+bb)/2
    o=cube(name,center,(width,width,d.length),material,parent)
    o.rotation_euler=d.to_track_quat("Z","Y").to_euler()
    return o


def fracture(name, location, scale, angles, material, parent):
    """Asymmetric six-sided extruded solid: 12 verts, 8 faces, manifold."""
    poly=[(-.64,-.12),(-.34,-.52),(.18,-.46),(.61,-.08),
          (.31,.44),(-.43,.35)]
    sx,sy,sz=scale
    vertices=[(x*sx,y*sy,-.5*sz) for x,y in poly]
    vertices += [(x*sx,y*sy,.5*sz) for x,y in poly]
    faces=[tuple(range(5,-1,-1)),tuple(range(6,12))]
    faces += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    o=wedge(name,vertices,faces,material,parent)
    o.location=location
    o.rotation_euler=angles
    o["closed_fracture"]=True
    o["wreckage_only"]=True
    o.hide_render=True
    return o


def build():
    cobalt=mat("Citadel naval cobalt armor",(.10,.30,.49,1),.72)
    ceramic=mat("Citadel pale reinforced ceramic",(.68,.79,.85,1),.59)
    black=mat("Citadel inset ballistic graphite",(.035,.058,.075,1),.35)
    rubber=mat("Citadel wheel rubber",(.022,.032,.043,1),.12)
    copper=mat("Citadel hydraulic brass",(.68,.48,.22,1),.73)
    cyan=mat("Citadel gunport cyan",(.10,.80,.98,1),.2,1.55)
    flash=mat("Citadel muzzle core",(.45,.93,1,1),.15,2.1)
    hot=mat("Citadel exposed fracture orange",(.88,.37,.14,1),.22,.36)
    root=empty("COA-VEH-007 ORIGINAL Citadel Assault Carrier")
    chassis=empty("Citadel independent eight-ton fortress chassis",root)

    # 10-sided front/rear rings, intentionally not a cube or scaled tank.
    bottom=[(2.03,-.49,.57),(2.16,-.25,.57),(2.16,.25,.57),
            (2.03,.49,.57),(1.57,.90,.57),(-1.57,.90,.57),
            (-1.93,.59,.57),(-1.93,-.59,.57),
            (-1.57,-.90,.57),(1.57,-.90,.57)]
    top=[(1.73,-.43,1.42),(1.91,-.23,1.35),(1.91,.23,1.35),
         (1.73,.43,1.42),(1.37,.79,1.70),(-1.42,.79,1.75),
         (-1.71,.48,1.60),(-1.71,-.48,1.60),
         (-1.42,-.79,1.75),(1.37,-.79,1.70)]
    faces=[tuple(range(9,-1,-1)),tuple(range(10,20))]
    faces += [(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
    hull=wedge("Citadel ORIGINAL 20-vertex armored fortress hull",
               bottom+top,faces,cobalt,chassis)
    hull["custom_hull"]=True
    cube("Citadel heavy recessed belly",(0,0,.42),(3.77,1.63,.35),black,chassis)
    cube("Citadel raised troop citadel",(-.23,0,1.63),(2.74,1.38,.46),
         ceramic,chassis)
    cube("Citadel upper observation roof",(-.32,0,1.97),(2.39,1.28,.16),
         cobalt,chassis)
    cube("Citadel forward wedge glacis",(1.74,0,1.18),(.50,1.12,.35),
         ceramic,chassis)
    for side in (-1,1):
        cube("Citadel side reinforced armor skirt",(.02,side*.96,.90),
             (3.50,.18,.51),ceramic,chassis)
        cube("Citadel side emergency evacuation hatch",
             (-1.23,side*1.06,1.23),(.58,.055,.44),cobalt,chassis)
        cube("Citadel side dark lower firing embrasure",
             (.54,side*1.07,1.34),(.72,.055,.21),black,chassis)
        for x in (-.75,.05,.85):
            port=cube("Citadel recessed physical firing port",
                      (x,side*.82,1.82),(.33,.085,.20),black,chassis)
            port["firing_port"]=True
            cube("Citadel gunport cyan optical slit",
                 (x,side*.874,1.81),(.21,.035,.045),cyan,chassis)
        for x in (-1.45,-.72,0,.72,1.45):
            cube("Citadel armored wheel housing",
                 (x,side*.91,.65),(.52,.28,.55),cobalt,chassis)
    wheels=[]
    for side in (-1,1):
        for x in (-1.45,-.72,0,.72,1.45):
            pivot=empty("Citadel independent roadwheel pivot",
                        chassis,(x,side*1.11,.37))
            wheels.append(pivot)
            cyl("Citadel broad independent armored tire",
                (0,0,0),.32,.21,rubber,pivot,"Y")
            cyl("Citadel recessed metal wheel hub",
                (0,-side*.12,0),.18,.06,ceramic,pivot,"Y")
            for a in (0,math.tau/4,math.tau/2,3*math.tau/4):
                cube("Citadel four independent wheel spokes",
                     (.11*math.cos(a),-side*.16,.11*math.sin(a)),
                     (.10,.025,.05),copper,pivot)

    # Elevated side parapets, with four *physical* pivoting blast shields.
    shields=[]
    for side in (-1,1):
        for x in (-.90,.55):
            pivot=empty("Citadel independently hinged roof blast shield",
                        chassis,(x,side*.63,2.05))
            shields.append((pivot,side))
            shield=cube("Citadel crenellated armored roof shield",
                        (0,side*.04,.20),(.83,.12,.43),ceramic,pivot)
            shield["roof_shield"]=True
            cube("Citadel shield firing aperture",
                 (.12,side*.12,.22),(.34,.035,.13),black,pivot)
            for dx in (-.31,.31):
                cube("Citadel separate battlement tooth",
                     (dx,side*.04,.46),(.18,.16,.16),cobalt,pivot)
    cube("Citadel rear lowered troop access ramp",
         (-1.91,0,.88),(.18,1.18,.72),black,chassis)
    for side in (-1,1):
        beam("Citadel rear ramp hydraulic rod",
             (-1.85,side*.58,.49),(-1.92,side*.58,1.29),
             .065,copper,chassis)
    cube("Citadel forward command cupola",
         (1.15,0,2.04),(.69,.74,.29),cobalt,chassis)
    cube("Citadel cupola triple armored visor",
         (1.49,0,2.06),(.065,.54,.11),cyan,chassis)

    # Two independent sponson cannons, with physically attached attack beams.
    weapons=[]
    effects=[]
    for side in (-1,1):
        pivot=empty("Citadel independent traversing side sponson",
                    chassis,(.45,side*.86,1.43))
        weapons.append((pivot,side))
        cube("Citadel sponson gun receiver",
             (.10,side*.17,.04),(.68,.38,.32),cobalt,pivot)
        barrel=cyl("Citadel independent forward gun barrel",
                   (.77,side*.17,.04),.10,.79,black,pivot,"X")
        barrel["physical_barrel"]=True
        cyl("Citadel cyan muzzle ferrule",
            (1.13,side*.17,.04),.16,.15,ceramic,pivot,"X")
        for i,(x,scale) in enumerate(((1.20,.29),(1.43,.22))):
            e=beam("Citadel attack-only gun-attached flash",
                   (x,side*.17,.04),(x+scale,side*.17,.04),
                   .19 if i==0 else .11,flash,pivot)
            e["attack_only"]=True
            e.hide_render=True
            effects.append(e)

    pieces=[
        ("crushed forward glacis",(1.64,-.38,.66),(.94,.55,.37),(.28,.19,-.42),cobalt),
        ("broken forward ceramic plate",(1.56,.52,.67),(.80,.42,.32),(.38,-.22,.34),ceramic),
        ("sheared left skirt",(-.65,-1.07,.72),(1.18,.27,.28),(.22,.17,-.46),ceramic),
        ("collapsed right skirt",(-.84,1.06,.65),(1.07,.29,.26),(.31,-.25,.43),cobalt),
        ("torn troop roof",(-.46,-.52,1.08),(1.04,.58,.27),(.37,.18,-.36),ceramic),
        ("cracked command cupola",(1.01,.26,1.00),(.67,.49,.31),(.24,-.34,.36),cobalt),
        ("left fallen battlement",(-.77,-.97,.77),(.78,.29,.27),(.30,.25,-.47),ceramic),
        ("right fallen battlement",(.55,1.02,.78),(.82,.28,.27),(.26,-.28,.39),ceramic),
        ("severed gun receiver",(.79,-.74,.83),(.61,.34,.26),(.40,.18,-.31),black),
        ("fractured ramp",(-1.68,.28,.61),(.72,.45,.25),(.22,.33,.34),cobalt),
        ("exposed internal hot metal",(-.29,-.12,.97),(.76,.56,.20),(.17,.26,-.21),hot),
        ("crumpled rear wall",(-1.47,-.51,.77),(.74,.42,.29),(.30,-.27,-.28),copper),
    ]
    wreck=[]
    for label,loc,scale,angles,material in pieces:
        wreck.append(fracture("Citadel wreck "+label,loc,scale,angles,
                              material,root))
    return root,chassis,hull,wheels,shields,weapons,effects,wreck


def pose(parts,state,facing):
    root,chassis,hull,wheels,shields,weapons,effects,wreck=parts
    root.rotation_euler.z=facing*math.tau/32
    chassis.location.z=.075 if state=="move" else -.15 if state=="destroyed" else 0
    chassis.rotation_euler.y=.045 if state=="move" else -.11 if state=="destroyed" else 0
    for i,wheel in enumerate(wheels):
        wheel.rotation_euler.y=(.78 if state=="move" else 0)
    for pivot,side in shields:
        pivot.rotation_euler.x=side*(.56 if state=="attack" else 0)
    for pivot,side in weapons:
        pivot.rotation_euler.z=side*(.16 if state=="attack" else 0)
    for o in chassis.children_recursive:
        if o.type=="MESH":o.hide_render=False
    for e in effects:e.hide_render=state=="attack" and False
    for o in wreck:o.hide_render=state!="destroyed"
    if state=="destroyed":
        hull.hide_render=True
        for o in chassis.children_recursive:
            if o.type=="MESH" and any(t in o.name.lower() for t in (
                "raised troop citadel","upper observation roof",
                "roof shield","battlement tooth","command cupola",
                "sponson gun receiver","forward gun barrel",
                "cyan muzzle ferrule","side reinforced armor skirt",
                "forward wedge glacis")):
                o.hide_render=True
        for e in effects:e.hide_render=True
    bpy.context.view_layer.update()


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,required=True)
    a=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=a.output.resolve()
    out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup()
    parts=build()
    pose(parts,"idle",0)
    source=out/"coalition-citadel-assault-carrier.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            path=out/"frames"/state/f"{facing:02d}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,32,flush=True)
    print("PREVIEW_ONLY",source,"128 original RGBA frames",flush=True)


if __name__=="__main__":
    main()
