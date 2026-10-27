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
  "critical": ("Focused siege aperture", "Neural turret guard", "Aperture lens"),
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
    if a.faction == "psionic":
        # Earlier Psionic critical pose changed only 5 alpha pixels at 80px:
        # the fracture fin was occluded by the intact floating guard.
        # Lift the broken fin beyond the original upper silhouette.
        critical[1].location = (-.46,-.96,3.14)
        critical[1].rotation_euler = (.31,.42,-.59)
    destroyed = [
      make_wreck("Destroyed-only fallen gun body", (1.02,-.72,.93),
                 (1.96,.52,.47), (.17,1.14,-.43), material, root),
      make_wreck("Destroyed-only buckled turret mast", (-.42,.55,1.04),
                 (.48,.47,1.69), (.79,.53,.18), material, root),
      make_wreck("Destroyed-only torn front glacis", (.77,.61,.79),
                 (1.35,.40,.36), (.19,-.37,.55), material, root),
    ]
    if a.faction == "federation":
        # 80px visual repair: the original destroyed pose read as a smooth
        # intact bunker. Split its roof and front armour into exposed,
        # independently editable pieces, with genuinely raised fracture edges.
        # These are wreckage-only meshes; the intact five-frame atlas is untouched.
        fracture = bpy.data.materials.new("Federation exposed orange fracture edges")
        fracture.use_nodes = True
        shader = fracture.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = (.88,.28,.055,1)
        shader.inputs["Metallic"].default_value = .18
        shader.inputs["Roughness"].default_value = .46
        shader.inputs["Emission Color"].default_value = (1,.20,.018,1)
        shader.inputs["Emission Strength"].default_value = 1.25
        destroyed.extend([
            make_wreck("Destroyed-only Federation peeled left roof armour",
                       (-.55,-.40,2.04),(.73,.28,.66),(.23,.62,-.25),material,root),
            make_wreck("Destroyed-only Federation peeled right roof armour",
                       (.38,-.63,2.12),(.63,.25,.76),(.44,-.49,.38),material,root),
            make_wreck("Destroyed-only Federation torn front wall slab",
                       (.88,-.96,1.05),(.95,.30,.58),(.25,-.31,.41),material,root),
            make_wreck("Destroyed-only Federation raised roof debris spike",
                       (-.84,-.30,2.29),(.30,.27,.86),(.35,.57,.55),material,root),
            make_wreck("Destroyed-only Federation exposed left fracture",
                       (.35,-1.12,1.24),(.09,.09,.96),(.15,.20,-.45),fracture,root),
            make_wreck("Destroyed-only Federation exposed right fracture",
                       (1.02,-.99,1.10),(.09,.09,.86),(.12,.40,.30),fracture,root),
            make_wreck("Destroyed-only Federation glowing split roof edge",
                       (-.12,-.82,1.98),(.74,.09,.09),(.35,.40,.13),fracture,root),
        ])
        assert len(critical)+len(destroyed)==12
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
