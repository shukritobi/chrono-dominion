#!/usr/bin/env python3
"""FED-VEH-002: original Bull electrothermal four-beat firing geometry.

Reuse the archived validated Blender source from Actions #40501761698.
Only render NEW charge/focus/discharge/recover frames. No live atlas writes.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy

PHASES = ("charge", "focus", "discharge", "recover")


def get(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Missing saved Federation Bull object: " + name)
    return obj


def emission(name, color, strength):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Emission Color"].default_value = color
    bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def mark(obj, parent, material):
    obj.parent = parent
    obj.data.materials.append(material)
    obj["bull_temporal_only"] = True
    obj.hide_render = True
    return obj


def torus(name, parent, x, radius, material):
    bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=8,
        major_radius=radius, minor_radius=.045, location=(x, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
    return mark(obj, parent, material)


def cylinder(name, parent, x, y, z, radius, length, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius,
        depth=length, location=(x, y, z))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2
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

    root = get("Federation Bull Heavy Tank - original P0 art pilot")
    hull = get("Bull independent tracked chassis")
    turret = get("Bull independent block turret and bearing")
    gun = get("Bull electrothermal main cannon recoil assembly")
    old_flash = get("Attack-only electrothermal muzzle burst")
    old_ring = get("Attack-only plasma shock collar")
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    assert len(wreck) == 8, len(wreck)

    orange = emission("Bull thermal orange charging coil", (1, .26, .035, 1), 2.8)
    white = emission("Bull white-hot electrothermal plasma", (1, .83, .47, 1), 3.3)
    ember = emission("Bull ember red discharge shards", (.9, .08, .025, 1), 2.4)
    coils = [torus("Bull temporal induction coil %d" % i, gun, x, .30, orange)
             for i, x in enumerate((.75, 1.04, 1.34))]
    rings = [torus("Bull temporal shockwave ring %d" % i, gun, x, radius, white)
             for i, (x, radius) in enumerate(((2.09, .37), (2.30, .29)))]
    core = cylinder("Bull temporal condensed plasma bolt", gun, 2.33, 0, 0,
                    .15, .38, white)
    sparks = []
    for i in range(6):
        angle = i * math.tau / 6
        obj = cylinder("Bull temporal radial vent shard %d" % i, gun, 2.27,
                       .29 * math.cos(angle), .29 * math.sin(angle),
                       .055, .25, ember)
        obj.rotation_euler = (0, math.pi / 2, angle)
        sparks.append(obj)
    added = coils + rings + [core] + sparks
    assert len(added) == 12

    root.rotation_euler = (0, 0, 0)
    hull.location.z = 0
    hull.rotation_euler = (0, 0, 0)
    turret.rotation_euler.z = 0
    gun.location.x = .82
    gun.rotation_euler.y = 0
    for obj in added + wreck + [old_flash, old_ring]:
        obj.hide_render = True
    source = out / "federation-bull-temporal-attack.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(32):
            root.rotation_euler.z = facing * math.tau / 32
            hull.location.z = (0, -.018, -.085, .012)[phase_index]
            hull.rotation_euler.y = (0, -.008, .052, -.015)[phase_index]
            turret.rotation_euler.z = (0, .02, -.07, .018)[phase_index]
            gun.location.x = (.82, .79, .61, .76)[phase_index]
            gun.rotation_euler.y = (0, -.018, -.085, .024)[phase_index]
            old_flash.hide_render = phase != "discharge"
            old_ring.hide_render = phase != "discharge"
            for i, obj in enumerate(coils):
                obj.hide_render = (phase == "recover" and i != 0)
                factor = ((.68, .78, .90), (.9, 1.05, 1.17),
                          (1.23, 1.30, 1.39), (.60, .70, .70))[phase_index][i]
                obj.scale = (factor, factor, factor)
            for i, obj in enumerate(rings):
                obj.hide_render = (phase == "charge" or
                                   (phase == "recover" and i == 1))
                factor = ((.55, .65), (.79, .90),
                          (1.12, 1.26), (.60, .55))[phase_index][i]
                obj.scale = (factor, factor, factor)
            core.hide_render = phase not in ("focus", "discharge")
            core.scale.x = (1, .7, 1.15, 1)[phase_index]
            for i, obj in enumerate(sparks):
                obj.hide_render = (phase != "discharge" and
                                   not (phase == "recover" and i % 3 == 0))
            for obj in wreck:
                obj.hide_render = True
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED BULL TEMPORAL", phase, "32 original facings", flush=True)
    print("PREVIEW_ONLY", source, "128 new frames; original atlas untouched", flush=True)


if __name__ == "__main__":
    main()
