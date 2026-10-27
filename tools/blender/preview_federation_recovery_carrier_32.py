#!/usr/bin/env python3
"""Original Iron Federation armoured battlefield recovery carrier, 32-facing preview.

An original tracked recovery rig with segmented track shoes, protected operator cab,
working winch/crane, floodlights and independent shattered wreckage. No live art.
"""
import argparse
import math
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")


def build():
    rust = mat("Federation oxidized red armour", (.45, .17, .14, 1), .68)
    plate = mat("Federation sandblasted iron", (.67, .47, .34, 1), .62)
    black = mat("Federation carbon tracks", (.035, .035, .038, 1), .15)
    joints = mat("Federation gunmetal pistons", (.15, .17, .17, 1), .78)
    amber = mat("Federation amber warning beacons", (1.0, .37, .045, 1), .05, 2.0)
    fracture = mat("Federation exposed fracture", (.95, .53, .15, 1), .30)
    root = empty("Iron Federation AR-9 Recovery Carrier - 32 facings")
    chassis = empty("Independently animated tracked undercarriage", root)
    cube("Low armored central hull", (0, 0, .66), (3.65, 1.65, .73), rust, chassis)
    cube("Recessed mine-resistant belly", (0, 0, .32), (3.42, 1.38, .24), black, chassis)
    wedge("Raked forward recovery plow", [
        (1.52, -.91, .32), (2.04, -.91, .28), (2.04, .91, .28), (1.52, .91, .32),
        (1.38, -.85, 1.06), (1.82, -.85, .69), (1.82, .85, .69), (1.38, .85, 1.06)],
        [(0,3,2,1), (4,5,6,7), (0,1,5,4), (1,2,6,5), (2,3,7,6), (3,0,4,7)],
        plate, chassis)
    wheels = []
    for side in (-1, 1):
        y = side * .92
        cube("Full-length track skirt", (-.08, y, .55), (3.58, .31, .72), black, chassis)
        cube("Bolted side protection", (-.18, side * 1.10, .86),
             (2.75, .14, .27), rust, chassis)
        for x in (-1.42, -.94, -.46, .02, .50, .98, 1.46):
            wheel = empty("Independent road wheel", chassis, (x, side * 1.08, .34))
            cyl("Iron road wheel", (0, 0, 0), .30, .16, joints, wheel)
            cyl("Riveted wheel hub", (0, -side * .10, 0), .13, .035, plate, wheel)
            wheels.append(wheel)
        # Separate visible links, not a texture-only track.
        for x in (-1.42, -.96, -.50, -.04, .42, .88, 1.34):
            cube("Individual steel track cleat", (x, side * 1.18, .15),
                 (.30, .13, .09), plate, chassis)
    cube("Operator cabin armoured lower", (-.83, 0, 1.26), (1.45, 1.33, .63), rust, chassis)
    wedge("Sloped command cabin roof", [
        (-1.65,-.69,1.51),(-.23,-.69,1.51),(-.23,.69,1.51),(-1.65,.69,1.51),
        (-1.56,-.58,1.98),(-.58,-.58,1.98),(-.58,.58,1.98),(-1.56,.58,1.98)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        plate, chassis)
    for side in (-1, 1):
        cube("Recessed narrow observation slit", (-.79, side*.71, 1.69),
             (.61,.065,.12), black, chassis)
        cube("External floodlight", (1.20, side*.53, 1.20), (.20,.20,.16), amber, chassis)
        cube("Side extraction ladder", (-1.17, side*1.20, 1.14),
             (.14,.06,.42), plate, chassis)
    cube("Rear cable reel chassis", (-1.62, 0, 1.25), (.35, .82, .54), joints, chassis)
    cyl("Working recovery winch drum", (-1.69, 0, 1.36), .34, .66, plate, chassis)
    crane = empty("Rotating hydraulic recovery crane", chassis, (.27, 0, 1.18))
    cyl("Reinforced boom turntable", (0,0,0), .54, .22, joints, crane, "Z")
    cube("Diagonal primary lifting boom", (.41, 0, .48), (.46, .42, 1.17), rust, crane)
    cube("Extending upper jib", (.68, 0, 1.18), (.33, .34, .94), plate, crane)
    cube("Cross-braced hydraulic piston", (.18, -.36, .72), (.17,.18,.98), joints, crane)
    cube("Twin ram attachment", (.57,.0,1.62), (.74,.45,.20), joints, crane)
    cyl("Visible suspended hook axle", (1.02,0,1.40), .15, .48, black, crane)
    cube("Heavy lifting hook", (1.07,0,1.18), (.16,.27,.36), amber, crane)
    beacon = cube("Attack-only extraction beacon", (1.10,0,1.08),
                  (.27,.30,.32), amber, crane)
    beacon.hide_render = True
    wreck = [
        cube("Wreckage fractured front plow", (1.83,-.55,.89),
             (.53,.50,.15), fracture, root, True),
        cube("Wreckage fallen crane boom", (.98,-.82,1.50),
             (1.48,.28,.31), rust, root, True),
        cube("Wreckage twisted cabin armor", (-.94,-.75,1.91),
             (1.05,.27,.28), plate, root, True),
        cube("Wreckage sheared recovery cable", (1.48,.62,1.26),
             (.12,.18,.96), joints, root, True),
        cube("Wreckage exposed reactor housing", (-.15,.38,1.44),
             (.76,.64,.32), fracture, root, True),
    ]
    for obj, angles in zip(wreck, ((.25,.23,-.30),(.38,.21,-.65),
                                   (.31,.14,-.29),(.28,.48,.18),(.14,-.28,.13))):
        obj.rotation_euler = angles
    return root, chassis, crane, wheels, beacon, wreck


def apply_pose(parts, state, facing):
    root, chassis, crane, wheels, beacon, wreck = parts
    root.rotation_euler = (0,0,facing*math.tau/32)
    chassis.location.z = .09 if state == "move" else 0
    chassis.rotation_euler = (0, .045 if state == "move" else
                              -.13 if state == "destroyed" else 0, 0)
    crane.rotation_euler.z = .38 if state == "attack" else
                             -.70 if state == "destroyed" else 0
    crane.rotation_euler.y = -.18 if state == "attack" else 0
    for wheel in wheels:
        wheel.rotation_euler.y = .75 if state == "move" else 0
    for obj in chassis.children_recursive:
        if obj.type == "MESH":
            obj.hide_render = False
    beacon.hide_render = state != "attack"
    for obj in wreck:
        obj.hide_render = state != "destroyed"
    if state == "destroyed":
        for obj in chassis.children_recursive:
            if obj.type == "MESH" and any(token in obj.name.lower() for token in (
                    "upper jib", "primary lifting boom", "lifting hook",
                    "command cabin roof", "recovery winch drum", "boom turntable")):
                obj.hide_render = True
    bpy.context.view_layer.update()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = scene_setup()
    parts = build()
    apply_pose(parts, "idle", 0)
    source = out/"federation-armoured-recovery-carrier.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts, state, facing)
            target = out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED", state, "32 facings", flush=True)
    print("PREVIEW_ONLY", source, "128 RGBA frames", flush=True)


if __name__ == "__main__":
    main()
