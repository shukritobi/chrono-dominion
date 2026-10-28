#!/usr/bin/env python3
"""COA-VEH-005 Coalition Camouflage Hunter: original preview-only Blender model.

A low tracked reconnaissance tank with four *physical* hinged adaptive vanes,
a split faceted hull, exposed optics and asymmetric broken geometry. Generates
32 facings x idle/move/attack/destroyed. Never touches game textures/manifests.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

FACINGS = 32
STATES = ("idle", "move", "attack", "destroyed")


def fracture(name, loc, dim, angles, material, parent):
    """Editable CLOSED, asymmetric extruded five-sided fracture (not a box)."""
    x, y, z = dim
    outline = [(-.50,-.46),(.24,-.50),(.53,-.12),(.31,.49),(-.44,.31)]
    vertices = [(u*x,v*y,-z/2) for u,v in outline]
    vertices += [(u*x,v*y,z/2) for u,v in outline]
    faces = [tuple(range(4,-1,-1)), tuple(range(5,10))]
    faces += [(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)]
    obj = wedge(name,vertices,faces,material,parent)
    obj.location = loc
    obj.rotation_euler = angles
    obj["wreckage_only"] = True
    obj["fracture_closed"] = True
    obj.hide_render = True
    return obj


def build():
    blue = mat("Hunter graphite-blue ceramic armor",(.13,.29,.40,1),.68)
    light = mat("Hunter brushed silver camo edges",(.48,.67,.69,1),.61)
    dark = mat("Hunter carbon track bed",(.032,.052,.068,1),.22)
    rubber = mat("Hunter muted elastomer track",(.025,.037,.043,1),.04)
    jade = mat("Hunter subtle adaptive optics",(.16,.65,.62,1),.12,.65)
    amber = mat("Hunter exposed copper fracture",(.67,.34,.18,1),.35,.20)
    flash = mat("Hunter restrained projection pulse",(.21,.76,.78,1),.04,1.4)

    root = empty("Coalition Camouflage Hunter COA-VEH-005 original 32 facing")
    hull = empty("Hunter independent tracked suspension",root)
    cube("Hunter low armored carbon keel",(-.15,0,.63),(2.90,1.61,.53),blue,hull)
    cube("Hunter dark belly armor",(-.17,0,.37),(2.73,1.49,.24),dark,hull)
    wedge("Hunter closed faceted arrow prow",[
        (.72,-.78,.44),(1.70,-.39,.44),(1.70,.39,.44),(.72,.78,.44),
        (.64,-.73,1.02),(1.37,-.31,.78),(1.37,.31,.78),(.64,.73,1.02)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        light,hull)
    wedge("Hunter offset armored optical canopy",[
        (-1.20,-.55,.97),(.57,-.55,.97),(.57,.53,.97),(-1.20,.53,.97),
        (-.98,-.39,1.47),(.29,-.35,1.33),(.29,.41,1.33),(-.98,.41,1.47)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        blue,hull)
    cube("Hunter offset hatch optical slit",(-.51,-.49,1.28),
         (.91,.075,.09),jade,hull)
    cube("Hunter rear stealth heatsink",(-1.33,.22,1.08),
         (.34,.82,.35),light,hull)
    cube("Hunter asymmetric left roof baffle",(-.78,-.54,1.50),
         (.65,.16,.14),dark,hull)

    wheels,cleats = [],[]
    for side in (-1,1):
        y=side*.89
        cube("Hunter split outer track fender",(-.18,side*.89,.73),
             (2.84,.20,.39),blue,hull)
        cube("Hunter exposed track rail",(-.20,side*1.04,.36),
             (2.81,.15,.13),dark,hull)
        for x in (-1.16,-.38,.40,1.18):
            wheel=empty("Hunter independently articulated roadwheel",hull,(x,side*.98,.37))
            wheels.append(wheel)
            cyl("Hunter dark rubber roadwheel",(0,0,0),.32,.21,rubber,wheel)
            cyl("Hunter faceted wheel hub",(0,side*.12,0),.17,.04,light,wheel)
            for k in range(3):
                a=k*math.tau/3
                cube("Hunter readable rotating hub spoke",
                     (.105*math.cos(a),side*.145,.105*math.sin(a)),
                     (.13,.045,.05),blue,wheel)
        for j in range(12):
            x=-1.41+j*.25
            pad=cube("Hunter independent segmented tread cleat",
                     (x,side*1.055,.23),(.17,.23,.11),rubber,hull)
            cleats.append((pad,x))
        wedge("Hunter outward tapered track skirt",[
            (-1.43,-.14,.46),(1.34,-.14,.46),(1.34,.14,.46),(-1.43,.14,.46),
            (-1.30,-.12,.91),(1.05,-.12,.82),(1.05,.12,.82),(-1.30,.12,.91)],
            [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
            blue,hull).location.y=side*1.05

    turret=empty("Hunter rotating adaptive-optic turret",hull,(-.17,0,1.34))
    cyl("Hunter angular rotating optic pedestal",(0,0,.02),.44,.19,dark,turret,"Z")
    cube("Hunter compact prismatic emitter cradle",(.22,0,.24),
         (1.05,.76,.42),light,turret)
    cube("Hunter slanted ceramic emitter armor",(-.26,0,.45),
         (.58,.66,.27),blue,turret)
    cyl("Hunter original dual-spectrum projector",(.95,0,.24),
        .16,1.11,dark,turret,"X")
    cyl("Hunter front emitter aperture",(1.53,0,.24),
        .21,.14,jade,turret,"X")
    cube("Hunter offset rangefinder eye",(.37,-.44,.49),
         (.27,.17,.18),jade,turret)

    vanes=[]
    for i,(x,side) in enumerate(((-.42,-1),(.49,-1),(-.42,1),(.49,1))):
        pivot=empty("Hunter independent optical camouflage vane hinge",
                    turret,(x,side*.43,.51))
        vanes.append(pivot)
        wedge("Hunter nonrectangular layered adaptive camouflage fin",[
            (-.44,0,-.07),(.42,0,-.07),(.42,side*.42,-.07),(-.44,side*.42,-.07),
            (-.35,0,.13),(.20,0,.22),(.20,side*.39,.22),(-.35,side*.39,.13)],
            [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
            light if i%2 else blue,pivot)
        cube("Hunter thin passive spectral vane trace",(.06,side*.31,.20),
             (.32,.06,.05),jade,pivot)
        cyl("Hunter visible physical hinge bearing",(0,0,0),.10,.21,dark,pivot,"Y")

    effects=[
        cube("Hunter attack-only focused forward pulse",(2.03,0,.24),
             (.53,.26,.24),flash,turret),
        cube("Hunter attack-only split pulse sideband",(1.89,-.28,.24),
             (.39,.13,.12),jade,turret),
        cube("Hunter attack-only split pulse sideband",(1.89,.28,.24),
             (.39,.13,.12),jade,turret),
    ]
    for obj in effects:
        obj.hide_render=True
        obj["attack_only"]=True

    wreck_specs=[
        ("broken forward canopy",(.88,-.59,1.05),(.91,.53,.25),(.18,.48,-.37),light),
        ("torn left spectral fin",(-.33,-1.02,1.55),(.86,.39,.24),(.34,.37,-.49),blue),
        ("torn right spectral fin",(.50,1.02,1.44),(.91,.38,.23),(-.22,.49,.33),light),
        ("detached optical turret hood",(-.38,-.73,1.66),(.82,.51,.34),(.40,-.23,-.48),blue),
        ("split projector muzzle",(1.49,-.62,1.20),(.59,.38,.34),(.24,.64,-.42),light),
        ("severed front rail",(.96,.85,.66),(.89,.30,.24),(-.21,.26,.36),blue),
        ("shattered port track skirt",(-.82,-1.15,.55),(1.06,.32,.26),(.23,-.32,.42),blue),
        ("shattered starboard track skirt",(-.11,1.21,.56),(1.01,.32,.27),(-.31,.22,-.33),blue),
        ("exposed warm reactor split",(-1.20,-.19,1.12),(.56,.48,.28),(.30,.35,-.14),amber),
        ("buckled rear engine shroud",(-1.29,.52,1.30),(.67,.43,.33),(-.25,.36,.32),light),
        ("fallen emitter guard",(1.43,.48,1.13),(.54,.41,.25),(.41,-.31,.38),blue),
        ("twisted sensor bracket",(-.39,-.94,1.70),(.46,.23,.31),(.32,.39,-.45),light),
        ("detached front optic",(.62,-1.08,.80),(.42,.32,.28),(.37,.46,-.32),jade),
        ("fractured belly armor",(.37,.14,.44),(.94,.62,.23),(.23,-.38,.29),dark),
    ]
    wreck=[fracture("Hunter wreckage "+label,loc,dim,rot,material,root)
           for label,loc,dim,rot,material in wreck_specs]
    return root,hull,turret,wheels,cleats,vanes,effects,wreck


def pose(parts,state,facing):
    root,hull,turret,wheels,cleats,vanes,effects,wreck=parts
    root.rotation_euler=(0,0,facing*math.tau/FACINGS)
    hull.location.z=.11 if state=="move" else -.08 if state=="destroyed" else 0
    hull.rotation_euler.y=.045 if state=="move" else .13 if state=="destroyed" else 0
    turret.rotation_euler.z=.12 if state=="attack" else -.045 if state=="move" else 0
    for i,wheel in enumerate(wheels):
        wheel.rotation_euler.y=.70 if state=="move" else 0
    for i,(pad,x) in enumerate(cleats):
        pad.location.x=x+(.085 if state=="move" and i%2 else 0)
    for i,vane in enumerate(vanes):
        side=-1 if i<2 else 1
        vane.rotation_euler=(side*(.34 if state=="attack" else .16 if state=="move" else 0),
                             (.23 if state=="attack" else -.11 if state=="move" else 0),0)
    for obj in hull.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    for obj in effects:
        obj.hide_render=state!="attack"
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        # The intact signature parts actually disappear. The saved wreckage
        # pieces occupy different world positions; no emission-only damage.
        for obj in hull.children_recursive:
            if obj.type=="MESH" and any(s in obj.name.lower() for s in (
                "optical canopy","adaptive camouflage fin","spectral vane trace",
                "projector","emitter aperture","emitter cradle","emitter armor",
                "rangefinder","outer track fender","tapered track skirt",
                "rear stealth heatsink","optical slit")):
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
    source=out/"coalition-camouflage-hunter.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(FACINGS):
            pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,FACINGS,flush=True)
    print("PREVIEW ONLY",source,"128 original RGBA frames",flush=True)


if __name__=="__main__":
    main()
