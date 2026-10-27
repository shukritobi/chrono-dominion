#!/usr/bin/env python3
"""FED-VEH-004: four-beat eight-legged Hunter Spider gait, preview only.

Reopens the validated 134 KB Blender source from Actions #40556753530.
Adds eight individually editable rocker plates and articulates all eight
original hip rigs through plant/lift/swing/settle. Renders ONLY 128 new frames.
Never rerenders, edits, or republishes the validated baseline atlas.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("plant", "lift", "swing", "settle")
FACINGS = 32


def get(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Archived Hunter Spider mesh missing: " + name)
    return obj


def heel_rocker(rig, side, index, material):
    """Original eight-face faceted ankle shoe, editable in the saved .blend."""
    cx, cy, cz = .19, side * 1.18, -.77
    vertices = [
        (cx + .24, cy, cz),
        (cx - .19, cy, cz),
        (cx, cy + .14, cz),
        (cx, cy - .14, cz),
        (cx, cy, cz + .105),
        (cx, cy, cz - .055),
    ]
    faces = [
        (0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4),
        (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5),
    ]
    mesh = bpy.data.meshes.new("Spider gait heel rocker %02d geometry" % index)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Spider gait heel rocker %02d" % index, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = rig
    obj.data.materials.append(material)
    obj["spider_gait_only"] = True
    obj.hide_render = True
    return obj


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)

    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x, scene.render.resolution_y) == (160, 160)
    root = get("Federation Hunter Spider Drone - original 32 facing source")
    body = get("Low armored eight-legged hunting core")
    stinger = get("Independent dorsal penetration lance")
    old_shock = get("Attack-only crimson impact shard")
    old_halo = get("Attack-only induction halo")
    rigs = sorted(
        (o for o in bpy.data.objects
         if o.type == "EMPTY" and o.name.startswith("Independent spider leg ")),
        key=lambda o: o.name,
    )
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    upper = [o for o in bpy.data.objects
             if o.name.startswith("Leg ") and "upper tapered armor" in o.name]
    lower = [o for o in bpy.data.objects
             if o.name.startswith("Leg ") and "lower exposed piston" in o.name]
    assert len(rigs) == 8 and len(wreck) == 10
    assert len(upper) == len(lower) == 8
    copper = bpy.data.materials.get("Spider warm titanium edge armour")
    assert copper is not None
    rockers = []
    for index, rig in enumerate(rigs):
        side = -1 if "port" in rig.name else 1
        rockers.append(heel_rocker(rig, side, index, copper))
    assert len(rockers) == 8

    root.rotation_euler = (0, 0, 0)
    body.location = (0, 0, 0)
    body.rotation_euler = (0, 0, 0)
    stinger.rotation_euler = (0, 0, 0)
    old_shock.hide_render = True
    old_halo.hide_render = True
    for obj in rockers + wreck:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "federation-hunter-spider-four-beat-gait.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    # Each phase moves real upper/lower leg struts via their parent hip rig.
    # Alternating diagonal tripods have complementary lift and swing arcs.
    a_x = (-.10, .09, .31, .09)
    b_x = (.10, -.13, -.21, .11)
    a_z = (-.025, .24, .17, -.015)
    b_z = (.10, -.025, .035, .20)
    a_yaw = (-.11, .17, .26, -.06)
    b_yaw = (.11, -.12, -.20, .16)
    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler.z = facing * math.tau / FACINGS
            body.location.z = (-.025, .075, .015, .055)[phase_index]
            body.rotation_euler = (
                (.016, -.035, .035, -.012)[phase_index],
                (.016, -.045, .035, -.015)[phase_index],
                (0, .016, -.018, .009)[phase_index],
            )
            for rig in rigs:
                index = int(rig.name.rsplit(" ", 1)[1])
                side = -1 if "port" in rig.name else 1
                diagonal = (index + (1 if side > 0 else 0)) % 2 == 0
                x = a_x[phase_index] if diagonal else b_x[phase_index]
                z = a_z[phase_index] if diagonal else b_z[phase_index]
                yaw = a_yaw[phase_index] if diagonal else b_yaw[phase_index]
                rig.location = (
                    (-.89, -.35, .20, .75)[index] + x,
                    side * .47,
                    .95 + z,
                )
                rig.rotation_euler = (
                    side * (.06 if diagonal else -.06) * (1 if phase_index % 2 else -1),
                    -.11 if diagonal and phase_index == 1 else .09 if phase_index == 2 else 0,
                    yaw * side,
                )
            for obj in rockers:
                obj.hide_render = False
            for obj in wreck:
                obj.hide_render = True
            old_shock.hide_render = True
            old_halo.hide_render = True
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED SPIDER GAIT", phase, "32 facings", flush=True)
    print("PREVIEW_ONLY", source, "128 NEW GAIT FRAMES; baseline untouched",
          flush=True)


if __name__ == "__main__":
    main()
