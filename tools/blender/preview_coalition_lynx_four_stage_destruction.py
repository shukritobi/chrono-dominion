#!/usr/bin/env python3
"""COA-VEH-002 original four-stage physical Lynx destruction; preview only.

Opens validated saved Lynx .blend from Actions #40494276431 and renders
ONLY 128 new frames. Never regenerates baseline or publishes game assets.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy

PHASES=("impact","shear","rupture","settle")
FACINGS=32
FLAG="lynx_destruction_only"
FACES=((0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7))

def get(name):
    o=bpy.data.objects.get(name)
    if o is None: raise RuntimeError("Missing validated Lynx component: "+name)
    return o

def fragment(name, pos, size, mat, parent, reveal, role):
    """Independent asymmetrical closed eight-vertex six-face mesh."""
    x,y,z=size
    v=[(-.59*x,-.45*y,-.40*z),(.42*x,-.41*y,-.52*z),
       (.57*x,.30*y,-.34*z),(-.33*x,.55*y,-.46*z),
       (-.39*x,-.34*y,.52*z),(.32*x,-.53*y,.39*z),
       (.49*x,.33*y,.47*z),(-.51*x,.27*y,.57*z)]
    mesh=bpy.data.meshes.new(name+" editable fracture volume")
    mesh.from_pydata(v,[],FACES);mesh.update()
    assert len(mesh.vertices)==8 and len(mesh.polygons)==6
    o=bpy.data.objects.new(name,mesh)
    bpy.context.scene.collection.objects.link(o)
    o.parent=parent;o.location=pos;o.data.materials.append(mat)
    o[FLAG]=True;o["first_phase"]=reveal;o["damage_role"]=role
    o.hide_render=True
    return o

def subtle_seam():
    m=bpy.data.materials.new("Lynx restrained electric-blue fracture")
    m.diffuse_color=(.08,.33,.42,1);m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value=(.08,.33,.42,1)
    p.inputs["Emission Color"].default_value=(.13,.54,.67,1)
    p.inputs["Emission Strength"].default_value=.36
    return m

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    out=parser.parse_args(argv).output.resolve()
    out.mkdir(parents=True,exist_ok=True)
    scene=bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x,scene.render.resolution_y)==(160,160)
    root=get("Coalition Lynx Battle Tank - original P0 32-facing")
    running=get("Lynx articulated tracked lower hull")
    turret=get("Lynx independently traversing single-cannon turret")
    barrel=get("Elevating electromagnetic single gun and recoil mount")
    flash=get("Attack-only lance-shaped ion blast")
    pulse=get("Attack-only ion muzzle halo")
    wheels=[o for o in bpy.data.objects if o.name.startswith("Independent roadwheel pivot")]
    cleats=[o for o in bpy.data.objects if o.name.startswith("Independent animated tread cleat")]
    wreck=[o for o in bpy.data.objects if o.get("wreckage_only")]
    original=[o for o in running.children_recursive if o.type=="MESH"]
    assert len(wheels)==12 and len(cleats)==22 and len(wreck)==8 and len(original)>60
    blue=get("Wide titanium lower hull").data.materials[0]
    white=get("Distinctive pale turret roof").data.materials[0]
    shadow=get("Undercarriage blast tray").data.materials[0]
    brass=get("Rear ammunition access cover").data.materials[0]
    seam=subtle_seam()
    specs=[
      ("L01 split left glacis",(1.57,-.55,.93),(.71,.34,.20),white,1,"glacis"),
      ("L02 split right glacis",(1.61,.52,.85),(.64,.36,.20),white,1,"glacis"),
      ("L03 torn port track guard",(.81,-1.12,.65),(.84,.30,.21),blue,1,"track"),
      ("L04 torn starboard track guard",(.90,1.14,.62),(.77,.28,.20),blue,1,"track"),
      ("L05 ejected cupola visor",(-.38,-.61,1.98),(.50,.33,.23),blue,1,"cupola"),
      ("L06 exposed barrel shroud",(2.14,-.30,1.46),(.67,.21,.21),white,2,"barrel"),
      ("L07 broken breech casing",(.72,.43,1.62),(.66,.37,.31),shadow,2,"breech"),
      ("L08 ripped left turret cheek",(-.18,-.82,1.61),(.82,.47,.32),blue,2,"turret"),
      ("L09 peeled right turret plate",(.17,.89,1.51),(.77,.45,.28),white,2,"turret"),
      ("L10 collapsed ammunition door",(-.89,.42,1.54),(.53,.37,.19),brass,2,"ammo"),
      ("L11 diagonal reactor seam",(-.60,-.17,1.32),(.63,.075,.095),seam,0,"seam"),
      ("L12 turret bearing split seam",(.16,.19,1.45),(.56,.08,.09),seam,0,"seam"),
      ("L13 torn left drive sprocket",(-1.42,-1.04,.51),(.50,.36,.23),shadow,3,"track"),
      ("L14 broken right drive sprocket",(-1.38,1.08,.48),(.53,.37,.22),shadow,3,"track"),
      ("L15 jagged engine deck panel",(-1.11,-.40,1.04),(.84,.51,.19),blue,3,"engine"),
      ("L16 sheared underbody brace",(-.27,.06,.41),(1.02,.26,.20),brass,3,"frame"),
      ("L17 shattered commander optic",(-.66,-.58,1.31),(.28,.27,.29),white,3,"optic"),
      ("L18 cold fractured coolant plate",(-1.04,.54,.92),(.67,.43,.18),seam,3,"seam")]
    shards=[fragment(name,pos,dim,mat,root,reveal,role)
            for name,pos,dim,mat,reveal,role in specs]
    assert len(shards)==18
    origins=[tuple(o.location) for o in shards]
    # Saved editable source is intact/neutral with new objects hidden.
    root.rotation_euler=(0,0,0)
    running.location=(0,0,0);running.rotation_euler=(0,0,0)
    turret.rotation_euler=(0,0,0);barrel.rotation_euler=(0,0,0)
    barrel.location.x=.63
    for o in original:o.hide_render=False
    for o in shards+wreck+[flash,pulse]:o.hide_render=True
    bpy.context.view_layer.update()
    source=out/"coalition-lynx-four-stage-destruction.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for p,phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler=(0,0,facing*math.tau/FACINGS)
            running.location.z=(-.035,-.11,-.20,-.27)[p]
            running.rotation_euler=((.025,.065,.12,.17)[p],
                                    (-.035,.10,.18,.21)[p],
                                    (.01,-.035,.075,.12)[p])
            turret.rotation_euler=((.025,.09,.18,.27)[p],
                                   (-.04,.11,.23,.33)[p],
                                   (.05,-.16,.27,.43)[p])
            barrel.rotation_euler.y=(.04,.19,.38,.51)[p]
            barrel.location.x=(.63,.51,.36,.28)[p]
            for wheel in wheels:wheel.rotation_euler.y=(0,.14,.29,.34)[p]
            for o in original:
                name=o.name.lower();hide=False
                if p>=1 and any(t in name for t in
                   ("turret roof","commander cupola","panoramic optic",
                    "angular forward track guard")):hide=True
                if p>=2 and any(t in name for t in
                   ("turret cheek","mantlet","muzzle shroud",
                    "cannon central ion","cannon external cooling",
                    "rear ammunition access","turret side reactive",
                    "single long-bore electromagnetic cannon","laser warning")):hide=True
                if p==3 and any(t in name for t in
                   ("turret","gun","cannon","cupola","commander",
                    "ammunition","reactive side tile","ceramic flank",
                    "skirt reinforcement","rear engine deck","engine heat")):hide=True
                o.hide_render=hide or o in (flash,pulse)
            for i,o in enumerate(wreck):
                o.hide_render=p<2 or (p==2 and i not in (0,1,2,3,7))
            for i,o in enumerate(shards):
                o.hide_render=p<o["first_phase"]
                x,y,z=origins[i];scatter=(0,.05,.13,.20)[p]
                o.location=(x+scatter*(1 if i%2 else -1),
                            y+scatter*(1 if i%3 else -1),
                            z-(0,.06,.19,.30)[p])
                o.rotation_euler=(.12*p*(1 if i%2 else -1),
                                  .09*p*(1 if i%3 else -1),
                                  .17*p*(1 if i%2 else -1))
            bpy.context.view_layer.update()
            target=out/"frames"/phase/("%02d.png"%facing)
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED ORIGINAL LYNX DESTRUCTION",phase,FACINGS,flush=True)
    print("PREVIEW_ONLY",source,"128 NEW destruction sprites",flush=True)

if __name__=="__main__":
    main()
