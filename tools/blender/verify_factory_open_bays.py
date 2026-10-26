#!/usr/bin/env python3
"""Inspect a saved Blender factory source for an actual camera-facing open bay.

Run from Blender with the .blend already loaded. This is geometry validation,
not a material-color or dark facade pixel check.
"""
import bpy
from mathutils import Vector

assert bpy.data.filepath.endswith(".blend"), "Must reopen a saved editable .blend"
scene=bpy.context.scene
meshes=[obj for obj in scene.objects if obj.type=="MESH"]
assert len(meshes)>=30, "Expected detailed editable factory meshes"
names={obj.name for obj in meshes}
assert "Open bay crosshead lintel" in names or "Open blast-gate crosshead" in names
assert any("unfinished" in name.lower() for name in names), "No visible work-in-progress vehicle"
assert any("launch ramp" in name.lower() for name in names), "No vehicle exit ramp"
assert any("gantry" in name.lower() or "forging" in name.lower() for name in names), "No factory equipment"
assert not any("production mouth" in name.lower() or "blast gate rib" in name.lower() for name in names), "Legacy flat facade retained"
depsgraph=bpy.context.evaluated_depsgraph_get()

def shoot(label,origin,direction,distance):
    hit,location,normal,index,obj,matrix=scene.ray_cast(
        depsgraph,Vector(origin),Vector(direction),distance=distance)
    assert hit, f"{label}: ray missed all geometry"
    print(f"{label}: first hit '{obj.name}' at {tuple(round(v,3) for v in location)}")
    return location,obj

# +X front is intentionally open at eye level; any door/facade panel
# would intercept the ray near x=1.1 before reaching the workcell.
front,obj=shoot("Open front aperture",(2.5,0,1.59),(-1,0,0),5.0)
assert front.x < 0.95, f"Front is obstructed at x={front.x:.3f} by {obj.name}"

# -Y is the visible side of the isometric camera. The forward half
# must be exposed; a near-side opaque shell would hit near y=-1.25.
side,obj=shoot("Exposed near-side workcell",(.33,-2.3,1.17),(0,1,0),5.0)
assert side.y > -1.02, f"Near-side wall still blocks view at y={side.y:.3f} by {obj.name}"

print("PASS: editable mesh source has genuine front and near-side openings")
