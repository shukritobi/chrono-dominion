#!/usr/bin/env python3
"""FED-VEH-003: original Iron Federation Shrapnel Carrier, 32-facing Blender pilot.

Purpose-built six-wheel anti-air halftrack silhouette with a twin elevated
rotary flak cradle, two independently elevating barrels, articulated roadwheels,
physical firing shutters and eight CLOSED irregular wreck fragments.
PREVIEW ONLY. No published textures, manifests or gameplay files are written.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")


def shard(name, loc, dimensions, angles, material, parent):
    """Original closed, asymmetric six-sided extrusion, not a box primitive."""
    x, y, z = dimensions
    outline = [(-.50,-.31),(-.29,-.52),(.28,-.45),(.54,-.08),
               (.32,.48),(-.41,.39)]
    vertices = [(u*x,v*y,-z/2) for u,v in outline]
    vertices += [(u*x,v*y,z/2) for u,v in outline]
    faces = [tuple(range(5,-1,-1)),tuple(range(6,12))]
    faces += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    obj = wedge(name,vertices,faces,material,parent)
    obj.location = loc
    obj.rotation_euler = angles
    obj["wreckage_only"] = True
    obj["closed_fracture"] = True
    obj.hide_render = True
    return obj


def build():
    iron = mat("Shrapnel iron red armour",(.43,.16,.14,1),.70)
    sand = mat("Shrapnel brass sandblasted plates",(.65,.46,.30,1),.62)
    graphite = mat("Shrapnel black ceramic chassis",(.045,.050,.056,1),.20)
    rubber = mat("Shrapnel rubber tyre",(.022,.027,.031,1),.05)
    copper = mat("Shrapnel hot copper muzzle",(.87,.44,.15,1),.48)
    glass = mat("Shrapnel amber rangefinder",(.95,.39,.06,1),.12,1.25)
    fracture = mat("Shrapnel exposed orange fractures",(.86,.37,.13,1),.20,.35)

    root = empty("FED-VEH-003 Iron Federation Shrapnel Carrier - original")
    chassis = empty("Independent six-wheel flak carrier undercarriage",root)
    cube("Shrapnel welded armoured tub",(-.08,0,.64),(3.52,1.69,.66),iron,chassis)
    cube("Shrapnel underbody black belly",(-.10,0,.34),(3.35,1.52,.22),graphite,chassis)
    wedge("Shrapnel original raked wedge nose",[
        (1.05,-.83,.41),(1.91,-.58,.41),(1.91,.58,.41),(1.05,.83,.41),
        (.94,-.79,1.12),(1.53,-.50,.83),(1.53,.50,.83),(.94,.79,1.12)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        sand,chassis)
    wedge("Shrapnel forward armoured driver cab",[
        (.42,-.70,.95),(1.38,-.70,.95),(1.38,.70,.95),(.42,.70,.95),
        (.50,-.53,1.73),(1.12,-.53,1.49),(1.12,.53,1.49),(.50,.53,1.73)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        iron,chassis)
    cube("Shrapnel forward roof visor",(.85,0,1.66),(.73,1.02,.13),sand,chassis)
    cube("Shrapnel frontal narrow observation port",(1.24,0,1.31),(.09,.78,.14),glass,chassis)
    cube("Shrapnel rear turret service platform",(-.76,0,1.10),(1.48,1.50,.21),graphite,chassis)
    for side in (-1,1):
        cube("Shrapnel segmented rear track fairing",(-.72,side*.89,.76),(1.85,.24,.37),iron,chassis)
        cube("Shrapnel lower rear track rail",(-.76,side*1.04,.24),(1.95,.16,.15),graphite,chassis)
        cube("Shrapnel flank blast shield",(-.58,side*.83,1.02),(1.13,.14,.28),sand,chassis)
        cube("Shrapnel amber flank recognition",(.85,side*.84,.92),(.42,.05,.10),glass,chassis)
        for x in (-1.34,-.57,.95):
            wheel = empty("Shrapnel independent articulated wheel",chassis,(x,side*.96,.35))
            cyl("Shrapnel rubber wheel",(0,0,0),.34,.23,rubber,wheel)
            cyl("Shrapnel machined wheel hub",(0,-side*.15,0),.17,.045,sand,wheel)
            for angle in (0,math.tau/3,2*math.tau/3):
                cube("Shrapnel rotating wheel spoke",
                     (.11*math.cos(angle),-side*.18,.11*math.sin(angle)),
                     (.13,.027,.044),iron,wheel)
            if side == -1:
                pass
            wheels.append(wheel)
        for x in (-1.35,-.96,-.57,-.18):
            cube("Shrapnel discrete halftrack steel cleat",
                 (x,side*1.11,.16),(.26,.11,.10),sand,chassis)
    cube("Shrapnel rear shell-feed magazine",(-1.38,0,1.25),(.40,1.04,.45),sand,chassis)
    for side in (-1,1):
        cube("Shrapnel rear extraction handle",(-1.68,side*.42,1.31),(.12,.13,.35),graphite,chassis)

    turret = empty("Shrapnel independent anti-air traverse ring",chassis,(-.55,0,1.28))
    cyl("Shrapnel armored rotating turntable",(0,0,0),.58,.20,graphite,turret,"Z")
    cube("Shrapnel tall central elevating breech",(.10,0,.40),(.74,.86,.68),iron,turret)
    cube("Shrapnel angled upper flak shield",(.25,0,.80),(.89,1.06,.22),sand,turret)
    for side in (-1,1):
        cube("Shrapnel flak breech housing",(.43,side*.37,.59),(.62,.29,.40),iron,turret)
        cube("Shrapnel rotary feed cassette",(-.10,side*.50,.45),(.44,.22,.48),sand,turret)
        cyl("Shrapnel independent flak barrel",(1.02,side*.39,.74),.13,1.37,graphite,turret,"X")
        cyl("Shrapnel muzzle perforated brake",(1.64,side*.39,.74),.19,.27,copper,turret,"X")
        for x in (.80,1.09,1.38):
            cube("Shrapnel barrel ventilated cooling collar",
                 (x,side*.39,.74),(.12,.33,.31),sand,turret)
    cube("Shrapnel anti-air targeting array",(-.27,-.35,.97),(.39,.27,.27),glass,turret)
    cyl("Shrapnel optical ranging periscope",(-.29,-.35,1.18),.075,.38,graphite,turret,"Z")
    muzzle = [
        cube("Shrapnel attack-only physical muzzle bloom",(1.91,side*.39,.74),
             (.37,.36,.37),glass,turret) for side in (-1,1)
    ]
    for obj in muzzle:
        obj.hide_render = True

    wreck = [
        shard("Shrapnel wreck torn cab roof",(.84,-.56,1.57),(.99,.48,.19),(.30,.23,-.37),sand,root),
        shard("Shrapnel wreck detached left flak tube",(.72,-.91,1.45),(1.53,.31,.25),(.21,-.28,-.64),graphite,root),
        shard("Shrapnel wreck detached right flak tube",(-.39,.80,1.63),(1.35,.30,.23),(.43,.14,.52),copper,root),
        shard("Shrapnel wreck twisted flak shield",(-.76,-.66,1.52),(.93,.57,.21),(.51,.30,-.36),iron,root),
        shard("Shrapnel wreck shattered turntable",(-.51,.39,1.30),(.71,.60,.29),(.18,-.29,.24),fracture,root),
        shard("Shrapnel wreck broken rear ammunition box",(-1.41,.61,1.26),(.65,.37,.45),(.21,.34,.42),sand,root),
        shard("Shrapnel wreck ruptured front wheel guard",(1.15,-.91,.64),(.71,.33,.40),(.30,-.21,-.36),iron,root),
        shard("Shrapnel wreck exposed hull breach",(.30,-.25,1.02),(.85,.62,.23),(.13,.15,.33),fracture,root),
    ]
    return root,chassis,turret,wheels,muzzle,wreck


def apply_pose(parts,state,facing):
    root,chassis,turret,wheels,muzzle,wreck=parts
    root.rotation_euler=(0,0,facing*math.tau/32)
    chassis.location.z=.085 if state=="move" else 0
    chassis.rotation_euler=(0,.055 if state=="move" else -.18 if state=="destroyed" else 0,0)
    turret.rotation_euler.z=.19 if state=="attack" else -.52 if state=="destroyed" else 0
    turret.rotation_euler.y=-.14 if state=="attack" else -.27 if state=="destroyed" else 0
    for wheel in wheels:
        wheel.rotation_euler.y=.75 if state=="move" else 0
    for obj in chassis.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    for obj in muzzle:
        obj.hide_render=state=="attack" and False or True
        if state=="attack":
            obj.hide_render=False
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        for obj in turret.children_recursive:
            if obj.type=="MESH":
                obj.hide_render=True
        for obj in chassis.children_recursive:
            if obj.type=="MESH" and any(s in obj.name.lower() for s in
                 ("driver cab","forward roof visor","rear shell-feed magazine")):
                obj.hide_render=True
    bpy.context.view_layer.update()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    args=parser.parse_args(argv)
    out=args.output.resolve()
    out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup()
    parts=build()
    apply_pose(parts,"idle",0)
    source=out/"federation-shrapnel-carrier.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts,state,facing)
            path=out/"frames"/state/f"{facing:02d}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 directions",flush=True)
    print("PREVIEW_ONLY",source,"128 transparent 160px RGBA frames",flush=True)


if __name__=="__main__":
    main()
