#!/usr/bin/env python3
"""Editable, preview-only critical/destroyed/power-out beam defense meshes.

Reopens the original beam .blend; never rewrites the five-frame atlas.
Each additional pose is rendered to a separate 160px RGBA PNG.
"""
import argparse
import sys
from pathlib import Path

import bpy

HIDE = {
    "coalition": {
        "critical": ("Emitter focus", "Charged target point", "Rail terminus"),
        "destroyed": ("Emitter focus", "Charged target point",
                      "Rail terminus", "Paired emitter guide"),
    },
    "federation": {
        "critical": ("Hot power converter", "Charged rod tip", "Forked arc rod"),
        "destroyed": ("Hot power converter", "Charged rod tip",
                      "Forked arc rod", "Exposed glowing voltage coil",
                      "Exposed copper induction barrel"),
    },
    "psionic": {
        "critical": ("Beam tip", "Aether beam monolith"),
        "destroyed": ("Beam tip", "Aether beam monolith",
                      "Vertical neural focusing ring", "Oscillating vector field"),
    },
}

def wedge(name, pos, dims, angles, mat, root):
    """Make a nonrectangular, physically faceted, editable fractured plate."""
    w,d,h=dims
    vertices=[
        (-w*.5,-d*.5,-h*.5),(w*.5,-d*.5,-h*.5),
        (w*.38,d*.5,-h*.5),(-w*.52,d*.5,-h*.5),
        (-w*.4,-d*.5,h*.5),(w*.27,-d*.5,h*.5),
        (w*.13,d*.5,h*.18),(-w*.34,d*.5,h*.35),
    ]
    faces=((3,2,1,0),(4,5,6,7),(0,1,5,4),
           (1,2,6,5),(2,3,7,6),(3,0,4,7))
    mesh=bpy.data.meshes.new(name+" mesh")
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.location=pos
    obj.rotation_euler=angles
    obj.parent=root
    obj.data.materials.append(mat)
    bevel=obj.modifiers.new("Fracture glints","BEVEL")
    bevel.width=.018
    bevel.segments=2
    obj.hide_render=True
    return obj

