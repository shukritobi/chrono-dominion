#!/usr/bin/env python3
"""Preview-only original Blender damage-state geometry for all three airfields.

Each run reopens the freshly generated editable airfield source. The original
five-frame atlas is read-only; these extra states have independent PNGs and a
second editable .blend. No production path is written.
"""
import argparse
import sys
from pathlib import Path
import bpy

FACTIONS = ("coalition", "federation", "psionic")
# Exact object identities, not fuzzy substring selectors. The critical pose
# breaks signature equipment; the destroyed pose removes the hangar or field.
REMOVE = {
    "coalition": {
        "critical": ("Flight control tower",),
        "destroyed": ("Wide aerospace hangar", "Aerodynamic shelter roof",
                      "Flight control tower", "Aircraft loading mouth"),
    },
    "federation": {
        "critical": ("Roof flak cupola", "Rooftop anti-air barrel"),
        "destroyed": ("Hardened aircraft bunker", "Layered anti-air roof",
                      "Roof flak cupola", "Rooftop anti-air barrel",
                      "Aircraft blast bay"),
    },
    "psionic": {
        "critical": ("Landing arc guide.001", "Focusing landing orb.001"),
        "destroyed": ("Levitating central deck", "Landing arc guide",
                      "Landing arc guide.001", "Focusing landing orb",
                      "Focusing landing orb.001", "Psionic flight field",
                      "Aircraft locator"),
    },
}

def fracture(name, centre, size, lean, material, root):
    """Create a CLOSED asymmetric eight-vertex fracture volume, not a decal."""
    x, y, z = centre
    sx, sy, sz = size
    # Uneven upper edge and displaced corners: independent actual 3D geometry.
    footprint = ((-.51,-.45),(.48,-.55),(.58,.42),(-.42,.56))
    verts = [(x+u*sx,y+v*sy,z-sz*.5) for u,v in footprint]
    verts += [(x+u*sx+lean[0],y+v*sy+lean[1],
               z+sz*(.34+offset))
              for (u,v),offset in zip(footprint,(.11,.20,.09,.27))]
    faces = [(3,2,1,0),(4,5,6,7),
             (0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    mesh = bpy.data.meshes.new(name+" geometry")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = root
    mesh.materials.append(material)
    obj.hide_render = True
    return obj

def make_debris(faction, root):
    steel = bpy.data.materials[faction+"_beveled_steel"]
    armor = bpy.data.materials[faction+"_painted_metal"]
    dark = bpy.data.materials[faction+"_black_titanium"]
    # Critical state: physically snapped airfield-specific high equipment.
    critical = {
        "coalition": [
            ("Broken flight-control tower",(-1.27,-1.02,2.66),(.55,.46,1.32),(.36,-.19),steel),
            ("Sheared shelter-edge fin",(.72,-1.21,2.06),(1.17,.34,.43),(.24,-.11),armor),
            ("Exposed control conductor",(-.80,-1.36,2.26),(.20,.23,.74),(.13,-.16),steel)],
        "federation": [
            ("Severed anti-air cupola",(-.80,-.81,2.86),(.64,.49,1.18),(.38,-.22),steel),
            ("Broken flak barrel",(.19,-1.18,2.52),(1.19,.24,.33),(.22,-.08),dark),
            ("Split roof armor seam",(.77,-1.26,2.17),(.84,.29,.35),(.16,-.09),steel)],
        "psionic": [
            ("Fractured near-side landing arc",(-.34,-1.24,2.78),(.57,.44,1.43),(.32,-.22),armor),
            ("Detached neural beacon",(.88,-1.06,2.14),(.40,.42,.83),(.29,-.20),steel),
            ("Exposed launch conduit",(1.18,-.73,1.56),(.86,.25,.27),(.12,-.09),steel)],
    }[faction]
    # Destroyed state: large asymmetric low wreckage, not intact building dimmed.
    destroyed = [
        ("Collapsed near hangar roof",(.27,-.93,1.30),(1.82,.78,.48),(.40,-.27),dark),
        ("Ruptured far structural girder",(-.83,.61,1.43),(1.39,.47,.72),(.35,.15),armor),
        ("Buckled landing-bay wall",(.90,.40,1.16),(.64,1.17,.67),(.21,-.28),steel),
        ("Torn forward armor panel",(1.46,-.95,.99),(.87,.56,.47),(.23,-.20),armor),
        ("Exposed internal brace",(-.60,-1.28,1.72),(.33,.36,1.19),(.32,-.16),steel),
        ("Broken service deck",(0,.02,.89),(1.62,1.13,.25),(.21,-.18),dark),
    ]
    pieces=[]
    for state, specs in (("Critical",critical),("Destroyed",destroyed)):
        for title,center,size,lean,material in specs:
            pieces.append(fracture(state+"-only "+title,center,size,lean,material,root))
    return pieces

def render(scene, output):
    scene.render.resolution_x=scene.render.resolution_y=160
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"
    scene.render.image_settings.color_mode="RGBA"
    scene.render.filepath=str(output.resolve())
    bpy.ops.render.render(write_still=True)
    assert output.is_file() and output.stat().st_size>1000,output

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--faction",choices=FACTIONS,required=True)
    parser.add_argument("--output",type=Path,required=True)
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    a=parser.parse_args(argv)
    assert Path(bpy.data.filepath).name==a.faction+"-airfield.blend"
    sc=bpy.context.scene
    assert sc.camera and sc.render.film_transparent and sc.render.engine=="CYCLES"
    root=bpy.data.objects.get("Animated "+a.faction+" airfield")
    assert root and root.type=="EMPTY"
    original=[o for o in sc.objects if o.type=="MESH"]
    assert len(original)>=15,(a.faction,len(original))
    names={o.name:o for o in original}
    for state, selectors in REMOVE[a.faction].items():
        assert all(n in names for n in selectors),(a.faction,state,selectors,sorted(names))
    material=bpy.data.materials[a.faction+"_emissive"]
    bsdf=material.node_tree.nodes.get("Principled BSDF")
    strength=bsdf.inputs["Emission Strength"]
    color=bsdf.inputs["Base Color"]
    old_color=tuple(color.default_value)
    # Match original idle frame 0 exactly: animated_assets.animate sets
    # emission to .75 and hides the telemetry beacon for even idle frames.
    strength.default_value=.75
    for o in original:
        if o.name.startswith("Visible animated base telemetry lamp"):
            o.hide_render=True
    original_flags={o.name:o.hide_render for o in original}
    debris=make_debris(a.faction,root)
    assert len(debris)==9 and all(o.hide_render for o in debris)
    a.output.mkdir(parents=True,exist_ok=True)
    source=a.output/(a.faction+"-airfield-extended-states.blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(source.resolve()),compress=True)
    # Independently render an untouched baseline for pixel-exact comparison
    # with the first frame of the existing five-frame atlas.
    render(sc,a.output/"baseline.png")
    for state in ("critical","destroyed","power_out"):
        for o in original:
            o.hide_render=original_flags[o.name]
        for o in debris:
            o.hide_render=not o.name.startswith(state.title().replace("_","")+"-only")
        strength.default_value=.75
        color.default_value=old_color
        if state in ("critical","destroyed"):
            for name in REMOVE[a.faction][state]:
                names[name].hide_render=True
        else:
            assert state=="power_out"
            strength.default_value=0
            color.default_value=(.035,.042,.050,1)
        bpy.context.view_layer.update()
        render(sc,a.output/(state+".png"))
        print("RENDERED",a.faction,state,flush=True)
    assert source.stat().st_size>1000
    print("PASS preview-only airfield source",source,flush=True)

if __name__=="__main__":
    main()
