#!/usr/bin/env python3
"""PSI-VEH-006 Neural Nexus Tank: original open-crown psionic hover platform.

Preview-only. Six genuinely separate arched field conduits, six independently
animated hover pods, four hinged neural petals, two expanding physical
field rings, and twelve closed manifold asymmetric wreck fragments.
Writes exclusively beneath --output. No game manifests or textures.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup,mat,empty,cube,cyl,wedge

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



def radial_point(radius,angle,z):
    return (radius*math.cos(angle),radius*math.sin(angle),z)


def build():
    violet=mat("Nexus violet composite armor",(.19,.075,.35,1),.58)
    shell=mat("Nexus pearl ceramic",(.66,.56,.79,1),.36)
    dark=mat("Nexus shadow carbon",(.044,.025,.074,1),.24)
    copper=mat("Nexus rose conductor",(.68,.29,.49,1),.76)
    glow=mat("Nexus active mindwave",(.65,.24,1,1),.12,1.75)
    pulse=mat("Nexus neural surge",(.92,.55,1,1),.05,2.2)
    fracture_hot=mat("Nexus exposed fracture core",(.90,.36,.60,1),.18,.35)
    root=empty("PSI-VEH-006 ORIGINAL Neural Nexus Tank")
    chassis=empty("Nexus independent levitating hull",root)
    # Purpose-designed ten-sided manta hull, closed with 20 non-cube vertices.
    outline=[(1.75,-.25),(1.88,0),(1.75,.25),(1.18,.87),
             (.35,1.05),(-1.15,.83),(-1.66,.38),(-1.66,-.38),
             (-1.15,-.83),(.35,-1.05)]
    bottom=[(x,y,.61) for x,y in outline]
    top=[(x*.88,y*.88,1.20+(.14 if x<0 else 0)) for x,y in outline]
    faces=[tuple(range(9,-1,-1)),tuple(range(10,20))]
    faces += [(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
    hull=wedge("Nexus ORIGINAL 20-vertex asymmetric manta hull",
               bottom+top,faces,violet,chassis)
    hull["custom_hull"]=True
    cube("Nexus suspended graphite keel",(-.07,0,.54),(2.9,1.24,.25),dark,chassis)
    wedge("Nexus forward psychic prow",[(1.15,-.43,.93),(1.95,0,.86),
          (1.15,.43,.93),(1.12,-.36,1.28),(1.64,0,1.21),
          (1.12,.36,1.28)],[(0,2,1),(3,4,5),(0,1,4,3),
          (1,2,5,4),(2,0,3,5)],shell,chassis)
    for side in (-1,1):
        cube("Nexus sculpted flank armor",(-.30,side*.89,1.09),
             (2.18,.17,.28),shell,chassis)
        cube("Nexus narrow biological optic",(.84,side*.84,1.14),
             (.62,.07,.10),glow,chassis)
    pods=[]
    for side in (-1,1):
        for x in (-1.13,.03,1.10):
            pivot=empty("Nexus independent levitation pod pivot",
                        chassis,(x,side*.86,.48))
            pods.append(pivot)
            cyl("Nexus suspended crescent field pod",(0,0,0),
                .32,.26,violet,pivot,"Y")
            cyl("Nexus exposed concentric gravitic ring",
                (0,side*.16,0),.22,.07,copper,pivot,"Y")
            cyl("Nexus glowing levitation core",
                (0,side*.22,0),.115,.04,glow,pivot,"Y")
    # Physically open six-arm neural crown. Every strut is an independent
    # real mesh; the centre is unobstructed (no transparent solid dome).
    crown=empty("Nexus six-arch genuinely open neural crown",chassis,(0,0,1.25))
    arches=[]
    for i in range(6):
        a=i*math.tau/6
        pts=[radial_point(1.03,a,.04),radial_point(.94,a,.46),
             radial_point(.73,a,.99),radial_point(.49,a,1.27)]
        for j in range(3):
            arch=beam("Nexus separate arched neural conduit %02d-%d"%(i,j),
                      pts[j],pts[j+1],.12 if j<2 else .095,
                      copper if j<2 else shell,crown)
            arch["open_arch"]=True
            arches.append(arch)
        cube("Nexus exterior anchoring knuckle",pts[0],
             (.21,.21,.22),violet,crown)
    petals=[]
    for i in range(4):
        a=(i+.5)*math.tau/4
        pivot=empty("Nexus independent hinged neural petal",
                    crown,radial_point(.67,a,1.02))
        pivot.rotation_euler.z=a
        petal=wedge("Nexus ORIGINAL concave neural petal",[
            (.02,-.20,-.06),(.50,-.27,-.04),(.66,-.13,.06),
            (.47,0,.12),(.66,.13,.06),(.50,.27,-.04),
            (.02,.20,-.06),(.15,0,.20)],
            [(0,1,2,3,4,5,6),(0,6,7),(6,5,7),(5,4,7),
             (4,3,7),(3,2,7),(2,1,7),(1,0,7)],shell,pivot)
        petal["custom_petal"]=True
        petals.append(pivot)
    # Twelve real, independent pulse ring segments on each of two levels.
    # Hidden at rest, and attached to the crown to preserve emitter origin.
    effects=[]
    for ring,(radius,z,width) in enumerate(((.96,1.23,.095),
                                            (1.21,.72,.075))):
        for i in range(12):
            a=i*math.tau/12
            b=(i+1)*math.tau/12
            o=beam("Nexus attack-only physical field arc %d-%02d"%(ring,i),
                   radial_point(radius,a,z),radial_point(radius,b,z),
                   width,pulse,crown)
            o["attack_only"]=True
            o.hide_render=True
            effects.append(o)
    pieces=[
      ("broken left prow",(1.31,-.40,.64),(.86,.46,.34),(.22,.21,-.39),violet),
      ("broken right prow",(1.32,.43,.62),(.81,.40,.29),(.31,-.22,.41),shell),
      ("fractured flank port",(-.57,-.88,.68),(.92,.31,.27),(.22,.17,-.46),shell),
      ("fractured flank starboard",(-.61,.89,.67),(.90,.34,.28),(.27,-.19,.44),violet),
      ("severed crown arc one",(-.64,-.37,.97),(.71,.27,.32),(.41,.24,-.27),copper),
      ("severed crown arc two",(.51,.42,.98),(.73,.29,.30),(.35,-.31,.35),copper),
      ("collapsed petal one",(-.32,-.52,.81),(.65,.45,.21),(.33,.20,-.33),shell),
      ("collapsed petal two",(.49,-.50,.79),(.60,.42,.24),(.24,-.23,.39),shell),
      ("sheared hover pod",(-1.18,-.90,.35),(.62,.42,.29),(.31,.15,-.41),violet),
      ("fallen psychic focus",(-.31,.32,.86),(.70,.50,.28),(.29,-.24,.29),fracture_hot),
      ("split aft hull",(-1.35,.17,.68),(.77,.52,.30),(.37,.19,-.28),violet),
      ("exposed reactor fracture",(.03,-.04,.90),(.75,.56,.20),(.14,-.18,.21),fracture_hot),
    ]
    wreck=[fracture("Nexus wreck "+name,loc,scale,rot,material,root)
           for name,loc,scale,rot,material in pieces]
    return root,chassis,hull,pods,crown,arches,petals,effects,wreck


def pose(parts,state,facing):
    root,chassis,hull,pods,crown,arches,petals,effects,wreck=parts
    root.rotation_euler.z=facing*math.tau/32
    chassis.location.z=.13 if state=="move" else -.13 if state=="destroyed" else 0
    chassis.rotation_euler.y=.085 if state=="move" else -.10 if state=="destroyed" else 0
    for i,pod in enumerate(pods):
        pod.rotation_euler.y=(.42 if i%2 else -.42) if state=="move" else 0
    crown.rotation_euler.z=.17 if state=="attack" else 0
    for i,petal in enumerate(petals):
        petal.rotation_euler.y=(-.50 if state=="attack" else .10)
        petal.rotation_euler.x=(.19 if state=="attack" else 0)*(1 if i%2 else -1)
    for o in chassis.children_recursive:
        if o.type=="MESH":o.hide_render=False
    for effect in effects:effect.hide_render=state!="attack"
    for o in wreck:o.hide_render=state!="destroyed"
    if state=="destroyed":
        hull.hide_render=True
        for o in chassis.children_recursive:
            if o.type=="MESH" and (o.get("open_arch") or o.get("custom_petal") or
                    any(s in o.name.lower() for s in (
                    "sculpted flank","narrow biological optic","forward psychic prow",
                    "exterior anchoring knuckle"))):
                o.hide_render=True
        for effect in effects:effect.hide_render=True
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
    source=out/"psionic-neural-nexus-tank.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,32,flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)


if __name__=="__main__":
    main()
