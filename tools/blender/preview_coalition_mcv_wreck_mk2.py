#!/usr/bin/env python3
"""PREVIEW ONLY: COA-VEH-008 MCV MK-II torn roof cavity and fracture highlights.

Imports the validated original MCV; renders ONLY 32 destroyed facings.
The 96 previously validated idle/move/deploy PNGs must be copied from
workflow #40769372711, not regenerated. Never writes production art.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import preview_coalition_mcv_32 as baseline
from preview_coalition_carrier_32 import mat, cube

NEW_WRECK_PARTS = 10


def wreck_only(obj):
    obj["wreck_mk2_only"] = True
    obj["wreckage_only"] = True
    obj.hide_render = True
    return obj


def build():
    p = baseline.build()
    root = p["root"]
    dark = mat("MCV MK-II exposed roof cavity", (.024, .035, .045, 1), .32)
    steel = mat("MCV MK-II ruptured pale roof rim", (.55, .66, .67, 1), .55)
    copper = mat("MCV MK-II restrained hot fracture copper", (.82, .38, .13, 1), .30, .12)
    new = []
    # The original intact roof plate is switched OFF in the destroyed state.
    # An inset shadowed cavity is physically lower than its torn roof edges.
    new.append(wreck_only(cube("MK-II dark recessed construction bay",
                              (-.35, 0, .98), (1.92, 1.08, .12), dark, root)))
    # Four intentionally asymmetric, interrupted steel lip pieces.
    lips = [
        ("port", (-.48, -.58, 1.20), (1.18, .15, .17), -.10),
        ("starboard", (-.19, .59, 1.18), (.87, .16, .18), .13),
        ("front", (.70, -.11, 1.19), (.16, .72, .20), -.21),
        ("rear", (-1.34, .12, 1.17), (.16, .65, .18), .16),
    ]
    for name, loc, size, tilt in lips:
        o = wreck_only(cube("MK-II torn roof lip " + name, loc, size, steel, root))
        o.rotation_euler.y = tilt
        new.append(o)
    # Four independently editable, closed manifold fracture wedges.
    # Their edges are restrained orange and physically anchored in the cavity.
    shards = [
        ("port fracture", (-.78, -.43, 1.16), (.50, .28, .17), (.19, -.11, -.27)),
        ("starboard fracture", (.14, .47, 1.15), (.47, .26, .17), (.22, .10, .34)),
        ("front fracture", (.48, -.20, 1.15), (.42, .28, .15), (.14, -.12, -.31)),
        ("rear fracture", (-1.05, .12, 1.14), (.39, .29, .16), (.18, .11, .24)),
    ]
    for name, loc, size, rot in shards:
        o = baseline.fragment("MK-II " + name, loc, size, rot, copper, root)
        o["wreck_mk2_only"] = True
        new.append(o)
    # An exposed, offset inner structural spar breaks the cavity's symmetry.
    new.append(wreck_only(cube("MK-II sheared roof cross spar",
                              (-.25, -.16, 1.11), (1.08, .105, .14),
                              steel, root)))
    assert len(new) == NEW_WRECK_PARTS
    p["mk2_wreck"] = new
    p["original_roof"] = [
        o for o in p["chassis"].children_recursive
        if o.type == "MESH" and "central armoured build deck" in o.name.lower()
    ]
    assert len(p["original_roof"]) == 1
    return p


def pose(p, state, facing):
    baseline.pose(p, state, facing)
    destroyed = state == "destroyed"
    for o in p["mk2_wreck"]:
        o.hide_render = not destroyed
    # This is a physical missing-roof state, not a painted crack.
    for o in p["original_roof"]:
        o.hide_render = destroyed
    bpy.context.view_layer.update()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True, type=Path)
    args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = baseline.scene_setup()
    p = build()
    pose(p, "idle", 0)
    blend = out / "coalition-mcv-wreck-mk2.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
    assert blend.stat().st_size > 2000
    for facing in range(32):
        pose(p, "destroyed", facing)
        path = out / "frames" / "destroyed" / f"{facing:02d}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
    print("MK-II preview ONLY: 32 destroyed renders; 96 intact/movement/deployment frames untouched", flush=True)


if __name__ == "__main__":
    main()
