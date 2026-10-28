#!/usr/bin/env python3
"""FED-VEH-004: original six-legged Iron Federation Hunter Spider Drone.
Preview-only editable Blender geometry; never writes production sprites.
32 facings x idle/move/attack/destroyed = 128 transparent 160px frames.
"""
import argparse, math, sys
from pathlib import Path
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES=("idle","move","attack","destroyed")

def closed_beam(name,a,b,wa,wb,material,parent):
    """Closed tapered eight-vertex articulated steel leg, not a cylinder."""
    a,b=Vector(a),Vector(b)
    axis=(b-a).normalized()
    lateral=axis.cross(Vector((0,0,1)))
    if lateral.length<.01: lateral=axis.cross(Vector((0,1,0)))
    lateral.normalize()
    normal=axis.cross(lateral).normalized()
    verts=[]
    for pos,w in ((a,wa),(b,wb)):
        for u,v in ((-1,-1),(1,-1),(1,1),(-1,1)):
            verts.append(tuple(pos+(u*lateral+v*normal)*w*.5))
    faces=[(3,2,1,0),(4,5,6,7)]
    faces.extend((i,(i+1)%4,(i+1)%4+4,i+4) for i in range(4))
    obj=wedge(name,verts,faces,material,parent)
    obj["articulated_beam"]=True
    return obj

def fragment(name,loc,scale,angles,material,parent):
    outline=[(-.54,-.28),(-.27,-.53),(.34,-.41),(.53,.09),(.15,.49),(-.44,.37)]
    x,y,z=scale
    vertices=[(u*x,v*y,-z*.5) for u,v in outline]+[(u*x,v*y,z*.5) for u,v in outline]
    faces=[tuple(range(5,-1,-1)),tuple(range(6,12))]
    faces.extend((i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6))
    o=wedge(name,vertices,faces,material,parent)
    o.location=loc;o.rotation_euler=angles
    o["closed_fracture"]=True;o["wreckage_only"]=True;o.hide_render=True
    return o

