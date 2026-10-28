#!/usr/bin/env python3
"""Independent Blender reopen and manifold verification for Hunter MK-III."""
from collections import Counter
import bpy
optics=[o for o in bpy.data.objects if o.get("optical_deployment_only")]
sails=[o for o in optics if o.get("optical_role")=="sail"]
ribs=[o for o in optics if o.get("optical_role")=="rib"]
shutters=[o for o in optics if o.get("optical_role")=="shutter"]
vanes=[o for o in bpy.data.objects if o.name.startswith("Hunter independent optical camouflage vane hinge")]
wreck=[o for o in bpy.data.objects if o.get("wreckage_only")]
attack=[o for o in bpy.data.objects if o.get("attack_only")]
assert (len(optics),len(sails),len(ribs),len(shutters),len(vanes),len(wreck),len(attack))==(16,4,8,4,4,14,3)
for obj in sails:
    assert obj.type=="MESH" and obj.hide_render
    assert (len(obj.data.vertices),len(obj.data.polygons),len(obj.data.materials))==(42,30,2)
    assert obj.get("mk3_profile")=="dual_notch_closed_bevel_v1"
    assert obj.get("mk3_profile_points")==14
    assert abs(obj.get("mk3_bevel_ratio",0)-.13)<.0001
    assert all(abs(obj.get(k,0)-v)<.0001 for k,v in (("mk3_width",.98),("mk3_height",.57)))
    edges=Counter(tuple(sorted((face.vertices[i],face.vertices[(i+1)%len(face.vertices)])))
                  for face in obj.data.polygons for i in range(len(face.vertices)))
    assert len(edges)==70 and all(count==2 for count in edges.values())
    assert sum(face.material_index==1 for face in obj.data.polygons)==14
    pts=[obj.data.vertices[i].co for i in range(14)]
    turns=[(pts[(i+1)%14].x-pts[i].x)*(pts[(i+2)%14].y-pts[(i+1)%14].y)-
           (pts[(i+1)%14].y-pts[i].y)*(pts[(i+2)%14].x-pts[(i+1)%14].x)
           for i in range(14)]
    assert any(v<-.00001 for v in turns) and any(v>.00001 for v in turns)
assert all(o.hide_render and o.type=="MESH" for o in optics+wreck+attack)
print("PASS REOPEN: 4 dual-notch 42-vertex watertight beveled sails, 8 ribs, 4 shutters, 14 wrecks, 3 attack effects")
