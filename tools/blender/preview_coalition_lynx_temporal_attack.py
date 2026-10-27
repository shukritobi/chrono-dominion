#!/usr/bin/env python3
"""COA-VEH-002 Lynx: original four-beat electromagnetic firing geometry.

Load the already validated editable Lynx .blend from Actions #40494276431.
Render ONLY the new charge/lock/discharge/recover frames. Do not touch
the archived 128-frame atlas, live game textures, or manifests.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("charge", "lock", "discharge", "recover")
FACINGS = 32


def get(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Archived Lynx geometry missing: " + name)
    return obj


def emissive(name, rgba, strength):
    material = bpy.data.materials.new(name)
    material.diffuse_color = rgba
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Emission Color"].default_value = rgba
    bsdf.inputs["Emission Strength"].default_value = strength
    return material


def mark(obj, parent, material):
    obj.parent = parent
    obj.data.materials.append(material)
    obj["lynx_temporal_only"] = True
    obj.hide_render = True
    return obj


def torus(name, parent, x, radius, thickness, material):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=32, minor_segments=8,
        major_radius=radius, minor_radius=thickness,
        location=(x, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return mark(obj, parent, material)


def rail(name, parent, x, y, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, .025))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (1.02, .07, .065)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return mark(obj, parent, material)


def bolt(name, parent, material):
    bpy.ops.mesh.primitive_cone_add(
        vertices=20, radius1=.11, radius2=.022, depth=.50,
        location=(2.77, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return mark(obj, parent, material)


def arc(name, parent, angle, material):
    """An independently editable jagged four-segment energy ribbon mesh."""
    verts = []
    for i, x in enumerate((2.11, 2.32, 2.50, 2.73, 2.95)):
        radius = (.13, .25, .16, .24, .12)[i]
        phase = angle + ((-.16, .25, -.24, .18, 0)[i])
        y = radius * math.cos(phase)
        z = radius * math.sin(phase)
        thickness = .027 if i in (0, 4) else .044
        verts.extend(((x, y - thickness * math.sin(phase),
                       z + thickness * math.cos(phase)),
                      (x, y + thickness * math.sin(phase),
                       z - thickness * math.cos(phase))))
    faces = [(2*i, 2*i+1, 2*i+3, 2*i+2) for i in range(4)]
    mesh = bpy.data.meshes.new(name + " editable mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return mark(obj, parent, material)


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

    root = get("Coalition Lynx Battle Tank - original P0 32-facing")
    running = get("Lynx articulated tracked lower hull")
    turret = get("Lynx independently traversing single-cannon turret")
    gun = get("Elevating electromagnetic single gun and recoil mount")
    old_flash = get("Attack-only lance-shaped ion blast")
    old_halo = get("Attack-only ion muzzle halo")
    wreck = [obj for obj in bpy.data.objects if obj.get("wreckage_only")]
    wheels = [obj for obj in bpy.data.objects
              if obj.name.startswith("Independent roadwheel pivot")]
    cleats = [obj for obj in bpy.data.objects
              if obj.name.startswith("Independent animated tread cleat")]
    assert len(wreck) == 8 and len(wheels) == 12 and len(cleats) == 22

    azure = emissive("Lynx temporal restrained induction cyan",
                     (.035, .55, .87, 1), 1.65)
    ice = emissive("Lynx temporal cold blue-white lance",
                   (.37, .90, 1, 1), 2.15)
    teal = emissive("Lynx temporal fading field mint",
                    (.12, .80, .68, 1), 1.20)

    coils = [torus("Lynx temporal independent charging coil %d" % i,
                   gun, x, .225, .036, azure)
             for i, x in enumerate((.80, 1.10, 1.42))]
    rails = [rail("Lynx temporal exposed capacitor rail %s" %
                  ("port" if side < 0 else "starboard"),
                  gun, 1.27, side * .25, teal)
             for side in (-1, 1)]
    rings = [torus("Lynx temporal expanding muzzle wave %d" % i,
                   gun, x, radius, .038, ice)
             for i, (x, radius) in enumerate(((2.30, .32), (2.57, .40)))]
    projectile = bolt("Lynx temporal tapered ion penetrator", gun, ice)
    arcs = [arc("Lynx temporal jagged discharge ribbon %d" % i,
                gun, i * math.tau / 4, ice) for i in range(4)]
    added = coils + rails + rings + [projectile] + arcs
    assert len(added) == 12

    root.rotation_euler = (0, 0, 0)
    running.location.z = 0
    running.rotation_euler = (0, 0, 0)
    turret.rotation_euler.z = 0
    gun.location.x = .63
    gun.rotation_euler.y = 0
    for obj in added + wreck + [old_flash, old_halo]:
        obj.hide_render = True
    bpy.context.view_layer.update()

    source = out / "coalition-lynx-temporal-attack.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler.z = facing * math.tau / FACINGS
            running.location.z = (0, -.012, -.072, .010)[phase_index]
            running.rotation_euler.y = (0, -.007, .040, -.012)[phase_index]
            turret.rotation_euler.z = (0, .022, -.055, .012)[phase_index]
            gun.location.x = (.63, .40, .42, .57)[phase_index]  # lock: retract to prevent 1px clipping at facings 03/19
            gun.rotation_euler.y = (0, -.010, -.055, .017)[phase_index]
            for i, obj in enumerate(coils):
                obj.hide_render = phase == "recover" and i > 0
                factor = ((.65, .68, .72), (.85, 1.0, 1.14),
                          (1.12, 1.21, 1.27), (.54, .54, .54))[phase_index][i]
                obj.scale = (factor, factor, factor)
            for obj in rails:
                obj.hide_render = phase == "recover"
            for i, obj in enumerate(rings):
                obj.hide_render = (phase == "charge" or
                                   (phase == "recover" and i == 1))
                factor = ((.55, .55), (.78, .82),
                          (1.14, 1.27), (.62, .62))[phase_index][i]
                obj.scale = (factor, factor, factor)
            projectile.hide_render = phase not in ("lock", "discharge")
            projectile.scale = ((.55, .60, .60), (.68, .72, .72),
                                (1.0, 1.0, 1.0), (.55, .60, .60))[phase_index]
            for obj in arcs:
                obj.hide_render = phase != "discharge"
            old_flash.hide_render = True  # avoid overexposing the long barrel
            old_halo.hide_render = phase != "discharge"
            for obj in wreck:
                obj.hide_render = True
            bpy.context.view_layer.update()
            path = out / "frames" / phase / ("%02d.png" % facing)
            path.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED LYNX TEMPORAL", phase, "32 facings", flush=True)
    print("PREVIEW_ONLY", source, "128 NEW frames; archived atlas untouched",
          flush=True)


if __name__ == "__main__":
    main()
