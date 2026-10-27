#!/usr/bin/env python3
"""Original Federation Hailstorm rocket artillery: editable 32-facing preview.

128 independent 160px RGBA images: idle, move, attack and destroyed.
All geometry is newly authored; production textures and manifests are untouched.
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
    iron = mat("Hailstorm oxidised red steel", (.40, .19, .17, 1), .66)
    armor = mat("Hailstorm heavy ceramic plating", (.64, .40, .30, 1), .55)
    black = mat("Hailstorm hydraulic graphite", (.055, .058, .067, 1), .25)
    rubber = mat("Hailstorm rubber treads", (.025, .031, .038, 1), .05)
    copper = mat("Hailstorm brass exhaust shields", (.75, .42, .16, 1), .55)
    amber = mat("Hailstorm targeting optics", (1, .40, .075, 1), .10, 2.5)
    fracture = mat("Hailstorm hot exposed fracture", (1, .27, .055, 1), .12, .65)
    root = empty("Federation Hailstorm Rocket Artillery - 32 original facings")
    chassis = empty("Independent heavy eight-wheel suspension", root)

    cube("Eight wheel siege chassis", (0, 0, .70), (3.45, 1.71, .65), iron, chassis)
    cube("Reinforced underside and belly", (0, 0, .38), (3.12, 1.46, .23), black, chassis)
    wedge("Angled blast resistant glacis", [
        (.95, -.84, .64), (1.76, -.70, .64), (1.76, .70, .64), (.95, .84, .64),
        (.81, -.73, 1.15), (1.34, -.59, 1.01), (1.34, .59, 1.01), (.81, .73, 1.15)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        armor, chassis)
    wheels = []
    for side in (-1, 1):
        cube("Segmented outer wheel fender", (-.10, side * .83, .91),
             (2.86, .18, .46), iron, chassis)
        cube("Sloped flank armour", (-.42, side * .75, 1.18),
             (1.58, .15, .28), armor, chassis)
        cube("Orange field warning strip", (.76, side * .94, 1.00),
             (.60, .05, .095), amber, chassis)
        for x in (-1.17, -.38, .40, 1.16):
            hub = empty("Independent rotating roadwheel", chassis,
                        (x, side * .93, .38))
            wheels.append(hub)
            cyl("All terrain roadwheel", (0,0,0), .32, .21, rubber, hub)
            cyl("Armoured wheel centre", (0, -side * .13, 0),
                .16, .05, copper, hub)
            for angle in (0, math.tau / 3, 2 * math.tau / 3):
                cube("Rotating visible wheel spoke",
                     (.095 * math.cos(angle), -side * .17,
                      .095 * math.sin(angle)), (.14,.028,.044), armor, hub)
    cube("Rear ammunition housing", (-1.10,0,1.27), (.93,1.29,.72), armor, chassis)
    cube("Rear magazine blast door", (-1.60,0,1.28), (.10,1.05,.57), black, chassis)
    cube("Command uplink console", (-.80,-.32,1.76), (.54,.48,.32), iron, chassis)
    cyl("Command rangefinding mast", (-1.08,-.48,2.08), .055,.57, black,chassis,"Z")
    cube("Amber tracking beacon", (-1.08,-.48,2.39), (.19,.18,.17), amber,chassis)
    for side in (-1,1):
        cube("Retractable rear firing outrigger", (-1.31,side*1.02,.50),
             (.42,.64,.18), copper, chassis)
        cube("Hydraulic stabiliser ram", (-1.32,side*1.25,.32),
             (.16,.16,.43), black, chassis)
        cube("Rear stabiliser foot", (-1.32,side*1.27,.12),
             (.44,.48,.13), armor, chassis)

    rack = empty("Independently elevating dual missile battery", chassis,
                 (.02,0,1.37))
    cube("Launcher rotating cradle", (0,0,.12), (1.65,1.40,.32), black, rack)
    cube("Launcher hydraulic turntable", (-.22,0,-.10), (.91,1.14,.27), copper,rack)
    for side in (-1,1):
        cube("Separated triple rocket cassette", (.25,side*.49,.47),
             (2.14,.56,.59), iron,rack)
        cube("Protective cassette top ridge", (.27,side*.49,.81),
             (1.92,.50,.12), armor,rack)
        cube("Bright cassette alignment stripe", (1.04,side*.49,.82),
             (.44,.36,.085), amber,rack)
        for z in (.29,.48,.67):
            cyl("Independent live missile barrel", (.34,side*.49,z),
                .105,2.18,black,rack,"X")
            cyl("Copper launch muzzle", (1.48,side*.49,z),
                .14,.16,copper,rack,"X")
        cube("Side cassette mounting claw", (-.43,side*.86,.46),
             (.56,.15,.48),armor,rack)
    plume = cube("Attack-only rocket exhaust", (1.90,-.49,.50),
                 (.73,.25,.25),amber,rack)
    plume.hide_render=True
    missile = cyl("Attack-only launched missile", (2.35,-.49,.50),
                  .115,.82,copper,rack,"X")
    missile.hide_render=True

    wreck = [
        cube("Wreckage sheared port missile pod", (.73,-1.08,1.42),
             (1.53,.52,.44), iron,root,True),
        cube("Wreckage snapped starboard cassette", (-.42,1.04,1.36),
             (1.31,.45,.38),armor,root,True),
        cube("Wreckage torn launcher cradle", (.35,.42,1.87),
             (.93,.31,.38),black,root,True),
        cube("Wreckage exposed glowing missile tube", (1.13,-.70,1.62),
             (.89,.18,.19),fracture,root,True),
        cube("Wreckage broken magazine blast door", (-1.56,-.70,1.18),
             (.21,.84,.57),copper,root,True),
        cube("Wreckage bent tracking antenna", (-1.08,.40,2.20),
             (.14,.16,.80),armor,root,True),
    ]
    for obj, angles in zip(wreck, (
        (.17,.42,-.46),(.34,-.22,.43),(.28,.33,.27),
        (.15,-.38,-.36),(.38,.27,-.28),(.41,-.32,.52))):
        obj.rotation_euler = angles
    return root,chassis,rack,wheels,plume,missile,wreck


def apply_pose(parts,state,facing):
    root,chassis,rack,wheels,plume,missile,wreck = parts
    root.rotation_euler = (0,0,facing*math.tau/32)
    chassis.location.z = .085 if state=="move" else -.10 if state=="destroyed" else 0
    chassis.rotation_euler = (0,.035 if state=="move" else .14 if state=="destroyed" else 0,0)
    rack.rotation_euler = (0,-.29 if state=="attack" else
                          .13 if state=="destroyed" else -.09,0)
    rack.location.z = 1.43 if state=="attack" else 1.37
    for wheel in wheels:
        wheel.rotation_euler.y = .70 if state=="move" else 0
    for obj in chassis.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    plume.hide_render = state!="attack"
    missile.hide_render = state!="attack"
    for obj in wreck:
        obj.hide_render = state!="destroyed"
    if state=="destroyed":
        for obj in chassis.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "rocket cassette","missile barrel","launch muzzle",
                "cassette top ridge","cassette alignment stripe",
                "tracking beacon","rangefinding mast","launcher rotating cradle")):
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
    source=out/"federation-hailstorm-rocket-artillery.blend"
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
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)


if __name__=="__main__":
    main()
