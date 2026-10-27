#!/usr/bin/env python3
"""Preview-only, editable Blender critical/destroyed/power-out airfield wreckage.

Reopens each previously authored source, saves a distinct .blend, and renders
three independent RGBA PNGs. Never modifies the five-frame game atlas.
"""
import argparse
import sys
from pathlib import Path
import bpy

# Remove actual signature upper components rather than tinting an intact roof.
HIDE = {
    "coalition": {
        "critical": ("Flight control tower", "Aerodynamic shelter roof"),
        "destroyed": ("Flight control tower", "Aerodynamic shelter roof",
                      "Wide aerospace hangar", "Aircraft loading mouth"),
    },
    "federation": {
        "critical": ("Roof flak cupola", "Rooftop anti-air barrel",
                     "Layered anti-air roof"),
        "destroyed": ("Roof flak cupola", "Rooftop anti-air barrel",
                      "Layered anti-air roof", "Hardened aircraft bunker",
                      "Aircraft blast bay"),
    },
    "psionic": {
        "critical": ("Landing arc guide", "Focusing landing orb",
                     "Psionic flight field"),
        "destroyed": ("Landing arc guide", "Focusing landing orb",
                      "Psionic flight field", "Levitating central deck",
                      "Aircraft locator"),
    },
}

def shard(name, pos, dims, angles, mat, parent):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler = angles
    obj.data.materials.append(mat)
    obj.parent = parent
    bevel = obj.modifiers.new("Torn fracture edge", "BEVEL")
    bevel.width = .022
    bevel.segments = 2
    obj.hide_render = True
    return obj

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--faction", choices=tuple(HIDE), required=True)
    p.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    a = p.parse_args(argv)
    assert Path(bpy.data.filepath).name == a.faction+"-airfield.blend"
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    root = bpy.data.objects.get("Animated "+a.faction+" airfield")
    assert root, "Editable airfield root missing"
    metal = bpy.data.materials.get(a.faction+"_beveled_steel")
    armor = bpy.data.materials.get(a.faction+"_painted_metal")
    glow = bpy.data.materials.get(a.faction+"_emissive")
    assert metal and armor and glow
    bsdf = glow.node_tree.nodes.get("Principled BSDF")
    strength = bsdf.inputs["Emission Strength"]
    color = bsdf.inputs["Base Color"]
    initial_strength = strength.default_value
    initial_color = tuple(color.default_value)
    original = [o for o in scene.objects if o.type=="MESH"]
    assert len(original)>=9, len(original)
    original_hidden = {o.name:o.hide_render for o in original}

    # Faction-specific wreckage profiles: visible roof collapse, exposed broken
    # supports and bright fracture surfaces. Each is an editable mesh object.
    if a.faction=="coalition":
        critical = [
            shard("Critical-only torn hangar roof",(-.36,-.23,1.87),
                  (1.83,1.09,.18),(.13,.32,-.21),metal,root),
            shard("Critical-only toppled control tower",(-1.25,-.72,1.56),
                  (.55,.53,1.05),(.47,.83,.28),armor,root),
            shard("Critical-only exposed roof fracture",(.42,-.89,2.06),
                  (.13,1.20,.075),(.18,.18,-.25),glow,root),
        ]
        destroyed = [
            shard("Destroyed-only hangar roof slab",(.38,-.51,.94),
                  (2.13,1.45,.24),(.31,.61,.36),metal,root),
            shard("Destroyed-only buckled hangar girder",(-.66,.70,1.21),
                  (.25,.24,1.58),(.91,.44,-.22),armor,root),
            shard("Destroyed-only torn aircraft gate",(.97,.14,.84),
                  (.26,1.22,.91),(.38,-.52,.28),metal,root),
            shard("Destroyed-only exposed spar",(-.48,-.89,1.47),
                  (.12,.14,1.36),(.63,.38,.10),glow,root),
        ]
    elif a.faction=="federation":
        critical = [
            shard("Critical-only displaced anti-air roof",(-.42,-.24,2.02),
                  (2.03,1.31,.28),(.21,.31,.31),armor,root),
            shard("Critical-only snapped flak mount",(-.91,-.44,2.33),
                  (.41,.43,1.13),(.67,.72,.27),metal,root),
            shard("Critical-only furnace fracture",(.50,-.84,2.13),
                  (.12,1.22,.09),(.16,.24,-.35),glow,root),
        ]
        destroyed = [
            shard("Destroyed-only fallen bunker roof",(.53,-.41,1.02),
                  (2.26,1.76,.32),(.34,.60,.22),armor,root),
            shard("Destroyed-only broken gun cradle",(-.76,-.59,1.16),
                  (.48,.42,1.65),(.94,.47,.12),metal,root),
            shard("Destroyed-only torn blast-wall panel",(1.10,.46,.93),
                  (.24,1.46,1.07),(.30,.52,-.18),armor,root),
            shard("Destroyed-only exposed conduit",(-.64,.76,1.52),
                  (.12,.13,1.33),(.69,.32,.21),glow,root),
        ]
    else:
        critical = [
            shard("Critical-only fallen levitation arc",(-.55,-.86,1.93),
                  (.34,.35,2.09),(.43,.71,-.24),metal,root),
            shard("Critical-only split neural deck",(.37,.27,1.19),
                  (1.66,1.07,.21),(.26,.30,.36),armor,root),
            shard("Critical-only severed mint conduit",(.82,-.76,1.76),
                  (.11,.14,1.07),(.50,.32,.11),glow,root),
        ]
        destroyed = [
            shard("Destroyed-only crashed floating deck",(.69,-.30,.89),
                  (2.18,1.48,.27),(.41,.62,.29),armor,root),
            shard("Destroyed-only broken launch spire",(-.61,-.79,1.12),
                  (.45,.47,1.74),(.92,.47,.13),metal,root),
            shard("Destroyed-only shattered flight beacon",(.98,.72,1.34),
                  (.21,.20,1.30),(.64,.42,-.31),glow,root),
            shard("Destroyed-only fractured platform rim",(-.28,.74,.94),
                  (1.37,.31,.25),(.20,.23,-.27),metal,root),
        ]
    assert len(critical)==3 and len(destroyed)==4
    a.output.mkdir(parents=True, exist_ok=True)
    target = a.output/(a.faction+"-airfield-extended-states.blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(target.resolve()), compress=True)
    for state in ("critical","destroyed","power_out"):
        for obj in original:
            obj.hide_render = original_hidden[obj.name]
        for obj in critical+destroyed:
            obj.hide_render = True
        strength.default_value = initial_strength
        color.default_value = initial_color
        if state in ("critical","destroyed"):
            prefixes=HIDE[a.faction][state]
            matched=[o for o in original if o.name.startswith(prefixes)]
            assert len(matched)>=2,(a.faction,state,[o.name for o in matched])
            for obj in matched:
                obj.hide_render=True
            for obj in (critical if state=="critical" else destroyed):
                obj.hide_render=False
        else:
            strength.default_value=0
            color.default_value=(.035,.042,.05,1)
        bpy.context.view_layer.update()
        scene.render.resolution_x=scene.render.resolution_y=160
        scene.render.resolution_percentage=100
        scene.render.image_settings.file_format="PNG"
        scene.render.image_settings.color_mode="RGBA"
        scene.render.filepath=str((a.output/(state+".png")).resolve())
        bpy.ops.render.render(write_still=True)
        print("RENDERED",a.faction,state,flush=True)
    assert target.stat().st_size>1000
    print("PASS: editable preview-only airfield wreckage",target,flush=True)

if __name__=="__main__":
    main()
