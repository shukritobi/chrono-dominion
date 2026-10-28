#!/usr/bin/env python3
"""COA-VEH-004 original four-stage Warden physical destruction, PREVIEW ONLY.

Opens validated 32-facing source from Actions #40471597359, not a production
texture. Renders only 128 new physical damage poses. The archived atlas is
read-only, and every new fracture is an editable closed 3D mesh.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32
FLAG = "warden_destruction_only"
FACES = ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
         (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7))


def require(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Validated Warden source missing: " + name)
    return obj


def fragment(name, position, dimensions, material, parent, first, role):
    """Asymmetric eight-vertex solid with six independently editable faces."""
    x, y, z = dimensions
    vertices = [
        (-.53*x, -.42*y, -.48*z), (.48*x, -.50*y, -.44*z),
        (.55*x, .35*y, -.40*z), (-.39*x, .54*y, -.53*z),
        (-.46*x, -.37*y, .48*z), (.36*x, -.54*y, .40*z),
        (.49*x, .30*y, .53*z), (-.50*x, .31*y, .56*z),
    ]
    mesh = bpy.data.meshes.new(name + " solid fracture mesh")
    mesh.from_pydata(vertices, [], FACES)
    mesh.update()
    assert len(mesh.vertices) == 8 and len(mesh.polygons) == 6
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = position
    obj.data.materials.append(material)
    obj[FLAG] = True
    obj["first_phase"] = first
    obj["damage_role"] = role
    obj.hide_render = True
    return obj


def seam_material():
    mat = bpy.data.materials.new("Warden restrained fractured ion conductor")
    mat.diffuse_color = (.025, .36, .50, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (.025, .36, .50, 1)
    bsdf.inputs["Emission Color"].default_value = (.07, .57, .78, 1)
    bsdf.inputs["Emission Strength"].default_value = .23
    return mat


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(
        sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x, scene.render.resolution_y) == (160, 160)

    root = require("Coalition Autonomous Warden Tank - original 32-facing source")
    hull = require("Autonomous low profile split-track hull")
    crown = require("Gyrostabilised faceted autonomous targeting crown")
    old_bolt = require("Attack-only coherent ion bolt")
    old_flash = require("Attack-only ion muzzle discharge")
    pads = [o for o in bpy.data.objects
            if o.name.startswith("Independently cycling track cleat")]
    barrels = [o for o in bpy.data.objects
               if o.name.startswith("Independent ion accelerator barrel")]
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    original = [o for o in hull.children_recursive if o.type == "MESH"]
    assert len(pads) == 18 and len(barrels) == 2 and len(wreck) == 8
    assert len(original) >= 35, len(original)

    navy = require("Central protected unmanned core").data.materials[0]
    ceramic = require("Front twin-chevron sloped glacis").data.materials[0]
    carbon = require("Lower blast-resistant battery cassette").data.materials[0]
    copper = require("Wreckage raised ruptured left track guard").data.materials[0]
    seam = seam_material()
    specs = [
        ("W01 torn port glacis", (1.25, -.45, .88), (.59, .37, .22), ceramic, 1, "armor"),
        ("W02 torn starboard glacis", (1.25, .45, .84), (.62, .35, .20), ceramic, 1, "armor"),
        ("W03 split left track skirt", (.43, -.96, .91), (.74, .19, .19), navy, 1, "track"),
        ("W04 split right track skirt", (.39, .98, .89), (.70, .20, .19), navy, 1, "track"),
        ("W05 sheared sensor face", (.51, -.23, 1.66), (.45, .37, .24), ceramic, 1, "sensor"),
        ("W06 left low ion fracture", (-.20, -.43, 1.14), (.52, .065, .075), seam, 0, "seam"),
        ("W07 right low ion fracture", (.21, .42, 1.12), (.48, .065, .075), seam, 0, "seam"),
        ("W08 severed port accelerator", (1.33, -.61, 1.48), (.71, .24, .25), carbon, 2, "barrel"),
        ("W09 broken starboard accelerator", (1.27, .66, 1.42), (.73, .23, .24), carbon, 2, "barrel"),
        ("W10 ruptured receiver mount", (.55, -.41, 1.40), (.55, .32, .28), ceramic, 2, "receiver"),
        ("W11 detached crown port cheek", (-.25, -.57, 1.55), (.66, .34, .25), navy, 2, "crown"),
        ("W12 detached crown starboard cheek", (-.29, .59, 1.52), (.64, .32, .26), navy, 2, "crown"),
        ("W13 collapsed crown bearing", (-.10, .15, 1.26), (.60, .44, .19), carbon, 2, "bearing"),
        ("W14 exposed ruptured battery seam", (-.66, -.08, 1.06), (.53, .08, .08), seam, 2, "seam"),
        ("W15 torn left drive tooth", (-1.18, -.99, .42), (.43, .27, .21), carbon, 3, "track"),
        ("W16 torn right drive tooth", (-1.17, 1.00, .43), (.43, .27, .22), carbon, 3, "track"),
        ("W17 peeled rear battery roof", (-.97, -.31, .98), (.65, .43, .19), navy, 3, "battery"),
        ("W18 broken rear maintenance hatch", (-1.23, .39, .85), (.37, .39, .25), ceramic, 3, "hatch"),
        ("W19 fallen antenna spar", (-.66, .40, 1.21), (.17, .18, .46), copper, 3, "antenna"),
        ("W20 buckled lower chassis brace", (-.28, .07, .44), (.76, .24, .17), carbon, 3, "frame"),
    ]
    pieces = [fragment(name, pos, dims, material, root, first, role)
              for name, pos, dims, material, first, role in specs]
    assert len(pieces) == 20
    positions = [tuple(o.location) for o in pieces]

    root.rotation_euler = (0, 0, 0)
    hull.location.z = 0
    hull.rotation_euler = (0, 0, 0)
    crown.rotation_euler = (0, 0, 0)
    for obj in original:
        obj.hide_render = False
    for obj in pieces + wreck + [old_bolt, old_flash]:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "coalition-warden-four-stage-destruction.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler = (0, 0, facing * math.tau / FACINGS)
            hull.location.z = (-.03, -.09, -.16, -.23)[phase_index]
            hull.rotation_euler = (
                (.015, .05, .10, .14)[phase_index],
                (-.025, .065, .13, .17)[phase_index],
                (.012, -.04, .075, .11)[phase_index])
            crown.rotation_euler = (
                (.02, .07, .16, .22)[phase_index],
                (-.02, .09, .21, .30)[phase_index],
                (.04, -.15, .23, .36)[phase_index])
            for i, pad in enumerate(pads):
                pad.location.x += 0  # preserve each original cleat's authored position
                pad.rotation_euler.y = (0, .11, .23, .30)[phase_index]
            for obj in original:
                name = obj.name.lower()
                hide = False
                if phase_index >= 1 and any(t in name for t in (
                    "roof shoulder armor", "panoramic sensor",
                    "rangefinder face", "ceramic track side identification")):
                    hide = True
                if phase_index >= 2 and any(t in name for t in (
                    "ion accelerator barrel", "glowing muzzle capacitor",
                    "ion cannon articulated receiver", "barrel cooling fin",
                    "angular low-profile sensor crown", "crown rotating bearing")):
                    hide = True
                if phase_index == 3 and any(t in name for t in (
                    "antenna", "transponder beacon", "rear removable drone",
                    "raised angled track skirt", "forward armored track nose",
                    "rear track drive housing")):
                    hide = True
                obj.hide_render = hide or obj in (old_bolt, old_flash)
            for i, obj in enumerate(wreck):
                obj.hide_render = phase_index < 2 or (
                    phase_index == 2 and i not in (0, 1, 2, 4, 6))
            for i, obj in enumerate(pieces):
                obj.hide_render = phase_index < obj["first_phase"]
                x, y, z = positions[i]
                scatter = (0, .028, .075, .13)[phase_index]
                obj.location = (
                    x + scatter * (1 if i % 2 else -1),
                    y + scatter * (1 if i % 3 else -1),
                    z - (0, .04, .12, .20)[phase_index])
                obj.rotation_euler = (
                    .11 * phase_index * (1 if i % 2 else -1),
                    .07 * phase_index * (1 if i % 3 else -1),
                    .13 * phase_index * (1 if i % 2 else -1))
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED WARDEN PHYSICAL DESTRUCTION", phase, FACINGS, flush=True)
    print("PREVIEW_ONLY", source, "128 NEW sprites; original atlas untouched",
          flush=True)


if __name__ == "__main__":
    main()
