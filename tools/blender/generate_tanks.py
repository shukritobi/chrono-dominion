#!/usr/bin/env python3
"""Build original Chrono Dominion tank models and directional transparent sprites.
Blender 4.2+ (background mode):
  blender -b -t 4 --python tools/blender/generate_tanks.py -- --output ./generated/vehicle-frames
No original commercial game meshes, artwork or texture files are used.

This exports 32 fixed-camera render directions for the *hull* and *turret* of
each faction (192 PNGs). Geometry is deliberately compact/procedural so this
pipeline is repeatable; replace mesh details once the style bible is locked.
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

PALETTES = {
    "coalition": dict(armor=(0.13, 0.30, 0.48, 1), metal=(0.47, 0.67, 0.78, 1),
                      trim=(0.15, 0.84, 0.94, 1), tracks=(0.06, 0.10, 0.15, 1)),
    "federation": dict(armor=(0.47, 0.16, 0.13, 1), metal=(0.49, 0.47, 0.44, 1),
                       trim=(1.00, 0.42, 0.12, 1), tracks=(0.10, 0.09, 0.10, 1)),
    "psionic": dict(armor=(0.30, 0.14, 0.43, 1), metal=(0.53, 0.40, 0.65, 1),
                    trim=(0.19, 0.96, 0.55, 1), tracks=(0.12, 0.08, 0.17, 1)),
}

def material(name, rgba, metallic=0.42, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    p = mat.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = rgba
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = 0.42
    if emission:
        p.inputs["Emission Color"].default_value = rgba
        p.inputs["Emission Strength"].default_value = emission
    return mat

def cube(name, loc, size, mat, parent=None, bevel=.045):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name=name
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new("Machined bevel", "BEVEL")
        mod.width=bevel
        mod.segments=2
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    if parent: obj.parent=parent
    return obj

def cylinder(name, loc, radius, depth, mat, parent=None, axis="Y", vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj=bpy.context.object
    obj.name=name
    if axis=="X": obj.rotation_euler[1]=math.pi/2
    if axis=="Y": obj.rotation_euler[0]=math.pi/2
    obj.data.materials.append(mat)
    if parent: obj.parent=parent
    return obj

def empty(name):
    obj=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(obj)
    return obj

def make_tank(faction):
    p=PALETTES[faction]
    mats={key:material(faction+"_"+key,color,emission=(1.8 if key=="trim" else 0))
          for key,color in p.items()}
    hull=empty(faction+" hull rotation")
    turret=empty(faction+" turret rotation")
    cube("Lower armored hull",(0,0,.49),(2.62,1.35,.52),mats["armor"],hull,.1)
    cube("Upper glacis",(.43,0,.83),(1.63,1.15,.31),mats["metal"],hull,.08)
    cube("Rear engine",(-.82,0,.83),(.74,1.12,.32),mats["armor"],hull)
    cube("Front team visor",(1.18,0,.86),(.07,.82,.13),mats["trim"],hull,.01)
    for side in (-1,1):
        y=side*.81
        cube("Continuous armored track",(0,y,.33),(2.83,.43,.56),mats["tracks"],hull,.15)
        for i in range(5):
            cylinder("Track road wheel",(i*.52-1.05,side*1.05,.30),.20,.11,mats["metal"],hull)
        cube("Track top guard",(0,y,.63),(2.7,.39,.14),mats["armor"],hull)
        cube("Energy strip",(.5,y,.73),(.75,.04,.045),mats["trim"],hull,.01)
    # Turret geometries are created in world coordinates but parented to the
    # rotation empty. Separate PNGs then use the same top-down sprite pivot.
    cube("Turret base",(0,0,1.02),(1.32,1.05,.25),mats["armor"],turret,.1)
    cube("Turret armor cap",(-.08,0,1.25),(.92,.81,.32),mats["metal"],turret,.08)
    cube("Gun barrel",(.88,0,1.15),(1.62,.16,.19),mats["metal"],turret,.035)
    cube("Muzzle collar",(1.66,0,1.15),(.28,.23,.23),mats["armor"],turret,.03)
    cube("Turret sight",(.34,-.30,1.49),(.20,.13,.11),mats["trim"],turret,.015)
    cylinder("Turret hatch",(-.28,.15,1.46),.21,.05,mats["tracks"],turret,axis="Z")
    if faction=="federation":
        cube("Reinforced turret flank",(-.22,.53,1.2),(.82,.13,.27),mats["armor"],turret)
        cube("Rear cooling bank",(-1.07,0,1.06),(.33,.83,.47),mats["tracks"],hull)
    elif faction=="psionic":
        cylinder("Neural ring",(-.14,0,1.53),.20,.08,mats["trim"],turret,axis="Z")
        for y in (-.5,.5):
            cube("Psi fins",(-.53,y,1.39),(.18,.16,.62),mats["armor"],turret)
    else:
        cube("Telemetry antenna",(-.68,-.33,1.48),(.055,.055,.58),mats["tracks"],turret,.01)
    return hull,turret

def configure_scene(size=128, samples=24):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    sc=bpy.context.scene
    sc.render.engine="CYCLES"
    sc.cycles.samples=samples
    sc.render.resolution_x=size
    sc.render.resolution_y=size
    sc.render.resolution_percentage=100
    sc.render.image_settings.file_format="PNG"
    sc.render.image_settings.color_mode="RGBA"
    sc.render.film_transparent=True
    sc.render.image_settings.color_depth="8"
    sc.view_settings.view_transform="Standard"
    world=bpy.data.worlds.new("Chrono Dominion world") if not bpy.data.worlds else bpy.data.worlds[0]
    sc.world=world
    world.use_nodes=True
    world.node_tree.nodes.get("Background").inputs["Strength"].default_value=.7
    bpy.ops.object.light_add(type="AREA",location=(-3,-4,8))
    light=bpy.context.object
    light.data.energy=650
    light.data.shape="DISK"
    light.data.size=5
    bpy.ops.object.camera_add(location=(6,-8,6))
    cam=bpy.context.object
    target=Vector((0,0,.68))
    cam.rotation_euler=(target-cam.location).to_track_quat("-Z","Y").to_euler()
    cam.data.type="ORTHO"
    cam.data.ortho_scale=4.7
    sc.camera=cam
    return sc

def render_faction(sc, faction, folder, directions):
    # Keep light/camera untouched across each facing and faction.
    fixed={o for o in sc.objects if o.type in {"CAMERA","LIGHT"}}
    for obj in list(sc.objects):
        if obj not in fixed: bpy.data.objects.remove(obj,do_unlink=True)
    hull,turret=make_tank(faction)
    hull_meshes=[o for o in sc.objects if o.parent==hull]
    turret_meshes=[o for o in sc.objects if o.parent==turret]
    output=folder/faction
    output.mkdir(parents=True,exist_ok=True)
    for part,visible,hidden in (("hull",hull_meshes,turret_meshes),("turret",turret_meshes,hull_meshes)):
        for obj in visible: obj.hide_render=False
        for obj in hidden: obj.hide_render=True
        for i in range(directions):
            angle=i*math.tau/directions
            hull.rotation_euler.z=angle
            turret.rotation_euler.z=angle
            sc.render.filepath=str(output/f"{part}_{i:02d}.png")
            bpy.ops.render.render(write_still=True)
    return {"faction":faction,"frames":directions,"parts":["hull","turret"],
            "frameSize":[sc.render.resolution_x,sc.render.resolution_y],
            "pivot":[64,82]}

def args():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=Path("generated/vehicle-frames"))
    parser.add_argument("--directions",type=int,default=32)
    parser.add_argument("--size",type=int,default=128)
    parser.add_argument("--samples",type=int,default=24)
    parser.add_argument("--factions",nargs="+",choices=PALETTES.keys(),default=list(PALETTES))
    cli=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    return parser.parse_args(cli)

def main():
    options=args()
    if options.directions not in (8,16,32,64): raise ValueError("Expected 8, 16, 32 or 64 directions")
    options.output.mkdir(parents=True,exist_ok=True)
    sc=configure_scene(options.size,options.samples)
    manifest=[render_faction(sc,faction,options.output,options.directions)
              for faction in options.factions]
    (options.output/"manifest.json").write_text(json.dumps({
        "revision":"3D-procedural-pilot","source":"original Blender geometry",
        "frames":options.directions,"units":manifest
    },indent=2),encoding="utf-8")
    print(f"Exported {len(manifest)*options.directions*2} transparent PNGs to {options.output}")

if __name__=="__main__":
    main()
