#!/usr/bin/env python3
"""Preview-only: reopen verified Federation airfield .blend and render only MK-II wreck.

The source .blend is saved with ALL new meshes hidden, preserving its idle pose.
Original Coalition/Psionic previews, Federation intact/critical/power-out and
all original five-frame atlases are not rendered or touched by this script.
"""
import argparse
import json
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

PREFIX = "MKII breached hangar "
# All profiles are hand-authored irregular polygonal sections; no cube primitives.
# Local coordinate system: hangar front is +X, near side is -Y.
PARTS = (
    ("open maintenance floor", "XY", .79, .13,
     ((-1.48,-1.16),(.47,-1.17),(.68,-.70),(.59,.96),(.19,1.17),(-1.48,1.16)), "dark"),
    ("torn rear bulkhead", "YZ", -1.55, .16,
     ((-1.18,.79),(1.18,.79),(1.18,1.57),(.83,1.80),(.44,1.47),(.02,1.68),(-.47,1.40),(-1.18,1.58)), "armor"),
    ("jagged far-side wall", "XZ", 1.25, -.14,
     ((-1.54,.78),(.56,.78),(.56,1.18),(.23,1.44),(-.12,1.21),(-.56,1.71),(-1.03,1.47),(-1.54,1.77)), "armor"),
    ("sheared near-side wall", "XZ", -1.24, .13,
     ((-1.53,.78),(-.64,.78),(-.64,1.04),(-.91,1.27),(-1.18,1.12),(-1.53,1.40)), "light"),
    ("collapsed rear roof cantilever", "XY", 1.62, .13,
     ((-1.48,.03),(-.98,-.18),(-.65,.21),(-.83,.73),(-1.15,1.07),(-1.48,.96)), "dark"),
    ("broken far portal stanchion", "XZ", 1.00, -.15,
     ((.34,.80),(.58,.80),(.58,1.37),(.45,1.56),(.31,1.35)), "light"),
    ("split internal service cradle", "XY", .96, .12,
     ((-.66,-.38),(.23,-.41),(.39,-.12),(.17,.38),(-.42,.37),(-.71,.07)), "bronze"),
    ("near wall molten fracture cap", "XZ", -1.34, .06,
     ((-1.53,1.38),(-1.23,1.12),(-1.14,1.20),(-1.46,1.53)), "bronze"),
    ("rear wall torn copper edge", "YZ", -1.38, .06,
     ((-.47,1.40),(.02,1.68),(.14,1.60),(-.40,1.31)), "bronze"),
    ("grounded forward collapsed brace", "XZ", -.89, .13,
     ((.33,.82),(.73,.83),(.99,1.03),(.84,1.12),(.57,1.02)), "light"),
)

