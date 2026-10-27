#!/usr/bin/env python3
"""Original Coalition modular support carrier. Preview-only 32-facing Blender sprite source.

Produces 128 transparent 160px PNGs (idle/move/attack/destroyed), an editable
.blend with independent turret, wheels and hidden wreckage. Never writes game art.
"""
import argparse, math, sys
from pathlib import Path
import bpy
from mathutils import Vector

STATES=("idle","move","attack","destroyed")
def mat(name,color,metal=.5,glow=0):
    m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=color
    b.inputs["Metallic"].default_value=metal
    b.inputs["Roughness"].default_value=.42
    if glow:
        b.inputs["Emission Color"].default_value=color
        b.inputs["Emission Strength"].default_value=glow
    return m
def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o)
    o.location=loc
    if parent:o.parent=parent
    return o
def cube(name,loc,dim,material,parent,damage=False):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o=bpy.context.object;o.name=name;o.location=loc;o.dimensions=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material);o.parent=parent
    bevel=o.modifiers.new("Machined edge","BEVEL");bevel.width=.035;bevel.segments=2
    o["wreckage_only"]=damage;o.hide_render=damage
    return o
def cyl(name,loc,radius,depth,material,parent,axis="Y"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=radius,depth=depth)
    o=bpy.context.object;o.name=name;o.location=loc
    if axis=="Y":o.rotation_euler.x=math.pi/2
    if axis=="X":o.rotation_euler.y=math.pi/2
    o.data.materials.append(material);o.parent=parent
    o["wreckage_only"]=False
    return o
