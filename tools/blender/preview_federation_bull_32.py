#!/usr/bin/env python3
"""Federation Bull Heavy Tank (FED-VEH-002): original 32-facing Blender P0 preview.

A brutal, wide, siege-oriented tank with 14 independent roadwheel pivots,
24 animated cleats, a thick electrothermal cannon, exposed engine exhausts
and eight independent destroyed-state wreckage meshes. Never publishes art.
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
    red = mat("Bull oxide red hardened steel", (.41,.16,.14,1), .72)
    rust = mat("Bull copper red applique armour", (.62,.32,.23,1), .56)
    pale = mat("Bull dusty sand edge armor", (.69,.57,.42,1), .52)
    dark = mat("Bull gunmetal internal machinery", (.045,.05,.058,1), .30)
    track = mat("Bull track black steel", (.024,.029,.033,1), .20)
    bronze = mat("Bull brushed brass actuator", (.62,.42,.21,1), .62)
    amber = mat("Bull warning lamp amber", (1,.41,.09,1), .10, 2.1)
    fracture = mat("Bull exposed hot reactor orange", (1,.22,.04,1), .05, 2.7)

    root = empty("Federation Bull Heavy Tank - original P0 art pilot")
    hull = empty("Bull independent tracked chassis", root)
    cube("Massive low siege hull", (0,0,.72), (3.49,1.78,.77), red, hull)
    cube("Recessed black belly pan", (-.07,0,.36), (3.24,1.58,.25), dark, hull)
    wedge("Bull original slab angled battering ram glacis", [
        (.85,-.86,.62),(1.88,-.67,.61),(1.88,.67,.61),(.85,.86,.62),
        (.75,-.78,1.27),(1.45,-.54,1.03),(1.45,.54,1.03),(.75,.78,1.27)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        rust,hull)
    cube("Federation reinforced prow breaker", (1.80,0,.56), (.32,1.32,.39), pale,hull)
    cube("Sunken engine roof", (-1.10,0,1.16), (1.16,1.46,.29),dark,hull)
    for side in (-1,1):
        cube("Wide angular armored track shroud", (-.06,side*.95,.84),
             (3.32,.31,.58),red,hull)
        cube("Segmented sand colored track lip", (.13,side*1.09,1.10),
             (2.74,.16,.12),pale,hull)
        for x in (-1.34,-.90,-.46,-.02,.42,.86,1.30):
            cube("Bull independent side armor block", (x,side*1.13,.87),
                 (.34,.10,.25),rust,hull)
        cube("Rear blast vent shield", (-1.52,side*.53,1.28),
             (.29,.34,.25),bronze,hull)
        cyl("Twin rear vertical smoke stack",(-1.39,side*.46,1.63),
            .16,.75,dark,hull,"Z")
        cyl("Twin smoke stack bright steel lip",(-1.39,side*.46,2.04),
            .19,.09,bronze,hull,"Z")
        cube("Forward amber slit warning", (1.66,side*.45,.91),
             (.13,.28,.10),amber,hull)

    wheels=[]
    cleats=[]
    for side in (-1,1):
        cube("Continuous inset track belt",(-.03,side*.98,.43),
             (3.52,.32,.55),track,hull)
        for x in (-1.38,-.92,-.46,0,.46,.92,1.38):
            pivot=empty("Bull independent roadwheel pivot",hull,(x,side*1.16,.42))
            wheels.append(pivot)
            cyl("Bull heavy machined roadwheel",(0,0,0),.245,.15,dark,pivot)
            cyl("Bull exposed copper wheel hub",(0,-side*.10,0),.135,.055,bronze,pivot)
            for angle in (0,math.tau/3,2*math.tau/3):
                cube("Bull roadwheel radial spoke",
                     (.087*math.cos(angle),-side*.145,.087*math.sin(angle)),
                     (.12,.024,.038),pale,pivot)
        for i in range(12):
            x=-1.47+i*.265
            cleat=cube("Bull individually animated track cleat",
                       (x,side*1.205,.24),(.18,.09,.20),track,hull)
            cleats.append((cleat,x))
        cube("Heavy track front tooth",(1.58,side*.98,.64),
             (.36,.37,.34),rust,hull)

    turret=empty("Bull independent block turret and bearing",hull,(-.18,0,1.16))
    cyl("Massive bronze rotating turret race",(0,0,.08),.71,.22,bronze,turret,"Z")
    cube("Bull tall armored turret casting",(.06,0,.46),(1.62,1.49,.68),red,turret)
    cube("Overhanging turret roof slab",(-.12,0,.86),(1.49,1.46,.19),pale,turret)
    cube("Square armored front gun shield",(.84,0,.47),(.31,1.22,.60),rust,turret)
    for side in (-1,1):
        cube("Asymmetric turret side armor chevron",
             (-.22,side*.80,.48),(.92,.19,.40),rust,turret)
        cube("Turret side ammo service hatch",
             (-.57,side*.91,.49),(.36,.075,.25),dark,turret)
    cube("Commander heavy observation cupola",(-.56,-.39,1.03),
         (.52,.43,.24),red,turret)
    cyl("Bull low commander sensor glass",(-.56,-.39,1.20),
        .20,.13,amber,turret,"Z")
    cube("Rear ballistic counterweight",(-.90,.22,.52),
         (.46,.76,.40),dark,turret)

    gun=empty("Bull electrothermal main cannon recoil assembly",turret,(.82,0,.48))
    cube("Thick electrothermal breech",(.15,0,0),(.66,.56,.46),dark,gun)
    cyl("Bull single oversized electrothermal cannon",(1.00,0,0),
        .225,1.65,rust,gun,"X")
    cyl("Bull distinctive thick barrel thermal sleeve",(1.38,0,0),
        .285,.40,pale,gun,"X")
    cyl("Bull muzzle brake square-collar",(1.87,0,0),
        .31,.27,dark,gun,"X")
    cyl("Bull glowing hot muzzle bore",(2.04,0,0),
        .12,.05,amber,gun,"X")
    for x in (.60,.95,1.25):
        cube("Cannon exterior cooling rib",(x,-.24,.20),
             (.20,.13,.08),bronze,gun)
    flash=cube("Attack-only electrothermal muzzle burst",(2.44,0,0),
               (.71,.31,.32),amber,gun)
    flash.hide_render=True
    ring=cyl("Attack-only plasma shock collar",(2.12,0,0),
             .39,.08,fracture,gun,"X")
    ring.hide_render=True

    wreck=[
        cube("Wreckage sheared heavy turret armor",(.38,-.65,1.50),
             (1.40,.79,.37),red,root,True),
        cube("Wreckage snapped short siege gun",(1.20,-1.05,1.12),
             (1.35,.27,.29),dark,root,True),
        cube("Wreckage displaced square gun shield",(.89,.85,1.27),
             (.72,.62,.29),rust,root,True),
        cube("Wreckage burning open engine compartment",(-1.12,-.10,1.27),
             (.78,.68,.42),fracture,root,True),
        cube("Wreckage torn left side armor",(-.63,-1.09,1.22),
             (1.08,.27,.40),pale,root,True),
        cube("Wreckage twisted right track",(.32,1.15,.72),
             (1.14,.30,.35),bronze,root,True),
        cube("Wreckage broken smoke exhaust stack",(-1.34,.65,1.67),
             (.27,.23,.79),dark,root,True),
        cube("Wreckage exposed cracked turret bearing",(.02,.17,1.31),
             (.59,.59,.28),fracture,root,True),
    ]
    for obj,angles in zip(wreck,(
        (.27,.29,-.44),(.21,-.40,-.37),(.29,.23,.44),(.10,-.24,.18),
        (.36,.22,-.30),(.22,-.31,.37),(.48,-.35,.49),(.17,.30,-.16))):
        obj.rotation_euler=angles
    return root,hull,turret,gun,wheels,cleats,flash,ring,wreck


def apply_pose(parts,state,facing):
    root,hull,turret,gun,wheels,cleats,flash,ring,wreck=parts
    root.rotation_euler=(0,0,facing*math.tau/32)
    hull.location.z=.105 if state=="move" else -.13 if state=="destroyed" else 0
    hull.rotation_euler=(0,.043 if state=="move" else .13 if state=="destroyed" else 0,0)
    turret.rotation_euler.z=-.13 if state=="attack" else .035 if state=="move" else 0
    gun.rotation_euler.y=-.08 if state=="attack" else 0
    gun.location.x=.65 if state=="attack" else .82
    for wheel in wheels:
        wheel.rotation_euler.y=.81 if state=="move" else 0
    for cleat,x in cleats:
        cleat.location.x=x+(.12 if state=="move" else 0)
    for obj in hull.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    flash.hide_render=state!="attack"
    ring.hide_render=state!="attack"
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        for obj in hull.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "turret casting","turret roof","front gun shield",
                "turret side armor","ammo service hatch","commander",
                "ballistic counterweight","electrothermal cannon",
                "thermal sleeve","muzzle brake","muzzle bore",
                "cannon exterior cooling","electrothermal breech",
                "smoke stack bright steel lip","twin rear vertical smoke stack")):
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
    source=out/"federation-bull-heavy-tank.blend"
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
