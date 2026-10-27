#!/usr/bin/env python3
"""PSI-VEH-002: original four-beat twin-lance firing geometry, preview only.

Open the already verified Viper .blend from Actions #40508990419. Never
rebuild its 128 validated frames or alter its production-facing atlas.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("charge", "focus", "burst", "cooldown")


def required(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Missing saved Viper source object: " + name)
    return obj


def plasma(name, rgba, strength):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = rgba
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Emission Color"].default_value = rgba
    shader.inputs["Emission Strength"].default_value = strength
    return material


def mark(obj, parent, material):
    obj.parent = parent
    obj["viper_temporal_only"] = True
    obj.hide_render = True
    obj.data.materials.append(material)
    return obj


def ring(name, parent, location, radius, material):
    bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=8,
        major_radius=radius, minor_radius=.046, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return mark(obj, parent, material)


def lance(name, parent, location, length, radius, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=radius,
        depth=length, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return mark(obj, parent, material)


def filament(name, parent, side, twist, material):
    curve = bpy.data.curves.new(name + " editable path", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = .040
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(23)
    for i, point in enumerate(spline.points):
        t = i / 23
        point.co = (1.26 + 1.42 * t,
                    side * (.22 + .20 * math.sin(math.pi * t))
                    + .13 * math.sin(2 * math.pi * t + twist),
                    .38 + .23 * math.sin(math.pi * t + twist), 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    return mark(obj, parent, material)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x, scene.render.resolution_y) == (160, 160)

    root = required("Psionic Viper Light Tank - original 32-facing pilot")
    hover = required("Viper levitating segmented lower hull")
    crown = required("Viper swivelling neural crown and weapon")
    core = required("Viper suspended crystalline neural heart")
    old_flash = required("Viper attack-only twin phase spear")
    old_halo = required("Viper attack-only bifurcated shock disk")
    jaws = sorted((o for o in bpy.data.objects if
        o.name.startswith("Viper independently articulated crescent mandible")),
        key=lambda o: o.name)
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    assert len(jaws) == 2 and len(wreck) == 8

    violet = plasma("Viper temporal electric violet", (.59, .16, .93, 1), 2.3)
    teal = plasma("Viper temporal ion turquoise", (.12, .85, .88, 1), 2.6)
    pearl = plasma("Viper temporal spear white core", (.72, .88, .92, 1), 2.0)
    rings = [
        ring("Viper temporal emitter halo left", crown, (1.37, -.23, .38), .22, teal),
        ring("Viper temporal emitter halo right", crown, (1.37, .23, .38), .22, teal),
        ring("Viper temporal pressure ring near", crown, (1.80, 0, .38), .30, violet),
        ring("Viper temporal pressure ring far", crown, (2.24, 0, .38), .39, teal),
    ]
    beams = [
        lance("Viper temporal port phase lance", crown, (1.78, -.23, .38), 1.05, .075, violet),
        lance("Viper temporal starboard phase lance", crown, (1.78, .23, .38), 1.05, .075, violet),
        lance("Viper temporal converged white spear", crown, (2.11, 0, .38), 1.18, .085, pearl),
    ]
    arcs = [filament("Viper temporal fork arc %d" % i, crown,
                     -1 if i < 2 else 1, i * math.pi / 2,
                     teal if i % 2 == 0 else violet) for i in range(4)]
    sparks = []
    for side in (-1, 1):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.14,
            location=(2.49, side * .32, .43))
        obj = bpy.context.object
        obj.name = "Viper temporal separated ion shard %s" % ("left" if side < 0 else "right")
        sparks.append(mark(obj, crown, teal))
    added = rings + beams + arcs + sparks
    assert len(added) == 13 and all(o.get("viper_temporal_only") for o in added)

    root.rotation_euler = (0, 0, 0)
    hover.location.z = 0
    hover.rotation_euler = (0, 0, 0)
    crown.rotation_euler = (0, 0, 0)
    core.location.z = .86
    old_flash.hide_render = True
    old_halo.hide_render = True
    for obj in added + wreck:
        obj.hide_render = True
    source = out / "psionic-viper-temporal-attack.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(32):
            root.rotation_euler.z = facing * math.tau / 32
            hover.location.z = (0, .045, .10, .02)[phase_index]
            hover.rotation_euler.y = (0, -.018, -.045, .012)[phase_index]
            crown.rotation_euler.z = (0, .07, .17, -.05)[phase_index]
            core.location.z = (.91, 1.01, 1.15, .89)[phase_index]
            for side, jaw in zip((-1, 1), jaws):
                jaw.rotation_euler.z = side * (.06, .15, .31, .09)[phase_index]
            old_flash.hide_render = phase != "burst"
            old_halo.hide_render = phase != "burst"
            for i, obj in enumerate(rings):
                obj.hide_render = (phase == "charge" and i >= 2) or (
                    phase == "cooldown" and i in (1, 3))
                obj.scale = ((.75, .75, .75), (1, 1, 1),
                             (1.27, 1.27, 1.27), (.82, .82, .82))[phase_index]
            for i, obj in enumerate(beams):
                obj.hide_render = (phase == "charge") or (
                    phase == "focus" and i == 2) or (
                    phase == "cooldown" and i != 2)
                obj.scale = (1, 1, (1, 1, 1.1, .48)[phase_index])
            for i, obj in enumerate(arcs):
                obj.hide_render = phase != "burst" and not (
                    phase == "cooldown" and i in (0, 2))
                obj.rotation_euler.x = (0, 0, i * .10, .14)[phase_index]
            for obj in sparks:
                obj.hide_render = phase != "burst"
            for obj in wreck:
                obj.hide_render = True
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED VIPER TEMPORAL", phase, "32 original facings", flush=True)
    print("PREVIEW_ONLY", source, "128 new frames; original atlas untouched", flush=True)


if __name__ == "__main__":
    main()
