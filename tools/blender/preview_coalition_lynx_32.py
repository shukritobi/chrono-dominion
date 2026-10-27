#!/usr/bin/env python3
"""Coalition Lynx Battle Tank: original P0 tracked MBT, preview-only Blender source.

One long-bore electromagnetic cannon, asymmetrical commander optic, layered
chevron glacis, moving roadwheels/tread cleats and eight independent wreck
meshes. Produces 32 facings x four states; never touches live game art.
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
    blue = mat("Lynx deep blue titanium hull", (.15, .34, .49, 1), .72)
    white = mat("Lynx ice-white ceramic plates", (.63, .78, .84, 1), .55)
    shadow = mat("Lynx graphite internal frame", (.035, .058, .079, 1), .28)
    rubber = mat("Lynx articulated dark tracks", (.027, .033, .041, 1), .10)
    cyan = mat("Lynx electromagnetic azure", (.07, .82, 1, 1), .10, 2.5)
    teal = mat("Lynx small telemetry light", (.15, 1, .71, 1), .10, 1.5)
    brass = mat("Lynx exposed brass heat exchanger", (.68, .43, .23, 1), .46)
    ember = mat("Lynx fractured hot reactor", (1, .25, .07, 1), .10, 2.2)

    root = empty("Coalition Lynx Battle Tank - original P0 32-facing")
    running = empty("Lynx articulated tracked lower hull", root)
    cube("Wide titanium lower hull", (0, 0, .67), (3.18, 1.61, .56), blue, running)
    cube("Undercarriage blast tray", (-.10, 0, .34), (2.95, 1.47, .20), shadow, running)
    wedge("Original two-stage sloping chevron glacis", [
        (.50,-.79,.63),(1.69,-.53,.59),(1.69,.53,.59),(.50,.79,.63),
        (.44,-.72,1.15),(1.25,-.38,.96),(1.25,.38,.96),(.44,.72,1.15)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        white, running)
    cube("Raised rear engine deck", (-1.03,0,1.05), (1.17,1.32,.35), blue, running)
    for side in (-1,1):
        cube("Ceramic flank anti-spall skirt", (-.10,side*.86,.83),
             (2.89,.20,.52),white,running)
        cube("Long blue skirt reinforcement", (-.09,side*1.005,1.02),
             (2.38,.09,.11),blue,running)
        cube("Front high-visibility rangefinder", (1.46,side*.31,.81),
             (.14,.29,.09),cyan,running)
        cube("Engine heat extraction grille", (-1.22,side*.36,1.25),
             (.43,.24,.065),shadow,running)
        for x in (-1.10,-.66,-.22,.22,.66,1.10):
            cube("Individually replaceable reactive side tile",
                 (x,side*1.045,.93),(.35,.075,.24),blue,running)
    wheels=[]
    cleats=[]
    for side in (-1,1):
        cube("Continuous visible rubber track belt", (0,side*.95,.45),
             (3.13,.28,.49),rubber,running)
        for x in (-1.20,-.72,-.24,.24,.72,1.20):
            pivot=empty("Independent roadwheel pivot",running,(x,side*1.115,.44))
            wheels.append(pivot)
            cyl("Lynx roadwheel tyre", (0,0,0),.245,.13,shadow,pivot)
            cyl("Lynx machined alloy hub", (0,-side*.09,0),.132,.055,white,pivot)
            for angle in (0, math.tau/3, 2*math.tau/3):
                cube("Lynx radial wheel spoke",
                     (.082*math.cos(angle),-side*.125,.082*math.sin(angle)),
                     (.115,.025,.042),brass,pivot)
        for i in range(11):
            x=-1.36+i*.27
            cleat=cube("Independent animated tread cleat",
                       (x,side*1.122,.30),(.18,.08,.24),rubber,running)
            cleats.append((cleat,x))
        cube("Angular forward track guard", (1.42,side*.99,.70),
             (.36,.38,.27),blue,running)
        cube("Rear drive sprocket armour", (-1.40,side*.99,.70),
             (.37,.37,.28),white,running)

    turret=empty("Lynx independently traversing single-cannon turret",running,
                 (-.15,0,1.10))
    cyl("Turret low rotating collar", (0,0,.09),.61,.20,shadow,turret,"Z")
    cube("Broad faceted turret cheek", (.05,0,.42),(1.44,1.30,.54),blue,turret)
    wedge("Original angular turret front mantlet", [
        (.43,-.65,.23),(.92,-.42,.26),(.92,.42,.26),(.43,.65,.23),
        (.31,-.57,.77),(.78,-.36,.64),(.78,.36,.64),(.31,.57,.77)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        white,turret)
    cube("Distinctive pale turret roof", (-.16,0,.74),(1.03,1.01,.14),white,turret)
    cube("Left commander cupola", (-.29,-.39,.92),(.46,.40,.26),blue,turret)
    cyl("Commander panoramic optic", (-.27,-.39,1.12),.19,.15,cyan,turret,"Z")
    cube("Rear asymmetrical ammunition pod", (-.69,.27,.44),(.58,.56,.36),shadow,turret)
    cube("Rear ammunition access cover", (-.78,.28,.65),(.45,.48,.09),brass,turret)
    for side in (-1,1):
        cube("Turret side reactive wedge", (-.06,side*.70,.44),
             (.77,.16,.30),white,turret)
        cube("Laser warning detector", (.51,side*.47,.76),
             (.17,.16,.12),teal,turret)
    barrel=empty("Elevating electromagnetic single gun and recoil mount",turret,
                 (.63,0,.43))
    cube("Gun articulated breech", (.18,0,0),(.59,.43,.37),shadow,barrel)
    cyl("Single long-bore electromagnetic cannon", (1.04,0,0),
        .155,1.78,blue,barrel,"X")
    cyl("Single bright muzzle shroud", (1.98,0,0),
        .21,.32,white,barrel,"X")
    cyl("Cannon central ion aperture", (2.17,0,0),
        .105,.05,cyan,barrel,"X")
    for x in (.76,1.10,1.44):
        cube("Cannon external cooling rail", (x,-.17,.13),
             (.32,.09,.10),brass,barrel)
    flash=cube("Attack-only lance-shaped ion blast", (2.61,0,0),
               (.78,.21,.23),cyan,barrel)
    flash.hide_render=True
    pulse=cyl("Attack-only ion muzzle halo", (2.28,0,0),
              .32,.09,teal,barrel,"X")
    pulse.hide_render=True

    wreck=[
        cube("Wreckage sheared Lynx turret shell", (.34,-.69,1.47),
             (1.18,.72,.34),blue,root,True),
        cube("Wreckage broken long-bore gun", (1.20,-1.02,1.12),
             (1.35,.20,.25),shadow,root,True),
        cube("Wreckage detached pale mantlet", (.73,.76,1.36),
             (.81,.47,.27),white,root,True),
        cube("Wreckage exposed engine fire cavity", (-.94,-.16,1.29),
             (.65,.53,.33),ember,root,True),
        cube("Wreckage peeled right track skirt", (-.33,1.03,1.15),
             (1.25,.21,.35),brass,root,True),
        cube("Wreckage collapsed left track shield", (-1.08,-1.04,.87),
             (.86,.38,.46),blue,root,True),
        cube("Wreckage ripped commander cupola", (-.66,-.54,1.66),
             (.45,.41,.25),white,root,True),
        cube("Wreckage glowing turret bearing fracture", (.12,.13,1.24),
             (.41,.44,.35),ember,root,True),
    ]
    for obj,angles in zip(wreck,(
        (.31,.27,-.48),(.19,-.41,-.39),(.30,.25,.41),(.10,-.30,.18),
        (.36,.31,-.35),(.27,-.20,.38),(.42,-.27,.28),(.20,.38,-.21))):
        obj.rotation_euler=angles
    return root,running,turret,barrel,wheels,cleats,flash,pulse,wreck


def apply_pose(parts,state,facing):
    root,running,turret,barrel,wheels,cleats,flash,pulse,wreck=parts
    root.rotation_euler=(0,0,facing*math.tau/32)
    running.location.z=.10 if state=="move" else -.12 if state=="destroyed" else 0
    running.rotation_euler=(0,.035 if state=="move" else .14 if state=="destroyed" else 0,0)
    turret.rotation_euler.z=-.11 if state=="attack" else .04 if state=="move" else 0
    barrel.rotation_euler.y=-.07 if state=="attack" else .10 if state=="destroyed" else 0
    barrel.location.x=.43 if state=="attack" else .63
    for wheel in wheels:
        wheel.rotation_euler.y=.74 if state=="move" else 0
    for cleat,x in cleats:
        cleat.location.x=x+(.11 if state=="move" else 0)
    for obj in running.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    flash.hide_render=state!="attack"
    pulse.hide_render=state!="attack"
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        for obj in running.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "turret cheek","turret roof","mantlet","commander","ammunition pod",
                "ammunition access","turret side reactive","laser warning",
                "electromagnetic cannon","muzzle shroud","ion aperture",
                "cannon external cooling","gun articulated breech")):
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
    source=out/"coalition-lynx-battle-tank.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts,state,facing)
            path=out/"frames"/state/f"{facing:02d}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 original facings",flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)


if __name__=="__main__":
    main()
