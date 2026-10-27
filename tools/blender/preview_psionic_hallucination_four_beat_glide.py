#!/usr/bin/env python3
"""PSI-VEH-004 original four-beat Hallucination Drone gliding movement.

Loads the previously validated .blend from Actions #40583938655. The six
original petals and neural iris articulate through hover/bank/surge/settle.
Adds six physical swept stabilizer blades and six separately editable
rearward phase-wake wedges. Renders ONLY 128 NEW preview PNGs. Does not
touch any archived atlas, live texture, manifest, or game loader.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("hover", "bank", "surge", "settle")
FACINGS = 32
FLAG = "hallucination_glide_only"
FACES = ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
         (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7))


def get(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Missing validated Hallucination component: " + name)
    return obj


def material(name, rgba, glow):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    shader = m.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Emission Color"].default_value = rgba
    shader.inputs["Emission Strength"].default_value = glow
    return m


def faceted(name, vertices, parent, mat):
    """Independent eight-vertex closed volumetric mesh, not a sprite plane."""
    mesh = bpy.data.meshes.new(name + " editable volume")
    mesh.from_pydata(vertices, [], FACES)
    mesh.update()
    assert len(mesh.vertices) == 8 and len(mesh.polygons) == 6
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(mat)
    obj[FLAG] = True
    obj.hide_render = True
    return obj


def build(hover):
    ceramic = material("Glide swept amethyst ceramic", (.31, .15, .51, 1), .28)
    mint = material("Glide soft mint exhaust ion", (.12, .67, .56, 1), .65)
    blades = []
    for i in range(6):
        # These are actual swept, closed 3D fins, arranged radially.
        vertices = [
            (.53, -.13, 1.04), (1.22, -.23, .99),
            (1.34, -.06, .99), (.53, .11, 1.04),
            (.53, -.13, 1.15), (1.12, -.17, 1.20),
            (1.24, -.02, 1.18), (.53, .11, 1.15),
        ]
        blade = faceted("Glide independent swept stabilizer %02d" % i,
                        vertices, hover, ceramic)
        blade.rotation_euler.z = i * math.tau / 6
        blades.append(blade)

    wakes = []
    for i in range(6):
        # Six displaced volumetric exhaust tongues, not compositor overlays.
        y = (i - 2.5) * .18
        z = 1.02 + (i % 2) * .085
        vertices = [
            (-.62, y-.052, z-.055), (-1.52, y-.024, z-.025),
            (-1.65, y+.020, z-.010), (-.62, y+.052, z-.055),
            (-.62, y-.052, z+.055), (-1.44, y-.024, z+.025),
            (-1.55, y+.020, z+.015), (-.62, y+.052, z+.055),
        ]
        wakes.append(faceted("Glide detached phase wake %02d" % i,
                             vertices, hover, mint))
    assert len(blades) == len(wakes) == 6
    return blades, wakes


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
    attack = [o for o in bpy.data.objects if o.name.startswith("Attack-only")]
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    assert len(attack) == 5 and len(wreck) == 10
    blades, wakes = build(hover)

    # Serialized source is neutral and baseline-compatible; every new mesh
    # remains editable and hidden until its explicit animation phase.
    root.rotation_euler = (0, 0, 0)
    hover.location = (0, 0, 0)
    hover.rotation_euler = (0, 0, 0)
    core.location.z = 1.23
    core.rotation_euler = (0, 0, 0)
    for i, petal in enumerate(petals):
        petal.rotation_euler = (0, 0, i * math.tau / 6)
    for obj in blades + wakes + attack + wreck:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "psionic-hallucination-four-beat-glide.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler.z = facing * math.tau / FACINGS
            hover.location.z = (.07, .16, .23, .035)[phase_index]
            hover.rotation_euler = (
                (.015, -.09, .065, -.025)[phase_index],
                (.035, .085, -.13, .018)[phase_index],
                (.025, -.105, .095, -.02)[phase_index])
            core.location.z = 1.23 + (.03, .13, .24, .06)[phase_index]
            core.rotation_euler.z = (.04, -.19, .27, -.04)[phase_index]
            for i, petal in enumerate(petals):
                alternating = 1 if i % 2 else -1
                petal.rotation_euler.z = i*math.tau/6 + (
                    (.055, .16, .27, -.035)[phase_index] * alternating)
                petal.rotation_euler.y = (
                    (.025, .17, -.21, .04)[phase_index] * alternating)
            for i, blade in enumerate(blades):
                blade.hide_render = False
                blade.rotation_euler.z = i*math.tau/6 + (
                    (.015, -.09, .18, -.025)[phase_index] *
                    (1 if i % 2 else -1))
                blade.rotation_euler.y = (.025, .13, -.17, .035)[phase_index]
            for i, wake in enumerate(wakes):
                wake.hide_render = phase not in ("bank", "surge")
                wake.scale = ((.68, .78, 1.0, .52)[phase_index], 1, 1)
                wake.rotation_euler.z = (.0, -.055, .075, .0)[phase_index]
            for obj in attack + wreck:
                obj.hide_render = True
            bpy.context.view_layer.update()
            target = out/"frames"/phase/("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED GLIDE", phase, FACINGS, flush=True)
    print("PREVIEW_ONLY", source, "128 new glide frames; baseline untouched", flush=True)


if __name__ == "__main__":
    main()