def add_solid(name, plane, axis_value, thickness, profile, material, root):
    n = len(profile)
    if plane == "XY":
        verts = [(a,b,axis_value) for a,b in profile]
        verts += [(a,b,axis_value+thickness) for a,b in profile]
    elif plane == "XZ":
        verts = [(a,axis_value,b) for a,b in profile]
        verts += [(a,axis_value+thickness,b) for a,b in profile]
    else:
        verts = [(axis_value,a,b) for a,b in profile]
        verts += [(axis_value+thickness,a,b) for a,b in profile]
    faces = [tuple(range(n-1,-1,-1)), tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    data = bpy.data.meshes.new(PREFIX+name+"-custom-mesh")
    data.from_pydata(verts,[],faces)
    data.update()
    obj = bpy.data.objects.new(PREFIX+name,data)
    bpy.context.collection.objects.link(obj)
    obj.parent = root
    obj.data.materials.append(material)
    obj.hide_render = True
    bm = bmesh.new()
    bm.from_mesh(data)
    assert len(bm.verts)==2*n and all(e.is_manifold for e in bm.edges),name
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    bm.to_mesh(data)
    bm.free()
    return obj

def first_hit(objects, origin, direction):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    best = None
    for obj in objects:
        if obj.type != "MESH" or obj.hide_render:
            continue
        evaluated = obj.evaluated_get(depsgraph)
        bvh = BVHTree.FromObject(evaluated,depsgraph)
        if bvh is None:
            continue
        inverse = obj.matrix_world.inverted()
        start = inverse @ Vector(origin)
        vec = (inverse.to_3x3() @ Vector(direction)).normalized()
        point, normal, face, dist = bvh.ray_cast(start,vec,10)
        if point is not None:
            world = obj.matrix_world @ point
            d = (world-Vector(origin)).length
            if best is None or d<best["distance"]:
                best = {"object":obj.name,"distance":round(d,4),
                        "world_xyz":[round(float(x),4) for x in world]}
    return best

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    assert Path(bpy.data.filepath).name=="federation-airfield-extended-states.blend",bpy.data.filepath
    root=bpy.data.objects.get("Animated federation airfield")
    assert root
    scene=bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert not any(o.name.startswith(PREFIX) for o in bpy.data.objects)
    original=[o for o in scene.objects if o.type=="MESH"]
    original_visibility={o.name:o.hide_render for o in original}
    mats={"armor":bpy.data.materials.get("federation_painted_metal"),
          "light":bpy.data.materials.get("federation_beveled_steel"),
          "dark":bpy.data.materials.get("federation_black_titanium"),
          "bronze":bpy.data.materials.get("federation_preview_fracture_copper")}
    assert all(mats.values()),mats
    additions=[add_solid(name,plane,axis,thick,profile,mats[mat],root)
               for name,plane,axis,thick,profile,mat in PARTS]
    assert len(additions)==10
    args.output.mkdir(parents=True,exist_ok=True)
    new_source=args.output/"federation-airfield-breached-mk2.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(new_source.resolve()),compress=True)
    # Explicitly render only the previously validated destroyed pose, with
    # the two debris pieces blocking the actual open hangar now laid aside.
    hide=("Hardened aircraft bunker","Layered anti-air roof",
          "Roof flak cupola","Rooftop anti-air barrel","Aircraft blast bay")
    for obj in original:
        obj.hide_render=original_visibility[obj.name]
        if obj.name.startswith(hide):
            obj.hide_render=True
        elif obj.name.startswith("Critical-only"):
            obj.hide_render=True
        elif obj.name.startswith("Destroyed-only"):
            obj.hide_render=obj.name.startswith(("Destroyed-only fallen roof panel",
                                                 "Destroyed-only twisted cross beam"))
    for obj in additions:
        obj.hide_render=False
    # A literal clear front aperture and near-side cutaway, including all
    # visible original meshes, not a painted dark doorway.
    bpy.context.view_layer.update()
    visible=[o for o in scene.objects if o.type=="MESH" and not o.hide_render]
    front=first_hit(visible,(2.45,-.25,1.29),(-1,0,0))
    near=first_hit(visible,(-.20,-2.45,1.31),(0,1,0))
    assert front and front["world_xyz"][0]<-1.20,("front blocked",front)
    assert near and near["world_xyz"][1]>1.02,("near side blocked",near)
    scene.render.resolution_x=scene.render.resolution_y=160
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"
    scene.render.image_settings.color_mode="RGBA"
    scene.render.filepath=str((args.output/"destroyed-mk2.png").resolve())
    bpy.ops.render.render(write_still=True)
    assert new_source.stat().st_size>1000
    report={"source":str(new_source),"bytes":new_source.stat().st_size,
            "original_visible_meshes":sum(not o.hide_render for o in original),
            "new_meshes":len(additions),"front_aperture_first_hit":front,
            "near_side_aperture_first_hit":near,
            "preview_only":True}
    (args.output/"raycast-proof.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PASS: original 10-mesh physically breached Federation hangar",json.dumps(report),flush=True)

if __name__=="__main__":
    main()
