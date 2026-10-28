#!/usr/bin/env python3
"""PSI-VEH-001: original Indenture Mining Crawler, 32-facing Blender preview.

Original 20-vertex excavation hull, open ore hopper, eight articulated road
wheels, 24 track cleats, twin independently hinged cutting booms with 20
individual teeth, and twelve closed asymmetric wreck meshes. No live assets.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "harvest", "destroyed")


def beam(name, start, end, width, material, parent):
    a, b = Vector(start), Vector(end)
    direction = b - a
    obj = cube(name, (a + b) * .5,
               (width, width, direction.length), material, parent)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def closed_shard(name, location, size, angles, material, parent):
    ring = [(-.73, -.16), (-.32, -.60), (.27, -.46),
            (.73, -.06), (.31, .55), (-.43, .39)]
    sx, sy, sz = size
    vertices = [(x*sx, y*sy, -.5*sz) for x, y in ring]
    vertices += [(x*sx, y*sy, .5*sz) for x, y in ring]
    faces = [tuple(range(5, -1, -1)), tuple(range(6, 12))]
    faces += [(i, (i+1)%6, (i+1)%6+6, i+6) for i in range(6)]
    obj = wedge(name, vertices, faces, material, parent)
    obj.location = location
    obj.rotation_euler = angles
    obj["closed_fracture"] = True
    obj["wreckage_only"] = True
    obj.hide_render = True
    return obj


def tooth(name, angle, material, parent):
    """Physical six-vertex tapered tooth with closed five-face topology."""
    c, s = math.cos(angle), math.sin(angle)
    t = (-s, c)
    def point(r, side, y):
        return (r*c + side*t[0], y, r*s + side*t[1])
    vertices = [
        point(.30, -.085, -.075), point(.30, .085, -.075),
        point(.53, 0, -.075), point(.30, -.085, .075),
        point(.30, .085, .075), point(.53, 0, .075)
    ]
    faces = [(0, 2, 1), (3, 4, 5),
             (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)]
    obj = wedge(name, vertices, faces, material, parent)
    obj["cutter_tooth"] = True
    return obj


def harvest_only(obj):
    obj["closed_fracture"] = False
    obj["wreckage_only"] = False
    obj["harvest_only"] = True
    obj.hide_render = True
    return obj


def build():
    purple = mat("Crawler deep violet mining ceramic", (.22, .11, .34, 1), .49)
    lilac = mat("Crawler battered lilac armour", (.56, .42, .67, 1), .43)
    dark = mat("Crawler graphite mechanical cavities", (.045, .036, .071, 1), .31)
    rubber = mat("Crawler black mining track rubber", (.026, .028, .035, 1), .06)
    copper = mat("Crawler weathered brass hydraulic rails", (.70, .42, .20, 1), .66)
    mint = mat("Crawler emerald ore sensor", (.22, .89, .53, 1), .08, 1.25)
    ore = mat("Crawler exposed cyan mineral", (.21, .73, .92, 1), .12, .65)
    fracture = mat("Crawler exposed hot fracture edges", (.93, .45, .26, 1), .23, .22)

    root = empty("PSI-VEH-001 ORIGINAL Indenture Mining Crawler")
    chassis = empty("Crawler independently moving tracked excavation chassis", root)
    # Asymmetric ten-point perimeter, two complete rings, 20 true vertices.
    perimeter = [(1.72, -.37), (1.61, .49), (1.09, .76),
                 (.13, .88), (-1.25, .75), (-1.80, .40),
                 (-1.80, -.43), (-1.22, -.78), (.16, -.91),
                 (1.11, -.74)]
    lower = [(x, y, .44) for x, y in perimeter]
    upper = [(x*.90, y*.89, 1.18 + (.13 if x < -.8 else 0))
             for x, y in perimeter]
    faces = [tuple(range(9, -1, -1)), tuple(range(10, 20))]
    faces += [(i, (i+1)%10, (i+1)%10+10, i+10) for i in range(10)]
    hull = wedge("Crawler original custom 20-vertex shovel-beak hull",
                 lower + upper, faces, purple, chassis)
    hull["custom_hull"] = True
    cube("Crawler low suspended engine pan", (-.06, 0, .44),
         (3.24, 1.30, .26), dark, chassis)
    cube("Crawler asymmetric forward armour snout", (1.36, -.07, .91),
         (.65, 1.28, .27), lilac, chassis)
    cube("Crawler forward navigation slit", (1.61, -.26, 1.11),
         (.16, .48, .10), mint, chassis)

    # Open-topped ore hopper: actual floor and four separate upright walls,
    # no opaque roof, with individually shaped mineral lumps visible inside.
    cube("Crawler open ore hopper dark floor", (-.66, 0, 1.26),
         (1.49, 1.16, .12), dark, chassis)
    hopper = []
    for side in (-1, 1):
        hopper.append(cube("Crawler open hopper sidewall", (-.66, side*.60, 1.55),
                           (1.58, .13, .58), lilac, chassis))
    for x in (-1.39, .07):
        hopper.append(cube("Crawler open hopper endwall", (x, 0, 1.55),
                           (.13, 1.18, .58), purple, chassis))
    for i, (x, y, z) in enumerate(((-1.08, -.22, 1.46),
                                    (-.62, .24, 1.50),
                                    (-.17, -.16, 1.47))):
        o = closed_shard("Crawler ore hopper crystalline payload %d" % i,
                         (x, y, z), (.37, .31, .38),
                         (.19, -.15, i*.66), ore, chassis)
        o.hide_render = False
        o["wreckage_only"] = False
        o["closed_fracture"] = False
        o["ore_payload"] = True

    wheels = []
    cleats = []
    for side in (-1, 1):
        cube("Crawler heavy segmented track shroud", (-.10, side*.85, .63),
             (3.00, .21, .46), purple, chassis)
        cube("Crawler worn copper side skid", (-.09, side*.99, .90),
             (2.66, .06, .085), copper, chassis)
        for x in (-1.22, -.44, .34, 1.12):
            hub = empty("Crawler independently rotating track roadwheel pivot",
                        chassis, (x, side*.92, .35))
            wheels.append(hub)
            cyl("Crawler armored rubber roadwheel", (0, 0, 0),
                .32, .20, rubber, hub, "Y")
            cyl("Crawler bronze wheel boss", (0, side*.13, 0),
                .17, .04, copper, hub, "Y")
        for j in range(12):
            x = -1.47 + j*.245
            z = .18 if j % 2 else .77
            cleat = cube("Crawler independent track shoe cleat",
                         (x, side*1.00, z), (.19, .22, .10), dark, chassis)
            cleat["track_cleat"] = True
            cleats.append(cleat)

    booms = []
    cutters = []
    for side in (-1, 1):
        hinge = empty("Crawler independent mining boom hydraulic hinge",
                      chassis, (.80, side*.53, 1.27))
        booms.append(hinge)
        beam("Crawler articulated heavy mining boom upper spar",
             (0, 0, 0), (.89, side*.06, -.13), .21, copper, hinge)
        beam("Crawler telescoping lower mining arm",
             (.82, side*.06, -.13), (1.22, side*.12, -.48),
             .17, lilac, hinge)
        beam("Crawler visible exposed hydraulic piston",
             (.05, side*.15, -.16), (.91, side*.18, -.31),
             .075, dark, hinge)
        pivot = empty("Crawler independent rotary cutter axle",
                      hinge, (1.24, side*.12, -.46))
        cutters.append(pivot)
        cyl("Crawler exposed toothed cutting drum", (0, 0, 0),
            .33, .19, purple, pivot, "Y")
        cyl("Crawler bright cutting drum hub", (0, side*.13, 0),
            .17, .055, mint, pivot, "Y")
        for i in range(10):
            tooth("Crawler individually modeled rotary cutter tooth",
                  i*math.tau/10, copper, pivot)
    cube("Crawler rear ore conveyor intake", (-1.48, .11, 1.10),
         (.46, .66, .27), copper, chassis)
    for side in (-1, 1):
        harvest_only(closed_shard("Crawler harvest-only liberated ore cluster",
                    (1.94, side*.40, .61), (.36, .31, .30),
                    (.16, -.14, side*.30), ore, chassis))
    harvest_only(cube("Crawler harvest-only deployed collector scoop",
                      (1.90, 0, .47), (.53, 1.08, .16), copper, chassis))
    harvest_only(cube("Crawler harvest-only scoop luminous sensor",
                      (2.09, 0, .57), (.12, .64, .10), mint, chassis))

    wreck = []
    fragments = [
        ("crushed shovel beak", (1.15, -.49, .47), (.89, .42, .31), (.22, .18, -.41), lilac),
        ("torn starboard beak", (1.12, .62, .43), (.76, .40, .29), (.30, -.19, .42), purple),
        ("fallen hopper port", (-.53, -.91, .63), (.91, .40, .32), (.31, .22, -.52), lilac),
        ("fallen hopper starboard", (-.82, .80, .57), (.84, .45, .29), (.25, -.21, .39), purple),
        ("sheared left mining boom", (.88, -.69, .76), (.77, .34, .27), (.22, .24, -.38), copper),
        ("sheared right mining boom", (.92, .64, .72), (.73, .31, .29), (.24, -.22, .41), copper),
        ("fractured ore core", (-.47, -.02, .73), (.72, .49, .33), (.28, .17, -.21), fracture),
        ("aft broken engine", (-1.28, .09, .51), (.88, .45, .31), (.27, -.23, .31), dark),
        ("collapsed port track", (-.96, -.94, .27), (.68, .43, .26), (.30, .17, -.40), purple),
        ("collapsed starboard track", (.75, .96, .27), (.69, .43, .28), (.23, -.21, .36), dark),
        ("copper fracture left", (-1.24, -.41, .71), (.71, .34, .24), (.20, .21, -.34), copper),
        ("exposed shattered cutter", (1.34, -.19, .67), (.72, .38, .29), (.30, -.16, .30), fracture),
    ]
    for label, loc, scale, angles, material in fragments:
        wreck.append(closed_shard("Crawler wreck " + label,
                                  loc, scale, angles, material, root))
    return dict(root=root, chassis=chassis, hull=hull, wheels=wheels,
                cleats=cleats, booms=booms, cutters=cutters, hopper=hopper,
                wreck=wreck)


def pose(parts, state, facing):
    assert state in STATES
    parts["root"].rotation_euler.z = facing*math.tau/32
    chassis = parts["chassis"]
    chassis.location.z = .07 if state == "move" else -.17 if state == "destroyed" else 0
    chassis.rotation_euler.y = .045 if state == "move" else -.14 if state == "destroyed" else 0
    for wheel in parts["wheels"]:
        wheel.rotation_euler.y = .76 if state == "move" else 0
    for i, boom in enumerate(parts["booms"]):
        boom.rotation_euler.y = -.47 if state == "harvest" else .13 if state == "move" else 0
        boom.rotation_euler.z = (-.08 if i == 0 else .08) if state == "harvest" else 0
    for cutter in parts["cutters"]:
        cutter.rotation_euler.y = .76 if state == "harvest" else .24 if state == "move" else 0
    for obj in chassis.children_recursive:
        if obj.type == "MESH":
            obj.hide_render = bool(obj.get("harvest_only")) and state != "harvest"
    for obj in parts["wreck"]:
        obj.hide_render = state != "destroyed"
    parts["hull"].hide_render = state == "destroyed"
    if state == "destroyed":
        for obj in chassis.children_recursive:
            if obj.type == "MESH" and any(term in obj.name.lower() for term in
                ("hopper", "mining boom", "mining arm", "hydraulic piston",
                 "cutter", "ore hopper crystalline", "navigation slit",
                 "conveyor", "liberated ore", "collector scoop")):
                obj.hide_render = True
    bpy.context.view_layer.update()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    scene = scene_setup()
    parts = build()
    pose(parts, "idle", 0)
    blend = output/"psionic-indenture-crawler.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
    assert blend.stat().st_size > 2000
    for state in STATES:
        for facing in range(32):
            pose(parts, state, facing)
            frame = output/"frames"/state/f"{facing:02d}.png"
            frame.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(frame)
            bpy.ops.render.render(write_still=True)
        print("RENDERED", state, "32 facings", flush=True)
    print("PREVIEW_ONLY", blend, "128 transparent 160px frames; no game art", flush=True)


if __name__ == "__main__":
    main()
