#!/usr/bin/env python3
"""COA-VEH-004: original dual-ion four-phase Warden attack, preview only.

Reopens the validated editable Warden from Actions run 40471597359 and
renders ONLY 128 new charge/synchronize/volley/cooldown sprites. The existing
128-frame atlas, all live textures and manifests are never opened for writing.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("charge", "synchronize", "volley", "cooldown")
FACINGS = 32


def get(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Archived Warden geometry missing: " + name)
    return obj


def glow(name, color, strength):
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Emission Color"].default_value = color
    shader.inputs["Emission Strength"].default_value = strength
    return material


def mark(obj, parent, material):
    obj.parent = parent
    obj.data.materials.append(material)
    obj["warden_temporal_only"] = True
    obj.hide_render = True
    return obj


def coil(name, parent, x, y, radius, material):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=24, minor_segments=8,
        major_radius=radius, minor_radius=.031,
        location=(x, y, .26))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return mark(obj, parent, material)


def bolt(name, parent, y, material):
    bpy.ops.mesh.primitive_cone_add(
        vertices=18, radius1=.105, radius2=.024, depth=.42,
        location=(2.11, y, .26))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return mark(obj, parent, material)


def ribbon(name, parent, y, angle, material):
    """True editable five-section faceted ion streamer, not a sprite decal."""
    vertices = []
    for i, x in enumerate((1.76, 1.88, 2.03, 2.18, 2.31)):
        radius = (.07, .17, .12, .19, .08)[i]
        phase = angle + (0, .29, -.23, .16, 0)[i]
        dy = radius * math.cos(phase)
        dz = radius * math.sin(phase)
        width = .025 if i in (0, 4) else .038
        vertices.extend((
            (x, y + dy - width, .26 + dz + width),
            (x, y + dy + width, .26 + dz - width),
        ))
    faces = [(2*i, 2*i+1, 2*i+3, 2*i+2) for i in range(4)]
    data = bpy.data.meshes.new(name + " faceted geometry")
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    return mark(obj, parent, material)


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

    root = get("Coalition Autonomous Warden Tank - original 32-facing source")
    hull = get("Autonomous low profile split-track hull")
    crown = get("Gyrostabilised faceted autonomous targeting crown")
    old_bolt = get("Attack-only coherent ion bolt")
    old_flash = get("Attack-only ion muzzle discharge")
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    cleats = [o for o in bpy.data.objects
              if o.name.startswith("Independently cycling track cleat")]
    barrels = [o for o in bpy.data.objects
               if o.name.startswith("Independent ion accelerator barrel")]
    assert len(wreck) == 8 and len(cleats) == 18 and len(barrels) == 2

    cyan = glow("Warden temporal ion induction cyan", (.045, .68, 1, 1), 1.50)
    ice = glow("Warden temporal ion coherent white", (.36, .93, 1, 1), 2.05)
    teal = glow("Warden temporal discharge afterglow", (.08, .90, .72, 1), 1.15)
    coils = []
    rings = []
    bolts = []
    ribbons = []
    for side in (-1, 1):
        y = side * .50
        for i, x in enumerate((1.34, 1.49, 1.64)):
            coils.append(coil(
                "Warden temporal %s induction coil %d" %
                ("port" if side < 0 else "starboard", i),
                crown, x, y, .16 + i*.018, cyan))
        for i, x in enumerate((1.81, 1.99)):
            rings.append(coil(
                "Warden temporal %s expanding wave %d" %
                ("port" if side < 0 else "starboard", i),
                crown, x, y, .25 + i*.055, ice))
        bolts.append(bolt(
            "Warden temporal %s coherent ion penetrator" %
            ("port" if side < 0 else "starboard"), crown, y, ice))
        for i in range(2):
            ribbons.append(ribbon(
                "Warden temporal %s jagged ion ribbon %d" %
                ("port" if side < 0 else "starboard", i),
                crown, y, i*math.pi+.4, teal))
    added = coils + rings + bolts + ribbons
    assert len(added) == 16

    root.rotation_euler = (0, 0, 0)
    hull.location.z = 0
    hull.rotation_euler = (0, 0, 0)
    crown.rotation_euler = (0, 0, 0)
    for obj in added + wreck + [old_bolt, old_flash]:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "coalition-warden-temporal-attack.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler.z = facing * math.tau / FACINGS
            hull.location.z = (0, -.014, -.064, .012)[phase_index]
            hull.rotation_euler.y = (0, -.008, .035, -.009)[phase_index]
            crown.rotation_euler.z = (.025, .06, -.075, .018)[phase_index]
            crown.rotation_euler.y = (.005, -.020, -.085, .013)[phase_index]
            for i, obj in enumerate(coils):
                obj.hide_render = phase == "cooldown" and i % 3 != 0
                scale = (.67, .92, 1.20, .50)[phase_index]
                obj.scale = (scale, scale, scale)
            for i, obj in enumerate(rings):
                obj.hide_render = phase == "charge" or (
                    phase == "cooldown" and i % 2 == 1)
                scale = (.62, .78, 1.18, .57)[phase_index]
                obj.scale = (scale, scale, scale)
            for obj in bolts:
                obj.hide_render = phase not in ("synchronize", "volley")
                scale = (.60, .63, 1.00, .50)[phase_index]
                obj.scale = (scale, scale, scale)
            for obj in ribbons:
                obj.hide_render = phase != "volley"
            for obj in wreck + [old_bolt, old_flash]:
                obj.hide_render = True
            bpy.context.view_layer.update()
            path = out / "frames" / phase / ("%02d.png" % facing)
            path.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED WARDEN TEMPORAL", phase, "32 facings", flush=True)
    print("PREVIEW_ONLY", source, "128 new frames; archived atlas untouched",
          flush=True)


if __name__ == "__main__":
    main()