def wedge(name,vertices,faces,material,parent):
    data=bpy.data.meshes.new(name+" geometry");data.from_pydata(vertices,[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o)
    o.data.materials.append(material);o.parent=parent;o["wreckage_only"]=False
    return o
def scene_setup():
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    s=bpy.context.scene;s.render.engine="CYCLES";s.cycles.device="CPU"
    s.cycles.samples=16;s.cycles.use_denoising=False
    s.render.film_transparent=True;s.render.resolution_x=160;s.render.resolution_y=160
    s.render.resolution_percentage=100;s.render.image_settings.file_format="PNG"
    s.render.image_settings.color_mode="RGBA";s.render.image_settings.color_depth="8"
    s.view_settings.view_transform="Standard"
    for loc,energy,size in (((-4,-5,8),820,6),((3,4,6),340,5)):
        bpy.ops.object.light_add(type="AREA",location=loc)
        o=bpy.context.object;o.data.energy=energy;o.data.shape="DISK";o.data.size=size
    bpy.ops.object.camera_add(location=(6,-8,6.4));cam=bpy.context.object
    cam.name="Fixed RTS orthographic camera";cam.data.type="ORTHO";cam.data.ortho_scale=6.9
    cam.rotation_euler=(Vector((0,0,1.15))-cam.location).to_track_quat("-Z","Y").to_euler()
    s.camera=cam
    return s
def build():
    steel=mat("Coalition titanium steel",(.25,.45,.60,1),.7)
    light=mat("Coalition bright armour",(.55,.76,.85,1))
    dark=mat("Coalition charcoal joints",(.045,.083,.12,1))
    rubber=mat("Coalition tyre compound",(.025,.035,.048,1),.05)
    cyan=mat("Coalition illuminated optics",(.10,.88,1,1),0,1.8)
    orange=mat("Coalition exposed emergency metal",(.95,.41,.17,1))
    root=empty("Coalition Modular Support Carrier - 32 facings")
    suspension=empty("Animated independent suspension",root)
    cube("Six-wheel armoured chassis",(0,0,.69),(3.35,1.63,.67),steel,suspension)
    cube("Low ballistic belly",(0,0,.39),(3.18,1.52,.25),dark,suspension)
    cube("Roof equipment deck",(-.37,0,1.13),(2.07,1.39,.23),light,suspension)
    wedge("Original sloped glacis",[
        (1.03,-.83,.57),(1.78,-.72,.57),(1.78,.72,.57),(1.03,.83,.57),
        (.90,-.75,1.19),(1.33,-.65,.97),(1.33,.65,.97),(.90,.75,1.19)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        light,suspension)
    wheels=[]
    for side in (-1,1):
        y=side*.81
        cube("Angular modular side armour",(-.22,y,.82),(2.18,.18,.50),steel,suspension)
        cube("Personnel side hatch",(-.95,y*1.06,.98),(.59,.09,.42),light,suspension)
        cube("Glowing side identification",(.38,y*1.11,1.05),(.53,.06,.075),cyan,suspension)
        for x in (-1.10,-.05,1.00):
            wheel=empty("Independent wheel hub",suspension,(x,side*.91,.37))
            wheels.append(wheel)
            cyl("All-terrain wheel",(0,0,0),.37,.24,rubber,wheel)
            cyl("Machined hub",(0,-side*.14,0),.20,.035,light,wheel)
            for angle in (0,2*math.pi/3,4*math.pi/3):
                cube("Visible rotating spoke",(.12*math.cos(angle),-side*.17,
                    .12*math.sin(angle)),(.17,.034,.045),steel,wheel)
    cube("Rear personnel ramp",(-1.66,0,.78),(.12,1.25,.77),dark,suspension)
    cube("Ramp hinge",(-1.73,0,1.16),(.10,1.22,.11),light,suspension)
    cube("Communication spine",(-.97,0,1.41),(.64,.46,.46),steel,suspension)
    cyl("Communications mast",(-1.02,-.28,1.84),.035,.60,light,suspension,"Z")
    cube("Mast blue transponder",(-1.02,-.28,2.18),(.13,.13,.18),cyan,suspension)
    turret=empty("Independent rotating support turret",suspension,(0,0,1.22))
    cube("Support weapon receiver",(.30,0,.26),(.94,.85,.42),steel,turret)
    cube("Sensor turret crown",(.23,0,.53),(.61,.58,.15),light,turret)
    cube("Wide optic visor",(.72,0,.31),(.09,.52,.16),cyan,turret)
    for side in (-1,1):
        cyl("Pulse barrel",(1.03,side*.24,.28),.09,.76,dark,turret,"X")
        cube("Barrel cooling sleeve",(1.19,side*.24,.28),(.26,.20,.20),cyan,turret)
    muzzle=cube("Attack-only pulse flare",(1.48,0,.29),(.27,.52,.24),cyan,turret)
    muzzle.hide_render=True
    wreck=[
        cube("Destroyed-only torn roof",(-.55,-.49,1.54),(1.21,.39,.21),orange,root,True),
        cube("Destroyed-only fallen turret",(.72,-.82,1.49),(1.22,.69,.41),steel,root,True),
        cube("Destroyed-only sheared mast",(-1.06,-.49,2.25),(.13,.14,.91),light,root,True),
        cube("Destroyed-only exposed fracture",(1.26,-.76,1.25),(.18,.13,1.07),orange,root,True)]
    for obj,angles in zip(wreck,((.22,.29,-.49),(.27,.56,-.71),(.34,.59,-.51),(.12,-.50,-.15))):
        obj.rotation_euler=angles
    return root,suspension,turret,wheels,muzzle,wreck
def apply_pose(parts,state,direction):
    root,suspension,turret,wheels,muzzle,wreck=parts
    root.rotation_euler=(0,0,direction*math.tau/32)
    suspension.location.z=.07 if state=="move" else 0
    suspension.rotation_euler=(0,.025 if state=="move" else .15 if state=="destroyed" else 0,0)
    turret.rotation_euler.z=-.16 if state=="attack" else 0
    for wheel in wheels:wheel.rotation_euler.y=.72 if state=="move" else 0
    for o in suspension.children_recursive:
        if o.type=="MESH":o.hide_render=False
    muzzle.hide_render=state!="attack"
    for o in wreck:o.hide_render=state!="destroyed"
    if state=="destroyed":
        for o in suspension.children_recursive:
            if o.type=="MESH" and any(word in o.name.lower() for word in
                ("weapon receiver","pulse barrel","sensor turret crown","mast","transponder")):
                o.hide_render=True
    bpy.context.view_layer.update()
def main():
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    args=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup();parts=build()
    source=out/"coalition-modular-support-carrier.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 directions",flush=True)
    print("PREVIEW_ONLY",source,"128 transparent PNG frames",flush=True)
if __name__=="__main__":main()
