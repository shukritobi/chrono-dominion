#!/usr/bin/env python3
"""Validate a *reopened* Psionic Factory .blend for real front/side apertures.

The ray tests are deliberately performed on serialized mesh geometry, not
materials, render colors or a simulated facade mask. Run using Blender:
  blender -b path/to/psionic-factory.blend --python-exit-code 1 \\
    --python tools/blender/verify_psionic_factory_bay.py
"""
import bpy
from mathutils import Vector

assert bpy.data.filepath.endswith(".blend"), "Reopen saved .blend before verifying"
scene = bpy.context.scene
meshes = [o for o in scene.objects if o.type == "MESH"]
names = [o.name for o in meshes]
assert len(meshes) >= 30, f"Too few editable meshes: {len(meshes)}"
required = (
    "Tall vertical fabrication fork", "Open portal corner pier",
    "Open fabrication bay lintel", "Recessed manufacturing rear bulkhead",
    "Suspended unfinished hovercraft chassis", "Unfinished hover-engine nacelle",
    "Oscillating levitation gripper", "Forecourt hover-vehicle ramp",
)
for term in required:
    assert any(term in name for name in names), f"Missing {term}"
for forbidden in ("Dark recessed synthesis opening", "Bright matter transfer portal",
                  "Five aperture energy ribs", "Projecting portal buttress"):
    assert not any(forbidden in name for name in names), f"Fake bay facade: {forbidden}"

dg = bpy.context.evaluated_depsgraph_get()
def shoot(label, origin, direction, maximum=5):
    hit, pos, normal, face, obj, matrix = scene.ray_cast(
        dg, Vector(origin), Vector(direction), distance=maximum
    )
    assert hit, f"{label}: ray never reached interior"
    print(label, obj.name, tuple(round(v, 3) for v in pos), flush=True)
    return pos, obj

# The +X front portal must expose its back wall and manufacturing reactor.
# A cosmetic opaque portal would hit around x=1.3 instead.
for z in (1.56, 1.68):
    pos, obj = shoot(f"FRONT z={z}", (2.55, 0, z), (-1, 0, 0))
    assert pos.x < -0.48, f"Front opening obstructed at {pos.x:.3f}: {obj.name}"
    assert "rear bulkhead" in obj.name.lower() or "reactor window" in obj.name.lower(), (
        "Front ray did not reach the genuine rear of the workcell", obj.name
    )

# Near side is also open. A true chassis side surface must be visible
# through the missing wall, not through a tinted facade.
pos, obj = shoot("SIDE unfinished hovercraft", (.24, -2.4, 1.28), (0, 1, 0))
assert pos.y > -.70, f"Near-side wall still blocks workcell at {pos.y:.3f}: {obj.name}"
assert "hovercraft" in obj.name.lower() or "nacelle" in obj.name.lower(), (
    "Near-side ray did not reach unfinished vehicle", obj.name
)

wreck = [o for o in meshes if o.name.startswith("Damaged fractured facade slab")]
assert len(wreck) >= 3 and all(o.hide_render for o in wreck), "Damage meshes leaked into idle"
print("PASS: editable Psionic MK-V twin-horn factory, front and side physically open")
