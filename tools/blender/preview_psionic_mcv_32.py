#!/usr/bin/env python3
"""PSI-VEH-007 original Psionic MCV: tri-petal floating construction ark.

PREVIEW ONLY. Custom 24-vertex hull, six independent hover thrusters,
three folding fabrication petals, three deployment anchors, an elevated
twelve-segment open assembly ring, and twelve closed fracture meshes.
Writes exclusively beneath --output; never modifies live game art.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES=("idle","move","deploy","destroyed")

def beam(name, a, b, width, material, parent):
    a,b=Vector(a),Vector(b)
    v=b-a
    obj=cube(name,(a+b)*.5,(width,width,v.length),material,parent)
    obj.rotation_euler=v.to_track_quat("Z","Y").to_euler()
    return obj

def shard(name,loc,scale,angles,material,parent):
    ring=[(-.68,-.17),(-.30,-.59),(.24,-.45),(.67,-.04),(.21,.54),(-.49,.36)]
    sx,sy,sz=scale
    verts=[(x*sx,y*sy,-sz*.5) for x,y in ring]
    verts += [(x*sx,y*sy,sz*.5) for x,y in ring]
    faces=[tuple(range(5,-1,-1)),tuple(range(6,12))]
    faces += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    o=wedge(name,verts,faces,material,parent)
    o.location=loc;o.rotation_euler=angles
    o["closed_fracture"]=True;o["wreckage_only"]=True
    o.hide_render=True
    return o

def deploy_only(o):
    o["deployment_only"]=True
    o.hide_render=True
    return o

def build():
    violet=mat("Ark deep amethyst ceramic",(.19,.10,.37,1),.48)
    lavender=mat("Ark polished lavender armor",(.61,.44,.81,1),.41)
    dark=mat("Ark dark levitation mechanism",(.042,.031,.092,1),.25)
    copper=mat("Ark rose copper articulations",(.69,.34,.51,1),.68)
    mint=mat("Ark luminous mint assembly field",(.24,.98,.70,1),.08,1.75)
    hot=mat("Ark fractured exposed magenta",(.94,.30,.58,1),.16,.38)
    root=empty("PSI-VEH-007 ORIGINAL Psionic Mobile Construction Ark")
    chassis=empty("Ark articulated floating chassis",root)
    # Twelve deliberately asymmetric outline vertices, two offset elevations.
    outline=[(1.85,-.24),(1.68,.37),(1.11,.70),(.35,.91),
             (-.66,.88),(-1.48,.56),(-1.82,.11),(-1.61,-.49),
             (-.83,-.87),(.14,-.96),(1.07,-.78),(1.68,-.53)]
    bottom=[(x,y,.50) for x,y in outline]
    top=[(x*.83,y*.82,1.21+(.12 if x<-.5 else 0)) for x,y in outline]
    faces=[tuple(range(11,-1,-1)),tuple(range(12,24))]
    faces += [(i,(i+1)%12,(i+1)%12+12,i+12) for i in range(12)]
    hull=wedge("Ark ORIGINAL 24-vertex asymmetrical manta ark hull",
               bottom+top,faces,violet,chassis)
    hull["custom_hull"]=True
    cube("Ark lower suspended reactor keel",(-.10,0,.46),(2.68,1.14,.24),dark,chassis)
    for side in (-1,1):
        wedge("Ark forward split wing "+str(side),
              [(1.10,side*.26,.72),(1.91,side*.51,.64),
               (1.06,side*.76,.70),(1.02,side*.24,1.11),
               (1.68,side*.50,1.02),(1.04,side*.71,1.06)],
              [(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)],
              lavender,chassis)
    cube("Ark asymmetric navigation eye",(1.59,-.23,1.13),
         (.19,.35,.14),mint,chassis)
    cube("Ark rear counterweight spine",(-1.22,.13,1.32),
         (.63,.43,.25),copper,chassis)
    thrusters=[]
    for side in (-1,1):
        for x in (-1.17,.05,1.12):
            pivot=empty("Ark independent six-hover thruster pivot",
                        chassis,(x,side*.84,.42))
            thrusters.append(pivot)
            cyl("Ark armored hover toroid",(0,0,0),.29,.21,violet,pivot,"Y")
            cyl("Ark visible plasma annulus",(0,side*.15,0),.17,.06,mint,pivot,"Y")
            cyl("Ark independent thrust gimbal",(0,-side*.08,0),.10,.06,copper,pivot,"Y")
    # Three physically distinct petals cover the construction core in transit.
    petals=[]
    for i in range(3):
        a=i*math.tau/3+.25
        px,py=.61*math.cos(a),.61*math.sin(a)
        pivot=empty("Ark independent fabrication petal hinge",
                    chassis,(-.13+px,py,1.37))
        pivot.rotation_euler.z=a
        petals.append(pivot)
        wedge("Ark custom split-shell fabrication petal",
              [(0,-.30,0),(.83,-.46,.09),(1.16,-.13,.23),
               (1.16,.18,.23),(.83,.45,.09),(0,.30,0),
               (0,-.25,.16),(.76,-.35,.25),(1.01,-.11,.35),
               (1.01,.16,.35),(.76,.34,.25),(0,.25,.16)],
              [tuple(range(5,-1,-1)),tuple(range(6,12))]+
              [(j,(j+1)%6,(j+1)%6+6,j+6) for j in range(6)],
              lavender,pivot)
        cube("Ark petal exposed radial conductor",(.76,0,.29),
             (.62,.095,.08),copper,pivot)
        cube("Ark petal tip assembly lamp",(1.08,0,.31),
             (.19,.16,.12),mint,pivot)
    # Real open center: twelve separate struts, no opaque ring disk.
    gantry=empty("Ark vertically rising open fabrication gantry",
                 chassis,(-.13,0,1.42))
    ring=[]
    for i in range(12):
        a=i*math.tau/12
        b=(i+1)*math.tau/12
        p=(.81*math.cos(a),.81*math.sin(a),.27)
        q=(.81*math.cos(b),.81*math.sin(b),.27)
        o=beam("Ark independent open gantry ring strut",p,q,.105,copper,gantry)
        o["open_ring_strut"]=True
        ring.append(o)
    for i in range(3):
        a=i*math.tau/3
        beam("Ark three raised cantilever supports",
             (.48*math.cos(a),.48*math.sin(a),.03),
             (.79*math.cos(a),.79*math.sin(a),.27),
             .11,violet,gantry)
    cyl("Ark central levitation core",(-.13,0,1.35),.36,.12,dark,chassis,"Z")
    cyl("Ark luminous floating reactor",(-.13,0,1.46),.24,.13,mint,chassis,"Z")
    # Deploy-only physically grounded stabilizers extend outside the hover hull.
    anchors=[]
    for i in range(3):
        a=i*math.tau/3+.30
        pivot=empty("Ark independent deployment anchor pivot",
                    chassis,(-.10+.82*math.cos(a),.82*math.sin(a),.65))
        pivot.rotation_euler.z=a
        anchors.append(pivot)
        deploy_only(beam("Ark deployed telescoping ground spar",
                         (0,0,0),(1.15,0,-.32),.19,copper,pivot))
        deploy_only(cube("Ark deployed heavy ground shoe",
                         (1.23,0,-.50),(.59,.52,.18),dark,pivot))
        deploy_only(cube("Ark deployed active anchoring prism",
                         (1.23,0,-.35),(.30,.31,.12),mint,pivot))
    deploy_only(cyl("Ark deployed elevated assembly crystal",
                    (-.13,0,2.23),.28,.38,mint,chassis,"Z"))
    wreck=[]
    fragments=[
      ("torn left beak",(1.20,-.53,.52),(.83,.41,.32),(.24,.20,-.43),lavender),
      ("torn right beak",(1.09,.57,.52),(.79,.44,.33),(.29,-.20,.40),violet),
      ("collapsed upper petal",(-.26,-.93,.71),(.85,.43,.28),(.39,.18,-.44),lavender),
      ("severed rear petal",(-.97,.69,.69),(.81,.43,.28),(.27,-.26,.49),violet),
      ("sheared ring left",(-.53,-.26,.84),(.73,.29,.25),(.31,.18,-.38),copper),
      ("sheared ring right",(.27,.51,.80),(.70,.29,.26),(.26,-.19,.40),copper),
      ("shattered mint core",(.04,-.03,.81),(.75,.54,.28),(.29,.19,-.22),hot),
      ("crushed aft hull",(-1.31,-.04,.51),(.86,.48,.31),(.25,-.21,.35),violet),
      ("port hover wreck",(-.89,-.93,.33),(.65,.42,.29),(.32,.18,-.42),dark),
      ("starboard hover wreck",(.85,.95,.34),(.63,.42,.27),(.27,-.25,.38),dark),
      ("rear keel fracture",(-1.39,-.47,.55),(.70,.37,.24),(.21,.25,-.32),copper),
      ("exposed reactor tear",(.52,-.31,.77),(.61,.39,.26),(.25,-.20,.31),hot),
    ]
    for label,loc,scale,rot,material in fragments:
        wreck.append(shard("Ark wreck "+label,loc,scale,rot,material,root))
    return dict(root=root,chassis=chassis,hull=hull,thrusters=thrusters,
                petals=petals,gantry=gantry,ring=ring,anchors=anchors,wreck=wreck)

def pose(p,state,facing):
    assert state in STATES
    p["root"].rotation_euler.z=facing*math.tau/32
    chassis=p["chassis"]
    chassis.location.z=.085 if state=="move" else -.18 if state=="destroyed" else 0
    chassis.rotation_euler.y=.035 if state=="move" else -.16 if state=="destroyed" else 0
    for i,t in enumerate(p["thrusters"]):
        t.rotation_euler.x=(.28 if i%2 else -.28) if state=="move" else 0
        t.rotation_euler.y=(.20 if i%3 else -.17) if state=="move" else 0
    for i,petal in enumerate(p["petals"]):
        petal.rotation_euler.y=-.92 if state=="deploy" else -.08
    p["gantry"].location.z=.94 if state=="deploy" else .0
    p["gantry"].rotation_euler.z=.16 if state=="deploy" else 0
    for o in chassis.children_recursive:
        if o.type=="MESH":
            o.hide_render=bool(o.get("deployment_only")) and state!="deploy"
    for o in p["wreck"]:o.hide_render=state!="destroyed"
    p["hull"].hide_render=state=="destroyed"
    if state=="destroyed":
        for o in chassis.children_recursive:
            if o.type=="MESH" and any(s in o.name.lower() for s in
                  ("split wing","petal","ring strut","cantilever",
                   "navigation eye","counterweight spine","visible plasma annulus","floating reactor",
                   "levitation core","active anchoring","assembly crystal")):
                o.hide_render=True
    bpy.context.view_layer.update()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup();parts=build();pose(parts,"idle",0)
    source=out/"psionic-mcv.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 facings",flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames; no live art",flush=True)

if __name__=="__main__":
    main()
