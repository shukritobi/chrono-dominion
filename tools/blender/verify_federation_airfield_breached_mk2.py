#!/usr/bin/env python3
"""Reopen actual serialized MK-II source, independently inspect new mesh topology."""
import json
from pathlib import Path
import bpy
import bmesh

assert Path(bpy.data.filepath).name=="federation-airfield-breached-mk2.blend"
root=bpy.data.objects.get("Animated federation airfield")
assert root
prefix="MKII breached hangar "
parts=[o for o in bpy.data.objects if o.name.startswith(prefix)]
assert len(parts)==10,(len(parts),[o.name for o in parts])
assert all(o.type=="MESH" and o.parent==root and o.hide_render for o in parts)
assert len({o.data.name for o in parts})==10
old=[o for o in bpy.data.objects if o.name.startswith(("Critical-only","Destroyed-only"))]
assert len(old)==8 and all(o.hide_render for o in old)
assert bpy.data.objects.get("Hardened aircraft bunker") is not None
assert not bpy.data.objects["Hardened aircraft bunker"].hide_render
report={}
for obj in parts:
    bm=bmesh.new()
    bm.from_mesh(obj.data)
    bad=[e.index for e in bm.edges if not e.is_manifold]
    assert not bad,(obj.name,bad)
    assert len(bm.verts)>=8 and len(bm.faces)>=6
    report[obj.name]={"vertices":len(bm.verts),"faces":len(bm.faces),
                      "closed_manifold":True,"hidden_in_saved_intact_source":True}
    bm.free()
assert bpy.context.scene.camera and bpy.context.scene.render.film_transparent
print(json.dumps({"source":bpy.data.filepath,"original_fractures_preserved":len(old),
                  "new_closed_manifold_meshes":report},indent=2))
print("PASS: reopened editable MK-II hangar; all 10 custom solids closed-manifold")
