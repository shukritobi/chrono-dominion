#!/usr/bin/env python3
"""COA-VEH-005: original four-stage physical destruction, preview only.

Loads the previously validated editable Hunter .blend. Never rebuilds the
original 128 frames, touches the game loader, or replaces any live atlas.
Each fracture is a CLOSED asymmetric extruded five-sided mesh, not a cube.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32


def named(prefix):
    matches = [obj for obj in bpy.data.objects if obj.name.startswith(prefix)]
    assert len(matches) == 1, (prefix, [o.name for o in matches])
    return matches[0]


def broken_piece(name, location, size, angles, material, root, first, role):
    """Ten vertices, seven faces; pentagonal top/bottom and five sidewalls."""
    x, y, z = size
    outline = [(-.52, -.43), (.18, -.53), (.56, -.10), (.31, .49), (-.45, .30)]
    vertices = [(u*x, v*y, -z*.5) for u, v in outline]
    vertices += [(u*x, v*y, z*.5) for u, v in outline]
    faces = [tuple(range(4, -1, -1)), tuple(range(5, 10))]
    faces += [(i, (i+1)%5, (i+1)%5+5, i+5) for i in range(5)]
    mesh = bpy.data.meshes.new("Hunter unique physical fracture " + name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Hunter destruction " + name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = root
    obj.location = location
    obj.rotation_euler = angles
    obj.data.materials.append(material)
    obj["hunter_destruction_only"] = True
    obj["damage_role"] = role
    obj["first_phase"] = first
    obj.hide_render = True
    return obj


def materials():
    lookup = {
        "blue": "Hunter graphite-blue ceramic armor",
        "silver": "Hunter brushed silver camo edges",
        "dark": "Hunter carbon track bed",
        "jade": "Hunter subtle adaptive optics",
        "amber": "Hunter exposed copper fracture",
    }
    result = {}
    for key, name in lookup.items():
        result[key] = bpy.data.materials.get(name)
        assert result[key] is not None, ("missing original material", name)
    seam = bpy.data.materials.new("Hunter dim exposed spectral fracture edge")
    seam.use_nodes = True
    bsdf = seam.node_tree.nodes.get("Principled BSDF")
    assert bsdf is not None
    bsdf.inputs["Base Color"].default_value = (.27, .52, .56, 1)
    bsdf.inputs["Metallic"].default_value = .30
    bsdf.inputs["Roughness"].default_value = .48
    bsdf.inputs["Emission Color"].default_value = (.10, .34, .32, 1)
    bsdf.inputs["Emission Strength"].default_value = .18
    result["seam"] = seam
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.resolution_x == 160
    assert scene.render.resolution_y == 160
    root = named("Coalition Camouflage Hunter COA-VEH-005 original 32 facing")
    hull = named("Hunter independent tracked suspension")
    turret = named("Hunter rotating adaptive-optic turret")
    vanes = sorted((o for o in bpy.data.objects if
                    o.name.startswith("Hunter independent optical camouflage vane hinge")),
                   key=lambda o: o.name)
    wheels = sorted((o for o in bpy.data.objects if
                     o.name.startswith("Hunter independently articulated roadwheel")),
                    key=lambda o: o.name)
    cleats = sorted((o for o in bpy.data.objects if
                     o.name.startswith("Hunter independent segmented tread cleat")),
                    key=lambda o: o.name)
    old_wreck = sorted((o for o in bpy.data.objects if o.get("wreckage_only")),
                      key=lambda o: o.name)
    effects = [o for o in bpy.data.objects if o.get("attack_only")]
    intact = [o for o in hull.children_recursive if o.type == "MESH"]
    assert (len(vanes), len(wheels), len(cleats), len(old_wreck), len(effects)) == (4, 8, 24, 14, 3)
    assert len(intact) >= 60, len(intact)
    m = materials()

    # The four damage phases change the physical silhouette: torn optical
    # vanes, detached turret/projector, split track guards and a low wreck.
    # Seams are restrained 3D solids and never replace broken structural mesh.
    specs = [
        ("01 peeled port vane", (-.48, -1.15, 1.58), (.87, .43, .22), (.24, .42, -.37), "blue", 1, "vane"),
        ("02 detached starboard vane", (.42, 1.16, 1.49), (.90, .42, .23), (-.25, .39, .34), "silver", 1, "vane"),
        ("03 split front projector hood", (1.53, -.43, 1.39), (.76, .41, .28), (.33, -.25, -.48), "silver", 1, "weapon"),
        ("04 torn left optical canopy", (-.64, -.83, 1.60), (.86, .47, .29), (.34, .35, -.45), "blue", 1, "canopy"),
        ("05 torn right optical canopy", (.26, .80, 1.52), (.83, .49, .26), (-.28, .38, .37), "blue", 2, "canopy"),
        ("06 severed rangefinder", (.96, -.90, 1.27), (.52, .29, .23), (.38, -.32, -.27), "jade", 1, "sensor"),
        ("07 collapsed turret ring", (-.20, -.63, 1.39), (.90, .43, .25), (.37, -.29, .42), "dark", 2, "turret"),
        ("08 buckled right turret shield", (-.36, .71, 1.37), (.80, .49, .32), (-.31, .32, -.38), "silver", 2, "turret"),
        ("09 snapped port tread guard", (-.81, -1.25, .64), (1.00, .37, .27), (.23, -.32, .39), "blue", 2, "track"),
        ("10 snapped starboard tread guard", (.35, 1.25, .60), (1.04, .34, .26), (-.31, .28, -.37), "blue", 2, "track"),
        ("11 shattered forward ceramic prow", (1.39, -.32, .69), (.82, .47, .29), (.34, -.36, .38), "silver", 2, "prow"),
        ("12 collapsed rear heat sink", (-1.35, .35, 1.04), (.76, .44, .29), (-.27, .30, -.31), "dark", 3, "engine"),
        ("13 exposed reactor shroud", (-1.03, -.52, .91), (.69, .48, .28), (.29, -.33, .40), "amber", 2, "reactor"),
        ("14 peeled upper armor", (-.24, -.16, 1.56), (.79, .57, .24), (.28, .40, -.32), "blue", 3, "roof"),
        ("15 fractured lower belly plate", (.30, .18, .41), (.95, .61, .22), (.23, -.37, .27), "dark", 3, "keel"),
        ("16 narrow port spectral seam", (.68, -.76, 1.06), (.70, .075, .065), (.19, -.13, .34), "seam", 0, "seam"),
        ("17 narrow starboard spectral seam", (.52, .75, 1.05), (.63, .075, .065), (-.16, .19, -.29), "seam", 0, "seam"),
        ("18 split emitter conductor seam", (-.18, -.08, 1.48), (.48, .075, .07), (.29, -.16, .31), "seam", 2, "seam"),
    ]
    fragments = [broken_piece(name, pos, size, rot, m[material], root, first, role)
                 for name, pos, size, rot, material, first, role in specs]
    assert len(fragments) == 18
    originals = [(tuple(o.location), tuple(o.rotation_euler)) for o in fragments]

    # Save a genuinely editable source in an INTACT, non-firing pose.
    root.rotation_euler = (0, 0, 0)
    hull.location.z = 0
    hull.rotation_euler = (0, 0, 0)
    turret.rotation_euler = (0, 0, 0)
    for vane in vanes:
        vane.rotation_euler = (0, 0, 0)
    for obj in intact:
        obj.hide_render = obj in effects
    for obj in fragments + old_wreck:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "coalition-hunter-four-stage-destruction.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler = (0, 0, facing * math.tau / FACINGS)
            hull.location.z = (-.03, -.10, -.19, -.28)[phase_index]
            hull.rotation_euler = (
                (.015, .055, .12, .18)[phase_index],
                (-.035, .075, .14, .20)[phase_index],
                (.025, -.065, .13, .17)[phase_index])
            turret.rotation_euler.z = (.035, -.13, -.28, -.42)[phase_index]
            for i, vane in enumerate(vanes):
                side = -1 if i < 2 else 1
                vane.rotation_euler = (
                    side * (.18, .42, .65, .81)[phase_index],
                    (.07, -.14, .31, .44)[phase_index] * (1 if i % 2 else -1),
                    (.02, .12, .23, .32)[phase_index] * (1 if i % 2 else -1))
            for i, wheel in enumerate(wheels):
                wheel.rotation_euler.y = (.06, .20, .38, .54)[phase_index] * (1 if i % 2 else -1)
            for obj in intact:
                name = obj.name.lower()
                hide = obj in effects
                if phase_index >= 1:
                    if "optical canopy" in name or "offset hatch optical slit" in name:
                        hide = True
                    if obj.parent == vanes[0] or obj.parent == vanes[1]:
                        hide = True
                    if any(t in name for t in ("rangefinder eye", "front emitter aperture")):
                        hide = True
                if phase_index >= 2:
                    if obj.parent in vanes:
                        hide = True
                    if any(t in name for t in (
                            "dual-spectrum projector", "emitter cradle",
                            "slanted ceramic emitter armor", "outer track fender",
                            "tapered track skirt", "rear stealth heatsink")):
                        hide = True
                if phase_index >= 3:
                    if any(t in name for t in (
                            "rotating optic pedestal", "exposed track rail",
                            "rear stealth heatsink", "faceted wheel hub",
                            "readable rotating hub spoke", "spectral vane trace")):
                        hide = True
                obj.hide_render = hide
            for i, obj in enumerate(old_wreck):
                obj.hide_render = phase_index < 2 or (
                    phase_index == 2 and i not in (0, 2, 4, 6, 8, 10, 12))
            for i, obj in enumerate(fragments):
                obj.hide_render = phase_index < obj["first_phase"]
                (x, y, z), rot = originals[i]
                scatter = (0, .045, .11, .18)[phase_index]
                obj.location = (
                    x + scatter * (1 if i % 2 else -1),
                    y + scatter * (1 if i % 3 else -1),
                    z - (0, .04, .15, .26)[phase_index])
                obj.rotation_euler = (
                    rot[0] + .12 * phase_index * (1 if i % 2 else -1),
                    rot[1] + .09 * phase_index * (1 if i % 3 else -1),
                    rot[2] + .14 * phase_index * (1 if i % 2 else -1))
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED HUNTER PHYSICAL DESTRUCTION", phase, FACINGS, flush=True)
    print("PREVIEW ONLY", source, "128 new RGBA frames; original atlas untouched", flush=True)


if __name__ == "__main__":
    main()
