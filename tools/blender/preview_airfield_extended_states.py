#!/usr/bin/env python3
"""Three-faction original airfield fracture geometry; preview-only extra states.

Reopens a saved airfield .blend, preserves the existing five-frame atlas,
saves eight individually editable CLOSED fracture meshes, and renders only
critical/destroyed/power_out as independent 160px transparent PNGs.
"""
import argparse
import sys
from pathlib import Path
import bpy

HIDE = {
    "coalition": {
        "critical": ("Aerodynamic shelter roof", "Flight control tower"),
        "destroyed": ("Wide aerospace hangar", "Aerodynamic shelter roof",
                      "Flight control tower", "Aircraft loading mouth"),
    },
    "federation": {
        "critical": ("Layered anti-air roof", "Roof flak cupola",
                     "Rooftop anti-air barrel"),
        "destroyed": ("Hardened aircraft bunker", "Layered anti-air roof",
                      "Roof flak cupola", "Rooftop anti-air barrel",
                      "Aircraft blast bay"),
    },
    "psionic": {
        "critical": ("Landing arc guide.001", "Focusing landing orb.001",
                     "Psionic flight field"),
        "destroyed": ("Landing arc guide", "Focusing landing orb",
                      "Psionic flight field", "Aircraft locator",
                      "Levitating central deck"),
    },
}

# Jagged pentagonal roof, bent ribs and collapsed gantry, not stock cubes.
# Each mesh has its own upper triangulated cap, lower cap and five walls.
FOOTPRINT = ((-.62,-.45),(.36,-.60),(.73,-.07),(.37,.55),(-.70,.38))
HEIGHTS = (.70,1.05,.77,1.14,.83)
FRACTURES = (
    ("Critical-only torn roof near lip", (.72,-.94,1.79), (1.49,.78,.58), "light"),
    ("Critical-only sheared loading truss", (1.27,-.22,1.17), (.38,1.02,1.12), "armor"),
    ("Critical-only exposed broken crown", (-.76,-1.00,1.82), (.65,.48,.81), "dark"),
    ("Destroyed-only fallen roof panel", (.54,-.77,.67), (1.96,1.17,.53), "light"),
    ("Destroyed-only torn landing apron", (1.42,-1.28,.65), (.90,.78,.71), "armor"),
    ("Destroyed-only snapped control column", (-.95,-.70,.66), (.66,.61,1.23), "dark"),
    ("Destroyed-only twisted cross beam", (-.38,.47,.76), (1.63,.34,.83), "light"),
    ("Destroyed-only bright fracture seam", (1.14,-1.61,.71), (.69,.26,.51), "bronze"),
)

def make_fracture(name, origin, extent, material, root):
    cx,cy,z=origin
    sx,sy,h=extent
    n=len(FOOTPRINT)
    verts=[(cx+x*sx,cy+y*sy,z) for x,y in FOOTPRINT]
    verts += [(cx+x*sx,cy+y*sy,z+h*HEIGHTS[i])
              for i,(x,y) in enumerate(FOOTPRINT)]
    verts.append((cx,cy,z+h*.87))
    faces=[tuple(range(n-1,-1,-1))]
    faces += [(n+i,n+(i+1)%n,2*n) for i in range(n)]
    faces += [(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
    data=bpy.data.meshes.new(name+"-closed-fracture")
    data.from_pydata(verts,[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.parent=root
    obj.data.materials.append(material)
    obj.hide_render=True
    return obj

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--faction",choices=tuple(HIDE),required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    assert Path(bpy.data.filepath).name==args.faction+"-airfield.blend",bpy.data.filepath
    scene=bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    root=bpy.data.objects.get("Animated "+args.faction+" airfield")
    assert root
    materials={
        "armor":bpy.data.materials.get(args.faction+"_painted_metal"),
        "light":bpy.data.materials.get(args.faction+"_beveled_steel"),
        "dark":bpy.data.materials.get(args.faction+"_black_titanium"),
        "bronze":bpy.data.materials.get(args.faction+"_ore"),
    }
    assert all(materials.values()),materials
    emissive=bpy.data.materials.get(args.faction+"_emissive")
    assert emissive and emissive.use_nodes
    bsdf=emissive.node_tree.nodes.get("Principled BSDF")
    strength=bsdf.inputs["Emission Strength"]
    base=bsdf.inputs["Base Color"]
    # Source is saved before idle animation; match its validated idle-0 pose.
    strength.default_value=.75
    for obj in scene.objects:
        if obj.name.startswith("Visible animated base telemetry lamp"):
            obj.hide_render=True
    original=[o for o in scene.objects if o.type=="MESH"]
    assert len(original)>=12,(args.faction,len(original))
    baseline={o.name:o.hide_render for o in original}
    for state in ("critical","destroyed"):
        for prefix in HIDE[args.faction][state]:
            assert any(o.name.startswith(prefix) for o in original),(args.faction,state,prefix)
    fragments=[
        make_fracture(name,origin,extent,materials[mat],root)
        for name,origin,extent,mat in FRACTURES
    ]
    assert len(fragments)==8 and all(o.hide_render for o in fragments)
    args.output.mkdir(parents=True,exist_ok=True)
    source=args.output/(args.faction+"-airfield-extended-states.blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(source.resolve()),compress=True)
    baseline_strength=strength.default_value
    baseline_color=tuple(base.default_value)
    for state in ("critical","destroyed","power_out"):
        for obj in original:
            obj.hide_render=baseline[obj.name]
        for obj in fragments:
            obj.hide_render=True
        strength.default_value=baseline_strength
        base.default_value=baseline_color
        if state in ("critical","destroyed"):
            selectors=HIDE[args.faction][state]
            for obj in original:
                if obj.name.startswith(selectors):
                    obj.hide_render=True
            for obj in fragments:
                obj.hide_render=obj.name.startswith("Destroyed-only") if state=="critical" else obj.name.startswith("Critical-only")
        else:
            # Intact architecture, extinguished electronics; never change alpha.
            strength.default_value=0
            base.default_value=(.035,.044,.055,1)
        bpy.context.view_layer.update()
        scene.render.resolution_x=scene.render.resolution_y=160
        scene.render.resolution_percentage=100
        scene.render.image_settings.file_format="PNG"
        scene.render.image_settings.color_mode="RGBA"
        scene.render.filepath=str((args.output/(state+".png")).resolve())
        bpy.ops.render.render(write_still=True)
        print("RENDERED",args.faction,state,flush=True)
    assert source.stat().st_size>1000
    print("PASS: independent editable airfield fracture source",source,flush=True)

if __name__=="__main__":
    main()