def profiles(faction, steel, armor, glow, root):
    # Faction-specific broken hardware is not a recolored shared mesh.
    if faction=="coalition":
        critical=[
            wedge("Critical-only snapped emitter rail",(-.64,-.58,2.57),
                  (.34,.40,1.60),(.67,.44,-.27),steel,root),
            wedge("Critical-only fallen focusing annulus",(.66,.22,2.05),
                  (1.54,.22,.32),(.30,.77,.19),armor,root),
            wedge("Critical-only exposed cyan fracture",(-.78,-.74,2.65),
                  (.14,.11,1.17),(.28,.41,-.36),glow,root),
            wedge("Critical-only torn guide strut",(.54,-.82,2.62),
                  (.29,.32,.98),(.48,.56,.24),steel,root),
        ]
        destroyed=[
            wedge("Destroyed-only fallen emitter crossbar",(.34,-.66,1.12),
                  (2.09,.40,.48),(.18,.71,.42),steel,root),
            wedge("Destroyed-only shattered guide tower",(-.77,-.36,1.20),
                  (.59,.57,1.73),(.98,.49,-.16),armor,root),
            wedge("Destroyed-only collapsed upper ring",(.80,.52,.92),
                  (1.56,.45,.27),(.35,.72,.37),steel,root),
            wedge("Destroyed-only cracked front housing",(1.03,-.66,.87),
                  (.62,1.13,.43),(.19,-.39,.24),armor,root),
            wedge("Destroyed-only exposed coil flash",(-.63,-.87,1.53),
                  (.15,.12,.95),(.54,.40,.16),glow,root),
        ]
    elif faction=="federation":
        critical=[
            wedge("Critical-only snapped arc fork",(-.75,-.62,2.55),
                  (.43,.44,1.70),(.55,.66,-.21),steel,root),
            wedge("Critical-only displaced copper cap",(.52,.40,2.54),
                  (1.03,.80,.43),(.39,.63,.27),armor,root),
            wedge("Critical-only glowing furnace tear",(-.72,-.92,2.42),
                  (.16,.13,1.32),(.34,.24,-.35),glow,root),
            wedge("Critical-only bent induction rail",(.80,-.35,2.28),
                  (.36,.40,1.02),(.61,.42,.23),steel,root),
        ]
        destroyed=[
            wedge("Destroyed-only fallen induction barrel",(.72,-.47,1.04),
                  (1.97,.73,.57),(.43,.94,.34),armor,root),
            wedge("Destroyed-only ruptured arc fork",(-.80,-.44,1.27),
                  (.56,.49,1.64),(.98,.54,-.19),steel,root),
            wedge("Destroyed-only buckled furnace cap",(.31,.67,.94),
                  (1.82,.53,.34),(.29,.63,.29),armor,root),
            wedge("Destroyed-only cracked blast casing",(1.08,-.72,.84),
                  (.64,1.20,.51),(.28,-.40,.35),steel,root),
            wedge("Destroyed-only molten orange fracture",(-.64,-.89,1.50),
                  (.16,.13,1.06),(.57,.35,.13),glow,root),
        ]
    else:
        critical=[
            wedge("Critical-only shattered monolith blade",(-.58,-.54,2.73),
                  (.68,.51,1.77),(.55,.66,-.21),steel,root),
            wedge("Critical-only falling psi crystal",(.62,.12,2.02),
                  (1.09,.59,.60),(.36,.81,.22),armor,root),
            wedge("Critical-only mint fracture seam",(-.54,-.88,2.70),
                  (.14,.14,1.35),(.27,.34,-.29),glow,root),
            wedge("Critical-only split focusing crescent",(.72,-.64,2.35),
                  (.35,.30,1.14),(.53,.42,.27),steel,root),
        ]
        destroyed=[
            wedge("Destroyed-only toppled neural obelisk",(.67,-.36,1.07),
                  (2.07,.60,.67),(.48,.92,.37),steel,root),
            wedge("Destroyed-only broken crystal blade",(-.81,-.54,1.29),
                  (.57,.51,1.84),(.98,.55,-.18),armor,root),
            wedge("Destroyed-only fallen psi focus",(.41,.69,.98),
                  (1.61,.46,.38),(.32,.74,.29),steel,root),
            wedge("Destroyed-only shattered outer plinth",(1.07,-.64,.90),
                  (.65,1.07,.51),(.29,-.40,.32),armor,root),
            wedge("Destroyed-only luminous psychic fissure",(-.66,-.90,1.58),
                  (.17,.14,1.06),(.51,.36,.18),glow,root),
        ]
    return critical,destroyed

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--faction",required=True,choices=tuple(HIDE))
    p.add_argument("--output",required=True,type=Path)
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    a=p.parse_args(argv)
    assert Path(bpy.data.filepath).name==a.faction+"-beam.blend"
    scene=bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    root=bpy.data.objects.get("Animated "+a.faction+" beam")
    assert root
    steel=bpy.data.materials.get(a.faction+"_beveled_steel")
    armor=bpy.data.materials.get(a.faction+"_painted_metal")
    glow=bpy.data.materials.get(a.faction+"_emissive")
    assert steel and armor and glow
    bsdf=glow.node_tree.nodes.get("Principled BSDF")
    strength=bsdf.inputs["Emission Strength"]
    color=bsdf.inputs["Base Color"]
    initial_strength=strength.default_value
    initial_color=tuple(color.default_value)
    original=[o for o in scene.objects if o.type=="MESH"]
    assert len(original)>=8
    hidden={o.name:o.hide_render for o in original}
    critical,destroyed=profiles(a.faction,steel,armor,glow,root)
    assert len(critical)==4 and len(destroyed)==5
    a.output.mkdir(parents=True,exist_ok=True)
    source=a.output/(a.faction+"-beam-extended-states.blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(source.resolve()),compress=True)
    for state in ("critical","destroyed","power_out"):
        for o in original:
            o.hide_render=hidden[o.name]
        for o in critical+destroyed:
            o.hide_render=True
        strength.default_value=initial_strength
        color.default_value=initial_color
        if state!="power_out":
            prefixes=HIDE[a.faction][state]
            matches=[o for o in original if o.name.startswith(prefixes)]
            assert len(matches)>=2,(a.faction,state,[o.name for o in original])
            for o in matches:
                o.hide_render=True
            for o in (critical if state=="critical" else destroyed):
                o.hide_render=False
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
    assert source.stat().st_size>1000
    print("PASS: independent editable beam defense wreckage",source,flush=True)

if __name__=="__main__":
    main()
