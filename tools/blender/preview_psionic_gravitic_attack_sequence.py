#!/usr/bin/env python3
"""Original four-phase magnetic vortex for PSI-VEH-005, preview-only.

Run Blender with the previously validated .blend as input. Render only new
32-facing temporal attack frames; never overwrite its original 128 PNGs.
"""
import argparse, math, sys
from pathlib import Path
import bpy

PHASES=("charge","grip","discharge","release")
def mat(name,color,strength):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=color
    bsdf=m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value=color
    bsdf.inputs["Emission Color"].default_value=color
    bsdf.inputs["Emission Strength"].default_value=strength
    return m

def tag(obj,parent,material):
    obj.parent=parent;obj["temporal_only"]=True;obj.hide_render=True
    obj.data.materials.append(material)
    return obj

def toroid(name,parent,location,radius,material):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=10,
        location=location,major_radius=radius,minor_radius=.065)
    obj=bpy.context.object;obj.name=name
    return tag(obj,parent,material)

def helix(name,parent,phase,material):
    curve=bpy.data.curves.new(name+" editable spline","CURVE")
    curve.dimensions="3D";curve.resolution_u=2
    curve.bevel_depth=.044;curve.bevel_resolution=3
    line=curve.splines.new("POLY");line.points.add(47)
    for i,p in enumerate(line.points):
        u=i/47;angle=1.25*math.tau*u+phase
        p.co=(.93+.47*math.cos(angle),.47*math.sin(angle),1.16+1.06*u,1)
    obj=bpy.data.objects.new(name,curve)
    bpy.context.collection.objects.link(obj)
    return tag(obj,parent,material)

def obj(name):
    value=bpy.data.objects.get(name)
    if value is None:raise RuntimeError("Missing validated source object: "+name)
    return value

def main():
    p=argparse.ArgumentParser();p.add_argument("--output",required=True,type=Path)
    args=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    scene=bpy.context.scene
    assert scene.render.resolution_x==160 and scene.render.resolution_y==160
    root=obj("Psionic Gravitic Manipulator PSI-VEH-005 - original 32 facings")
    suspension=obj("Four-pad independently floating gravitic carriage")
    tower=obj("Independent rotating central gravitic lifting spindle")
    beam=obj("Attack-only vertical gravitational lift beam")
    focus=obj("Attack-only suspended field target crystal")
    jaws=sorted((o for o in bpy.data.objects if o.name.startswith(
        "Independent articulated horseshoe magnetic jaw")),key=lambda o:o.name)
    wreck=[o for o in bpy.data.objects if o.get("wreckage_only")]
    assert len(jaws)==2 and len(wreck)==8,(len(jaws),len(wreck))
    mint=mat("Temporal vortex mint plasma",(.09,1,.68,1),4.2)
    blue=mat("Temporal vortex azure filaments",(.14,.68,1,1),3.5)
    rings=[toroid("Temporal-only vortex hoop %d"%i,suspension,
                  (.93,0,1.23+i*.34),.44+i*.05,mint if i%2==0 else blue)
           for i in range(3)]
    helices=[helix("Temporal-only magnetic spiral %d"%i,suspension,
                   i*math.pi/2,blue if i%2==0 else mint) for i in range(4)]
    added=rings+helices
    assert len(added)==7 and all(o.get("temporal_only") for o in added)
    root.rotation_euler=(0,0,0);beam.hide_render=True;focus.hide_render=True
    for o in added+wreck:o.hide_render=True
    source=out/"psionic-gravitic-temporal-attack.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for index,phase in enumerate(PHASES):
        for facing in range(32):
            root.rotation_euler=(0,0,facing*math.tau/32)
            suspension.location.z=(0,.03,.09,.01)[index]
            suspension.rotation_euler=(0,0,0)
            tower.rotation_euler.z=(.15,.36,.85,1.12)[index]
            tower.location.z=(.02,.11,.22,.05)[index]
            for side,jaw in zip((-1,1),jaws):
                jaw.rotation_euler.x=side*(.07,.21,.40,.12)[index]
            beam.hide_render=phase not in ("grip","discharge")
            focus.hide_render=phase not in ("grip","discharge")
            focus.location.z=(1.94,2.06,2.28,1.94)[index]
            beam.scale=(1,1,1) if phase=="grip" else (1.55,1.55,1.14)
            for i,ring in enumerate(rings):
                ring.hide_render=(phase=="charge" and i>0) or (phase=="release" and i==1)
                ring.location.z=1.24+i*.34+(.10 if phase=="discharge" else 0)
                ring.scale=(1,1,1) if phase=="charge" else (1+.17*i,1+.17*i,1)
            for i,arc in enumerate(helices):
                arc.hide_render=phase not in ("discharge","release") or (
                    phase=="release" and i%2==1)
                arc.rotation_euler.z=index*.33+i*.12
            for o in wreck:o.hide_render=True
            bpy.context.view_layer.update()
            path=out/"frames"/phase/("%02d.png"%facing)
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED NEW TEMPORAL ATTACK",phase,"32 facings",flush=True)
    print("PREVIEW_ONLY",source,"128 new frames; archived original unchanged",flush=True)

if __name__=="__main__":main()
