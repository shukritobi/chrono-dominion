#!/usr/bin/env python3
"""Original preview-only critical/destroyed/power-out poses for three defense turrets.

Reopen a Blender-authored source .blend, retain the five-frame atlas unchanged,
save an independent editable wreckage source, and render three separate PNGs.
"""
import argparse
import sys
from pathlib import Path
import bpy

HIDE = {
 "coalition": {
  "critical": ("Optical turret housing", "Paired railgun.001", "Heat shielding.001"),
  "destroyed": ("Optical turret housing", "Paired railgun", "Heat shielding",
                "Weapon acquisition lens"),
 },
 "federation": {
  "critical": ("Armored recoil hood", "Recoiling muzzle"),
  "destroyed": ("Armored recoil hood", "Oversized cannon", "Recoiling muzzle",
                "Slanted front blast shield"),
 },
 "psionic": {
  "critical": ("Focused siege aperture", "Neural turret guard.002"),
  "destroyed": ("Focused siege aperture", "Neural turret guard", "Aperture lens",
                "Tip projectile"),
 },
}

def make_wreck(name, position, size, rotation, material, parent):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = rotation
    o.parent = parent
    o.data.materials.append(material)
    bevel = o.modifiers.new("Fractured hard edge", "BEVEL")
    bevel.width = .038
    bevel.segments = 2
    o.hide_render = True
    return o

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--faction", choices=tuple(HIDE), required=True)
    parser.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    a = parser.parse_args(argv)
    assert Path(bpy.data.filepath).name == a.faction+"-turret.blend"
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    root = bpy.data.objects.get("Animated "+a.faction+" turret")
    assert root, "Missing editable defense root"
    material = bpy.data.materials.get(a.faction+"_beveled_steel")
    emissive = bpy.data.materials.get(a.faction+"_emissive")
    assert material and emissive
    bsdf = emissive.node_tree.nodes.get("Principled BSDF")
    strength = bsdf.inputs["Emission Strength"]
    base_color = bsdf.inputs["Base Color"]
    old_strength = strength.default_value
    old_color = tuple(base_color.default_value)
    original = [o for o in scene.objects if o.type == "MESH"]
    assert len(original) >= 7
    initial = {o.name:o.hide_render for o in original}
    # Broken elevated equipment is deliberately visible outside the old
    # roofline at RTS 80px scale, rather than a subtle material-only effect.
    critical = [
      make_wreck("Critical-only collapsed gun carriage", (.74,-.56,1.71),
                 (1.46,.34,.36), (.08,.67,-.32), material, root),
      make_wreck("Critical-only torn armour fin", (-.22,-.73,2.03),
                 (.34,.38,1.12), (.42,.38,-.58), material, root),
    ]
    destroyed = [
      make_wreck("Destroyed-only fallen gun body", (1.02,-.72,.93),
                 (1.96,.52,.47), (.17,1.14,-.43), material, root),
      make_wreck("Destroyed-only buckled turret mast", (-.42,.55,1.04),
                 (.48,.47,1.69), (.79,.53,.18), material, root),
      make_wreck("Destroyed-only torn front glacis", (.77,.61,.79),
                 (1.35,.40,.36), (.19,-.37,.55), material, root),
    ]
    a.output.mkdir(parents=True,exist_ok=True)
    source = a.output/(a.faction+"-turret-extended-states.blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(source.resolve()),compress=True)
    for state in ("critical","destroyed","power_out"):
        for o in original:
            o.hide_render = initial[o.name]
        for o in critical+destroyed:
            o.hide_render = True
        strength.default_value = old_strength
        base_color.default_value = old_color
        if state in ("critical","destroyed"):
            prefixes = HIDE[a.faction][state]
            matches = [o for o in original if o.name.startswith(prefixes)]
            assert matches, (state,prefixes,[o.name for o in original])
            for o in matches:
                o.hide_render = True
            for o in (critical if state=="critical" else destroyed):
                o.hide_render = False
        if state == "power_out":
            strength.default_value = 0
            base_color.default_value = (.035,.042,.05,1)
        bpy.context.view_layer.update()
        scene.render.resolution_x = scene.render.resolution_y = 160
        scene.render.resolution_percentage = 100
        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.color_mode = "RGBA"
        scene.render.filepath = str((a.output/(state+".png")).resolve())
        bpy.ops.render.render(write_still=True)
        print("RENDERED",a.faction,state,flush=True)
    assert source.stat().st_size > 1000
    print("PASS preview-only editable defense wreckage",source,flush=True)

if __name__=="__main__":
    main()
