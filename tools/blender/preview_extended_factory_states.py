#!/usr/bin/env python3
"""Preview-only Psionic factory CRITICAL / DESTROYED / POWER-OUT states.

Runs against a reopened original five-state .blend source. Creates a second
editable .blend and THREE separate RGBA images in an independent directory.
Never changes animated_assets.FRAME_PLAN, the 160x800 game atlas or manifests.

  blender -b psionic-factory.blend --python-exit-code 1 \\
    --python tools/blender/preview_extended_factory_states.py -- \\
    --output generated/psionic-extra-states
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

def options():
    p = argparse.ArgumentParser()
    p.add_argument("--output", type=Path, required=True)
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return p.parse_args(a)

def build_debris(root, material):
    wreck = []
    specifications = (
        ("Destroyed-only fallen left fork", (1.10, -.88, .95),
         (.46, .48, 1.75), (0, 1.19, -.34)),
        ("Destroyed-only fallen right fork", (.46, .74, .90),
         (.45, .47, 1.48), (.32, -1.27, .11)),
        ("Destroyed-only broken portal lintel", (.94, -.19, .97),
         (1.70, .18, .19), (.21, .48, -.32)),
    )
    for name, location, size, rotation in specifications:
        bpy.ops.mesh.primitive_cube_add(size=1, location=location)
        o = bpy.context.object
        o.name = name
        o.dimensions = size
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        o.rotation_euler = rotation
        o.parent = root
        o.data.materials.append(material)
        bevel = o.modifiers.new("Bent broken metal edges", "BEVEL")
        bevel.width = .035
        bevel.segments = 2
        o.hide_render = True
        wreck.append(o)
    return wreck

def main():
    args = options()
    assert bpy.data.filepath.endswith("psionic-factory.blend"), (
        "Reopen the source Psionic factory .blend before rendering extra states"
    )
    out = args.output
    out.mkdir(parents=True, exist_ok=True)
    sc = bpy.context.scene
    assert sc.camera and sc.render.film_transparent, "Expected original transparent RTS scene"
    root = bpy.data.objects.get("Animated psionic factory")
    assert root, "Missing editable Psionic factory source"
    mesh_objects = [o for o in sc.objects if o.type == "MESH"]
    assert len(mesh_objects) >= 30, len(mesh_objects)
    material = bpy.data.materials.get("psionic_beveled_steel")
    emissive = bpy.data.materials.get("psionic_emissive")
    assert material and emissive and emissive.use_nodes
    bsdf = emissive.node_tree.nodes.get("Principled BSDF")
    assert bsdf and bsdf.inputs.get("Emission Strength")
    original_emission = bsdf.inputs["Emission Strength"].default_value
    original_color = tuple(bsdf.inputs["Base Color"].default_value)
    debris = build_debris(root, material)
    initial = {o.name: o.hide_render for o in sc.objects if o.type == "MESH"}
    # Save editable source with ALL wreckage hidden and original materials.
    saved = out / "psionic-factory-extended-states.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(saved.resolve()), compress=True)
    print("Saved preview-only editable extended source:", saved, flush=True)

    for state in ("critical", "destroyed", "power_out"):
        for o in sc.objects:
            if o.type == "MESH":
                o.hide_render = initial[o.name]
        bsdf.inputs["Emission Strength"].default_value = original_emission
        bsdf.inputs["Base Color"].default_value = original_color
        if state in ("critical", "destroyed"):
            for o in mesh_objects:
                if o.name.startswith("Damaged fractured facade slab"):
                    o.hide_render = False
            for i, o in enumerate(debris):
                o.hide_render = (state == "critical" and i > 0)
            for o in mesh_objects:
                # The destroyed silhouette is physically lower, with both
                # elevated signature horns and portal trusses removed.
                if state == "destroyed" and o.name.startswith((
                    "Tall vertical fabrication fork", "Asymmetric fork spearhead",
                    "Fork internal reactor slit", "Matter-stabilizer light",
                    "Elevated portal side truss", "Open fabrication bay lintel",
                    "Oscillating levitation gripper", "Gantry vertical hoist",
                    "Held assembly nucleus", "Matter synthesis flash",
                )):
                    o.hide_render = True
                elif state == "critical" and o.name in (
                    "Tall vertical fabrication fork.001",
                    "Asymmetric fork spearhead.001",
                    "Fork internal reactor slit.001",
                    "Matter-stabilizer light.001",
                ):
                    o.hide_render = True
        if state == "power_out":
            # Intact physical architecture, fully extinguished reactor glow.
            bsdf.inputs["Emission Strength"].default_value = 0
            bsdf.inputs["Base Color"].default_value = (.045, .055, .065, 1)
            for o in mesh_objects:
                if o.name.startswith("Visible animated base telemetry lamp"):
                    o.hide_render = True
        bpy.context.view_layer.update()
        target = out / (state + ".png")
        sc.render.filepath = str(target.resolve())
        sc.render.image_settings.file_format = "PNG"
        sc.render.image_settings.color_mode = "RGBA"
        sc.render.resolution_x = sc.render.resolution_y = 160
        bpy.ops.render.render(write_still=True)
        print("Rendered extra preview state:", state, target, flush=True)
    assert saved.stat().st_size > 1000
    print("PASS: three additional preview states; five-frame game atlas unchanged")

if __name__ == "__main__":
    main()
