#!/usr/bin/env python3
"""PSI-VEH-002 original four-stage Viper physical destruction (PREVIEW ONLY).

Load the validated Viper .blend from Actions #40508990419. This module only
renders 128 NEW damage poses; the original 128-frame atlas is read-only.
All twenty added fractures are closed, editable Blender meshes, not decals.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32
FLAG = "viper_destruction_only"
FACES = ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
         (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7))


def require(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Validated Viper source missing: " + name)
    return obj


def fracture(name, pos, dims, material, root, first, role):
    """Create an asymmetric, six-face volumetric shard with editable topology."""
    x, y, z = dims
    vertices = [
        (-.56*x, -.38*y, -.45*z), (.48*x, -.53*y, -.51*z),
        (.57*x, .39*y, -.43*z), (-.43*x, .54*y, -.48*z),
        (-.49*x, -.45*y, .55*z), (.36*x, -.50*y, .42*z),
        (.50*x, .29*y, .49*z), (-.55*x, .36*y, .53*z),
    ]
    mesh = bpy.data.meshes.new(name + " editable fracture solid")
    mesh.from_pydata(vertices, [], FACES)
    mesh.update()
    assert len(mesh.vertices) == 8 and len(mesh.polygons) == 6
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = root
    obj.location = pos
    obj.data.materials.append(material)
    obj[FLAG] = True
    obj["first_phase"] = first
    obj["damage_role"] = role
    obj.hide_render = True
    return obj


def dim_psionic_ember():
    """Keep original reactor damage, but prevent its glow hiding tiny fractures."""
    ember = require("Viper wreckage ruptured reactor fracture").data.materials[0]
    if ember.use_nodes:
        bsdf = ember.node_tree.nodes.get("Principled BSDF")
        if bsdf is not None and bsdf.inputs.get("Emission Strength") is not None:
            bsdf.inputs["Emission Strength"].default_value = .48
    return ember


def seam_material():
    mat = bpy.data.materials.new("Viper restrained violet fractured field")
    mat.diffuse_color = (.34, .09, .46, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (.34, .09, .46, 1)
    shader.inputs["Emission Color"].default_value = (.48, .18, .66, 1)
    shader.inputs["Emission Strength"].default_value = .24
    return mat


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:]
                                 if "--" in sys.argv else [])
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x, scene.render.resolution_y) == (160, 160)

    root = require("Psionic Viper Light Tank - original 32-facing pilot")
    hover = require("Viper levitating segmented lower hull")
    crown = require("Viper swivelling neural crown and weapon")
    core = require("Viper suspended crystalline neural heart")
    old_flash = require("Viper attack-only twin phase spear")
    old_halo = require("Viper attack-only bifurcated shock disk")
    skids = sorted((o for o in bpy.data.objects
                    if o.name.startswith("Viper independently articulated gravitic skid")),
                   key=lambda o: o.name)
    jaws = sorted((o for o in bpy.data.objects
                   if o.name.startswith("Viper independently articulated crescent mandible")),
                  key=lambda o: o.name)
    original_wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    original = [o for o in hover.children_recursive if o.type == "MESH"]
    assert len(skids) == 2 and len(jaws) == 2 and len(original_wreck) == 8
    assert len(original) >= 25, len(original)

    black = require("Viper compact suspended central hull").data.materials[0]
    plum = require("Viper blade-shaped anti-gravity side nacelle").data.materials[0]
    silver = require("Viper dorsal spine armor").data.materials[0]
    graphite = require("Viper narrow ventral black keel").data.materials[0]
    ember = dim_psionic_ember()
    seam = seam_material()

    specs = [
        ("V01 port prow ripped ceramic", (1.32, -.48, .94), (.67, .31, .22), plum, 1, "prow"),
        ("V02 starboard prow torn edge", (1.24, .49, .90), (.61, .30, .23), plum, 1, "prow"),
        ("V03 snapped port phase fang", (1.69, -.72, 1.12), (.65, .20, .21), silver, 1, "fang"),
        ("V04 snapped starboard phase fang", (1.53, .76, 1.07), (.71, .20, .20), silver, 2, "fang"),
        ("V05 peeled port gravitic skid", (.37, -1.13, .67), (.84, .24, .25), plum, 1, "skid"),
        ("V06 buckled starboard skid", (.19, 1.17, .63), (.78, .25, .26), plum, 2, "skid"),
        ("V07 shattered field stabilizer", (-.62, -1.12, .48), (.45, .23, .24), graphite, 2, "stabilizer"),
        ("V08 severed stabilizer clamp", (-.76, 1.16, .51), (.48, .24, .23), graphite, 3, "stabilizer"),
        ("V09 cracked neural crown port", (-.12, -.51, 1.58), (.62, .29, .27), black, 2, "crown"),
        ("V10 cracked neural crown starboard", (-.20, .54, 1.55), (.63, .30, .25), black, 2, "crown"),
        ("V11 split crest shard", (-.63, -.15, 1.75), (.42, .29, .26), plum, 2, "crest"),
        ("V12 severed port ion rail", (1.02, -.46, 1.39), (.70, .20, .18), silver, 2, "weapon"),
        ("V13 severed starboard ion rail", (1.12, .43, 1.38), (.69, .20, .19), silver, 2, "weapon"),
        ("V14 broken magnetic crown bearing", (-.14, .08, 1.17), (.59, .38, .18), graphite, 2, "bearing"),
        ("V15 exposed fractured rear shroud", (-1.21, -.42, 1.05), (.56, .36, .25), black, 3, "shroud"),
        ("V16 peeled starboard engine cover", (-1.15, .51, .91), (.60, .36, .21), plum, 3, "shroud"),
        ("V17 collapsed underside keel", (-.25, .04, .47), (.85, .27, .18), graphite, 3, "keel"),
        ("V18 port field fracture seam", (.53, -.59, 1.05), (.60, .075, .075), seam, 0, "seam"),
        ("V19 starboard field fracture seam", (.42, .57, 1.03), (.54, .075, .075), seam, 0, "seam"),
        ("V20 neural heart split seam", (-.22, -.06, 1.47), (.44, .075, .075), seam, 2, "seam"),
    ]
    fragments = [fracture(name, pos, dims, material, root, first, role)
                 for name, pos, dims, material, first, role in specs]
    assert len(fragments) == 20
    original_positions = [tuple(obj.location) for obj in fragments]

    # The saved editable source opens in a safe intact, non-firing state.
    root.rotation_euler = (0, 0, 0)
    hover.location.z = 0
    hover.rotation_euler = (0, 0, 0)
    crown.rotation_euler = (0, 0, 0)
    core.location.z = .86
    for obj in original:
        obj.hide_render = obj in (old_flash, old_halo)
    for obj in fragments + original_wreck:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "psionic-viper-four-stage-destruction.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler = (0, 0, facing * math.tau / FACINGS)
            hover.location.z = (-.035, -.105, -.19, -.26)[phase_index]
            hover.rotation_euler = (
                (.02, .08, .17, .24)[phase_index],
                (-.025, .08, .16, .22)[phase_index],
                (.02, -.09, .15, .20)[phase_index])
            crown.rotation_euler = (
                (.03, .08, .21, .28)[phase_index],
                (-.025, .09, .24, .31)[phase_index],
                (.04, -.16, .28, .40)[phase_index])
            core.location.z = (.87, .76, .67, .60)[phase_index]
            for i, skid in enumerate(skids):
                skid.rotation_euler.x = (0, .19, .34, .46)[phase_index] * (1 if i else -1)
                skid.location.z = (0, -.04, -.11, -.18)[phase_index]
            for i, jaw in enumerate(jaws):
                jaw.rotation_euler.z = (0, .22, .40, .55)[phase_index] * (1 if i else -1)
            for obj in original:
                name = obj.name.lower()
                hide = obj in (old_flash, old_halo)
                if phase_index >= 1 and obj.parent == jaws[0]:
                    hide = True
                if phase_index >= 1 and obj.parent == skids[0] and any(t in name for t in (
                        "blade-shaped anti-gravity side nacelle",
                        "asymmetric fin upper armor", "nacelle silver leading knife")):
                    hide = True
                if phase_index >= 2 and obj.parent in jaws:
                    hide = True
                if phase_index >= 2 and any(t in name for t in (
                        "floating armored crown", "raised prismatic crest",
                        "crystalline neural heart", "dual phase emitter rail",
                        "paired ion aperture", "neural antenna")):
                    hide = True
                if phase_index == 3 and any(t in name for t in (
                        "dorsal spine armor", "aft engine shroud",
                        "asymmetric fin upper armor", "side exposed field cable",
                        "luminous forward horn tip")):
                    hide = True
                obj.hide_render = hide
            for i, obj in enumerate(original_wreck):
                obj.hide_render = phase_index < 2 or (
                    phase_index == 2 and i not in (0, 1, 2, 3, 5))
            for i, obj in enumerate(fragments):
                obj.hide_render = phase_index < obj["first_phase"]
                x, y, z = original_positions[i]
                scatter = (0, .045, .10, .17)[phase_index]
                obj.location = (x + scatter * (1 if i % 2 else -1),
                                y + scatter * (1 if i % 3 else -1),
                                z - (0, .04, .14, .25)[phase_index])
                obj.rotation_euler = (
                    .13 * phase_index * (1 if i % 2 else -1),
                    .08 * phase_index * (1 if i % 3 else -1),
                    .16 * phase_index * (1 if i % 2 else -1))
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED VIPER PHYSICAL DESTRUCTION", phase, FACINGS, flush=True)
    print("PREVIEW_ONLY", source, "128 new frames; archived atlas untouched", flush=True)


if __name__ == "__main__":
    main()
