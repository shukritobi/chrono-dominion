#!/usr/bin/env python3
"""FED-VEH-002: original four-stage physical Bull destruction (PREVIEW ONLY).

Loads the already validated Bull .blend from Actions #40501761698. Renders
ONLY new destruction poses, never the archived idle/move/attack/death atlas.
Every fracture is an independent, closed, editable 3D volume.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32
FLAG = "bull_destruction_only"
FACES = ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
         (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7))


def require(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Validated Bull source missing: " + name)
    return obj


def fracture(name, location, dimensions, material, parent, first_phase, role):
    """Closed eight-vertex asymmetric fracture, not a planar fake decal."""
    x, y, z = dimensions
    verts = [(-.56*x, -.43*y, -.42*z), (.44*x, -.47*y, -.53*z),
             (.57*x, .28*y, -.32*z), (-.35*x, .56*y, -.46*z),
             (-.42*x, -.37*y, .51*z), (.35*x, -.52*y, .40*z),
             (.48*x, .35*y, .46*z), (-.51*x, .27*y, .56*z)]
    mesh = bpy.data.meshes.new(name + " independent closed mesh")
    mesh.from_pydata(verts, [], FACES)
    mesh.update()
    assert len(mesh.vertices) == 8 and len(mesh.polygons) == 6
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.data.materials.append(material)
    obj[FLAG] = True
    obj["first_phase"] = first_phase
    obj["damage_role"] = role
    obj.hide_render = True
    return obj


def fracture_light():
    mat = bpy.data.materials.new("Bull restrained molten copper fracture edge")
    mat.diffuse_color = (.52, .18, .06, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (.52, .18, .06, 1)
    bsdf.inputs["Emission Color"].default_value = (.85, .30, .09, 1)
    bsdf.inputs["Emission Strength"].default_value = .34
    return mat


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = parser.parse_args(argv).output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x, scene.render.resolution_y) == (160, 160)

    root = require("Federation Bull Heavy Tank - original P0 art pilot")
    hull = require("Bull independent tracked chassis")
    turret = require("Bull independent block turret and bearing")
    gun = require("Bull electrothermal main cannon recoil assembly")
    flash = require("Attack-only electrothermal muzzle burst")
    ring = require("Attack-only plasma shock collar")
    wheels = [o for o in bpy.data.objects
              if o.name.startswith("Bull independent roadwheel pivot")]
    cleats = [o for o in bpy.data.objects
              if o.name.startswith("Bull individually animated track cleat")]
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    original = [o for o in hull.children_recursive if o.type == "MESH"]
    assert len(wheels) == 14 and len(cleats) == 24 and len(wreck) == 8
    assert len(original) > 65

    red = require("Massive low siege hull").data.materials[0]
    rust = require("Bull original slab angled battering ram glacis").data.materials[0]
    pale = require("Federation reinforced prow breaker").data.materials[0]
    dark = require("Recessed black belly pan").data.materials[0]
    bronze = require("Massive bronze rotating turret race").data.materials[0]
    seam = fracture_light()
    specs = [
        ("B01 torn left battering glacis", (1.42, -.57, 1.00), (.80, .38, .23), rust, 1, "glacis"),
        ("B02 torn right battering glacis", (1.39, .57, .96), (.73, .39, .21), rust, 1, "glacis"),
        ("B03 sheared port track shroud", (.60, -1.10, .81), (.83, .28, .23), red, 1, "track"),
        ("B04 buckled starboard track lip", (.61, 1.11, .82), (.81, .26, .20), pale, 1, "track"),
        ("B05 ripped observation cupola", (-.65, -.46, 1.96), (.47, .38, .23), red, 1, "cupola"),
        ("B06 left copper-hot fracture seam", (-.24, -.49, 1.37), (.59, .075, .08), seam, 0, "seam"),
        ("B07 right copper-hot fracture seam", (.29, .50, 1.34), (.55, .075, .08), seam, 0, "seam"),
        ("B08 broken muzzle brake", (1.81, -.32, 1.45), (.58, .28, .25), dark, 2, "barrel"),
        ("B09 severed thermal barrel sleeve", (1.49, .34, 1.39), (.76, .29, .27), pale, 2, "barrel"),
        ("B10 exploded cannon breech", (.77, -.35, 1.58), (.66, .43, .35), dark, 2, "breech"),
        ("B11 collapsed turret left cheek", (-.21, -.79, 1.55), (.82, .48, .33), red, 2, "turret"),
        ("B12 displaced turret right cheek", (.05, .78, 1.50), (.77, .42, .29), rust, 2, "turret"),
        ("B13 fractured bearing race", (-.10, .18, 1.29), (.66, .49, .22), bronze, 2, "bearing"),
        ("B14 exposed core fracture", (-.69, -.12, 1.26), (.58, .09, .10), seam, 2, "seam"),
        ("B15 sheared port drive tooth", (-1.34, -1.04, .48), (.50, .33, .23), dark, 3, "track"),
        ("B16 broken starboard sprocket", (-1.33, 1.03, .46), (.49, .34, .22), bronze, 3, "track"),
        ("B17 peeled engine roof panel", (-1.04, -.37, 1.05), (.79, .53, .20), red, 3, "engine"),
        ("B18 severed exhaust chimney", (-1.29, .47, 1.21), (.36, .29, .58), dark, 3, "exhaust"),
        ("B19 torn undercarriage brace", (-.28, .04, .42), (.97, .25, .19), pale, 3, "frame"),
        ("B20 cracked rear armour slab", (-1.10, .50, .92), (.68, .38, .19), rust, 3, "armor"),
    ]
    fragments = [fracture(name, pos, dim, mat, root, phase, role)
                 for name, pos, dim, mat, phase, role in specs]
    assert len(fragments) == 20
    origins = [tuple(o.location) for o in fragments]

    # Save a neutral, intact editable .blend with new geometry hidden.
    root.rotation_euler = (0, 0, 0)
    hull.location = (0, 0, 0)
    hull.rotation_euler = (0, 0, 0)
    turret.rotation_euler = (0, 0, 0)
    gun.rotation_euler = (0, 0, 0)
    gun.location.x = .82
    for obj in original:
        obj.hide_render = False
    for obj in fragments + wreck + [flash, ring]:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "federation-bull-four-stage-destruction.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for p, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler = (0, 0, facing * math.tau / FACINGS)
            hull.location.z = (-.035, -.10, -.19, -.26)[p]
            hull.rotation_euler = ((.02, .065, .12, .17)[p],
                                   (-.025, .09, .16, .20)[p],
                                   (.01, -.025, .06, .11)[p])
            turret.rotation_euler = ((.015, .07, .17, .24)[p],
                                     (-.025, .10, .22, .29)[p],
                                     (.035, -.14, .24, .37)[p])
            gun.rotation_euler.y = (.025, .16, .32, .45)[p]
            gun.location.x = (.82, .66, .49, .35)[p]
            for wheel in wheels:
                wheel.rotation_euler.y = (0, .12, .26, .31)[p]
            for obj in original:
                name = obj.name.lower()
                hide = False
                if p >= 1 and any(token in name for token in (
                    "turret roof slab", "commander heavy observation",
                    "low commander sensor", "segmented sand colored track lip",
                    "armored track shroud")):
                    hide = True
                if p >= 2 and any(token in name for token in (
                    "turret side armor", "turret side ammo", "square armored front",
                    "barrel thermal sleeve", "muzzle brake", "muzzle bore",
                    "single oversized electrothermal cannon",
                    "cannon exterior cooling", "electrothermal breech")):
                    hide = True
                if p == 3 and any(token in name for token in (
                    "turret", "gun", "cannon", "commander", "ammo",
                    "ballistic counterweight", "rear vertical smoke stack",
                    "smoke stack bright", "sunken engine roof",
                    "independent side armor block")):
                    hide = True
                obj.hide_render = hide or obj in (flash, ring)
            for i, obj in enumerate(wreck):
                obj.hide_render = p < 2 or (p == 2 and i not in (0, 1, 2, 4, 7))
            for i, obj in enumerate(fragments):
                obj.hide_render = p < obj["first_phase"]
                x, y, z = origins[i]
                scatter = (0, .035, .095, .15)[p]
                obj.location = (x + scatter * (1 if i % 2 else -1),
                                y + scatter * (1 if i % 3 else -1),
                                z - (0, .045, .15, .25)[p])
                obj.rotation_euler = (.12 * p * (1 if i % 2 else -1),
                                      .08 * p * (1 if i % 3 else -1),
                                      .14 * p * (1 if i % 2 else -1))
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED BULL PHYSICAL DESTRUCTION", phase, FACINGS, flush=True)
    print("PREVIEW_ONLY", source, "128 NEW destruction sprites", flush=True)


if __name__ == "__main__":
    main()
