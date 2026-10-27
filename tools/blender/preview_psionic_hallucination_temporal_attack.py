#!/usr/bin/env python3
"""PSI-VEH-004: original four-phase Hallucination Drone psychic discharge.

Reopens the already validated editable source from Actions #40583938655.
Renders ONLY new charge/focus/burst/cooldown 32-facing preview frames.
The archived 128-frame atlas and all game-facing art remain untouched.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("charge", "focus", "burst", "cooldown")
FACINGS = 32
FLAG = "hallucination_temporal_only"


def get(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Missing original editable drone component: " + name)
    return obj


def emissive(name, rgba, strength):
    material = bpy.data.materials.new(name)
    material.diffuse_color = rgba
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Emission Color"].default_value = rgba
    shader.inputs["Emission Strength"].default_value = strength
    return material


def register(obj, parent, material):
    obj.parent = parent
    obj.data.materials.append(material)
    obj[FLAG] = True
    obj.hide_render = True
    return obj


def halo(name, parent, x, z, radius, material):
    """Genuine 3D torus, facing forward along the drone's local X axis."""
    bpy.ops.mesh.primitive_torus_add(
        major_segments=32, minor_segments=8,
        major_radius=radius, minor_radius=.027,
        location=(x, 0, z))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return register(obj, parent, material)


def lance(name, parent, y, z, material):
    bpy.ops.mesh.primitive_cone_add(
        vertices=12, radius1=.095, radius2=.015, depth=.52,
        location=(1.97, y, z))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return register(obj, parent, material)


def filament(name, parent, side, index, material):
    """Eight-vertex four-segment bent psychic filament, editable mesh."""
    vertices = []
    y = side * (.19 + .09 * index)
    for i, x in enumerate((1.48, 1.64, 1.84, 2.06)):
        offset = (0, .12, -.065, .16)[i] * side
        z = 1.18 + (0, .13, -.08, .10)[i] + index * .035
        width = .025 if i in (0, 3) else .038
        vertices.extend(((x, y + offset - width, z + width),
                         (x, y + offset + width, z - width)))
    faces = [(i*2, i*2+1, i*2+3, i*2+2) for i in range(3)]
    mesh = bpy.data.meshes.new(name + " faceted volume")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return register(obj, parent, material)


def splinter(name, parent, index, material):
    theta = index * math.tau / 6
    bpy.ops.mesh.primitive_cone_add(
        vertices=6, radius1=.055, radius2=.008, depth=.32,
        location=(2.02, .38*math.cos(theta), 1.24+.38*math.sin(theta)))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (.17*math.cos(theta), math.pi/2, theta)
    return register(obj, parent, material)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x, scene.render.resolution_y) == (160, 160)

    root = get("Psionic Hallucination Drone - original 32 facing source")
    hover = get("Floating phase lens chassis")
    core = get("Independent oscillating neural iris")
    petals = [get("Independent phase petal %02d" % i) for i in range(6)]
    old_attack = [o for o in bpy.data.objects
                  if o.name.startswith("Attack-only")]
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    assert len(old_attack) == 5 and len(wreck) == 10

    mint = emissive("Hallucination temporal soft mint induction",
                    (.11, .70, .55, 1), 1.05)
    lavender = emissive("Hallucination temporal lavender focus",
                        (.52, .32, .89, 1), 1.40)
    pearl = emissive("Hallucination temporal pale ion discharge",
                     (.38, .82, .94, 1), 1.65)
    rings = [
        halo("Temporal inner iris focusing torus", hover, 1.56, 1.22, .19, mint),
        halo("Temporal middle phase torus", hover, 1.70, 1.22, .28, lavender),
        halo("Temporal outer displacement torus", hover, 1.87, 1.22, .37, pearl),
    ]
    lances = [lance("Temporal split neural lance %d" % i, hover,
                    (-.23, .23)[i], 1.20, pearl) for i in range(2)]
    filaments = [filament("Temporal forked filament %d %d" % (side, i),
                          hover, side, i, lavender)
                 for side in (-1, 1) for i in range(2)]
    splinters = [splinter("Temporal mirage splinter %02d" % i,
                          hover, i, mint) for i in range(6)]
    added = rings + lances + filaments + splinters
    assert len(added) == 15

    # Save the editable source in a safe, baseline-compatible idle pose.
    root.rotation_euler = (0, 0, 0)
    hover.location = (0, 0, 0)
    hover.rotation_euler = (0, 0, 0)
    core.location.z = 1.23
    core.rotation_euler = (0, 0, 0)
    for i, petal in enumerate(petals):
        petal.rotation_euler = (0, 0, i*math.tau/6)
    for obj in added + old_attack + wreck:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "psionic-hallucination-temporal-attack.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler.z = facing * math.tau / FACINGS
            hover.location.z = (.035, .095, .045, -.02)[phase_index]
            hover.rotation_euler.y = (.025, -.045, -.10, .018)[phase_index]
            hover.rotation_euler.z = (.02, -.035, .035, 0)[phase_index]
            core.location.z = 1.23 + (.05, .15, .22, .07)[phase_index]
            core.rotation_euler.z = (.09, -.17, .31, -.06)[phase_index]
            for i, petal in enumerate(petals):
                petal.rotation_euler.z = i*math.tau/6 + (
                    (.055, .13, .25, -.045)[phase_index] *
                    (1 if i%2 else -1))
                petal.rotation_euler.y = (
                    (.035, -.10, -.24, .065)[phase_index] *
                    (1 if i%2 else -1))
            for i, obj in enumerate(rings):
                obj.hide_render = phase == "cooldown" and i != 0
                scale = (.56, .81, 1.10, .46)[phase_index]
                obj.scale = (scale, scale, scale)
            for obj in lances:
                obj.hide_render = phase not in ("focus", "burst")
                scale = (.5, .62, 1.0, .4)[phase_index]
                obj.scale = (scale, scale, scale)
            for obj in filaments:
                obj.hide_render = phase not in ("focus", "burst")
            for obj in splinters:
                obj.hide_render = phase != "burst"
            # Keep archived five attack meshes editable but off, avoiding
            # their previous intense glare obscuring the twin psychic needles.
            for obj in old_attack + wreck:
                obj.hide_render = True
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED HALLUCINATION TEMPORAL", phase, FACINGS, flush=True)
    print("PREVIEW_ONLY", source, "128 new frames; archived atlas untouched",
          flush=True)


if __name__ == "__main__":
    main()
