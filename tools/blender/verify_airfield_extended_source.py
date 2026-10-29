#!/usr/bin/env python3
"""Reopen serialized airfield extended-state .blend and audit real mesh topology."""
import json
import bpy
import bmesh

source=bpy.data.filepath
assert source.endswith("-airfield-extended-states.blend"),source
faction=source.split("/")[-1].split("-airfield")[0]
root=bpy.data.objects.get("Animated "+faction+" airfield")
assert root
fragments=[o for o in bpy.data.objects if o.type=="MESH"
           and o.name.startswith(("Critical-only","Destroyed-only"))]
assert len(fragments)==8,(faction,len(fragments))
assert sum(o.name.startswith("Critical-only") for o in fragments)==3
assert sum(o.name.startswith("Destroyed-only") for o in fragments)==5
assert all(o.hide_render and o.parent==root for o in fragments)
report={}
for obj in fragments:
    bm=bmesh.new()
    bm.from_mesh(obj.data)
    assert len(bm.verts)>=10 and len(bm.faces)>=11,(obj.name,len(bm.verts),len(bm.faces))
    bad=[e.index for e in bm.edges if not e.is_manifold]
    assert not bad,(obj.name,"nonmanifold",bad)
    report[obj.name]={"vertices":len(bm.verts),"faces":len(bm.faces),
                      "edges":len(bm.edges),"closed_manifold":True}
    bm.free()
assert bpy.context.scene.camera and bpy.context.scene.render.film_transparent
print(json.dumps({"faction":faction,"reopened":source,"fractures":report},indent=2))
print("PASS reopened 8 independent closed-manifold editable airfield fractures")