def build():
    iron=mat("Spider Federation scarlet alloy",(.43,.14,.15,1),.75)
    pale=mat("Spider machined ceramic armour",(.69,.51,.38,1),.53)
    dark=mat("Spider carbon hydraulic joints",(.035,.043,.052,1),.30)
    lens=mat("Spider hostile amber optics",(.99,.39,.045,1),.12,1.65)
    copper=mat("Spider fractured copper",(.89,.43,.17,1),.34,.3)
    root=empty("FED-VEH-004 Hunter Spider Drone original")
    body=empty("Spider suspended armoured chassis",root)
    # Custom convex, angular octagonal shell with sloping upper face.
    lower=[(1.05,-.37,.93),(.61,-.67,.93),(-.63,-.67,.93),(-1.02,-.36,.93),
           (-1.02,.36,.93),(-.63,.67,.93),(.61,.67,.93),(1.05,.37,.93)]
    upper=[(.76,-.29,1.58),(.45,-.47,1.64),(-.46,-.47,1.64),(-.75,-.28,1.50),
           (-.75,.28,1.50),(-.46,.47,1.64),(.45,.47,1.64),(.76,.29,1.58)]
    faces=[tuple(range(7,-1,-1)),tuple(range(8,16))]
    faces.extend((i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8))
    shell=wedge("Spider original 16-vertex octagonal command carapace",lower+upper,faces,iron,body)
    shell["custom_shell"]=True
    cube("Spider suspended ventral hydraulic battery",(-.02,0,.82),(1.39,.84,.31),dark,body)
    cube("Spider stepped upper command crest",(-.13,0,1.72),(.93,.64,.17),pale,body)
    cube("Spider asymmetric left sensor hood",(.51,-.40,1.52),(.49,.22,.24),pale,body)
    cube("Spider asymmetric right rangefinder",(-.30,.46,1.52),(.32,.20,.19),dark,body)
    for y in (-.26,.26):
        cube("Spider frontal amber optical slit",(.89,y,1.35),(.12,.30,.12),lens,body)
    cyl("Spider upper six-axis guidance rotor",(-.15,0,1.85),.24,.12,dark,body,"Z")
    legs=[]
    for side in (-1,1):
        for idx,x in enumerate((-.74,0,.74)):
            leg=empty("Spider independent articulated leg hinge",root,(x,side*.51,1.08))
            shift=(-.19,0,.20)[idx]
            knee=(shift,side*.80,-.28)
            toe=(shift+(-.16,0,.16)[idx],side*1.35,-.91)
            closed_beam("Spider forged upper angular femur",(0,0,0),knee,.25,.17,iron,leg)
            closed_beam("Spider telescoping lower angular tibia",knee,toe,.18,.11,pale,leg)
            cube("Spider plated articulated knee",knee,(.23,.25,.23),dark,leg)
            cube("Spider broad claw foot",toe,(.39,.30,.12),dark,leg)
            cube("Spider toe traction tooth",(toe[0]+.13,toe[1]+side*.10,toe[2]-.05),
                 (.17,.13,.13),pale,leg)
            legs.append(leg)
    # Attack-only real extended forward injector and two angled capacitor blades.
    attack=[]
    attack.append(closed_beam("Spider attack-only extended injection lance",
                (1.00,0,1.24),(2.12,0,1.08),.31,.065,copper,body))
    for side in (-1,1):
        attack.append(closed_beam("Spider attack-only electrostatic fang",
                    (1.05,side*.22,1.27),(1.88,side*.42,1.05),.20,.045,lens,body))
    for obj in attack:obj.hide_render=True;obj["attack_only"]=True
    wreck=[]
    data=[
      ("Spider wreck split command crest",(.12,-.35,1.36),(.82,.49,.21),(.26,.32,-.35),pale),
      ("Spider wreck severed front visor",(1.00,-.41,1.05),(.65,.34,.27),(.44,.13,.38),iron),
      ("Spider wreck left forward femur",(.86,-1.01,.56),(.92,.31,.23),(.22,.29,-.41),iron),
      ("Spider wreck right rear tibia",(-.85,1.01,.44),(.83,.28,.25),(.42,-.31,.29),pale),
      ("Spider wreck shattered optical hood",(.55,.64,1.10),(.54,.32,.32),(.38,.27,.52),lens),
      ("Spider wreck detached battery",-(-.2) if False else (-.32,-.18,.89),(.69,.48,.28),(.14,.39,-.31),dark),
      ("Spider wreck torn left rear joint",(-.88,-.91,.45),(.54,.39,.30),(.37,.24,-.42),copper),
      ("Spider wreck torn right forward joint",(.92,.86,.52),(.56,.39,.28),(.30,-.25,.40),iron),
      ("Spider wreck exposed central fracture",(-.08,.12,1.11),(.73,.53,.20),(.11,.23,-.17),copper),
      ("Spider wreck dislodged injector",(1.42,.12,.72),(.78,.23,.20),(.31,.21,.48),pale)
    ]
    for name,loc,size,angles,material in data:
        wreck.append(fragment(name,loc,size,angles,material,root))
    return root,body,shell,legs,attack,wreck

def pose(parts,state,facing):
    root,body,shell,legs,attack,wreck=parts
    root.rotation_euler.z=facing*math.tau/32
    body.location.z=.10 if state=="move" else -.18 if state=="destroyed" else 0
    body.rotation_euler.y=.045 if state=="move" else -.22 if state=="destroyed" else 0
    for i,leg in enumerate(legs):
        leg.rotation_euler.x=(.20 if i%2 else -.20) if state=="move" else 0
        leg.rotation_euler.y=(.13 if i%3==0 else -.13) if state=="move" else 0
        leg.location.z=.09 if state=="move" and i%2 else 0
        for o in leg.children_recursive:
            if o.type=="MESH":o.hide_render=state=="destroyed"
    for o in body.children_recursive:
        if o.type=="MESH":o.hide_render=False
    for o in attack:o.hide_render=state!="attack"
    for o in wreck:o.hide_render=state!="destroyed"
    if state=="destroyed":
        shell.hide_render=True
        for o in body.children_recursive:
            if o.type=="MESH" and any(t in o.name.lower() for t in
                ("command crest","sensor hood","rangefinder","optical slit","guidance rotor")):
                o.hide_render=True
    bpy.context.view_layer.update()

def main():
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    out=p.parse_args(argv).output.resolve();out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup();parts=build();pose(parts,"idle",0)
    source=out/"federation-spider-drone.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            path=out/"frames"/state/f"{facing:02d}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 facings",flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)
if __name__=="__main__":main()
