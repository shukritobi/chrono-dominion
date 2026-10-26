#!/usr/bin/env python3
"""Generate original textured Blender models and sprite-animation frames.

Usage:
 blender -b -t 4 --python tools/blender/animated_assets.py -- \
   --output generated/chrono-hd --kinds soldier,specialist,heavy,aircraft,generator,factory
Blender 3.6+; deterministic original procedural mesh and PBR materials.
Each authored model is saved as editable .blend alongside transparent frames.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector
# Blender --python does not always include the source script directory in sys.path.
sys.path.insert(0,str(Path(__file__).resolve().parent))
from building_architecture import build as build_faction_architecture

FACTIONS = {
    "coalition": {"armor": (.18,.35,.53,1), "light": (.43,.72,.83,1), "dark": (.055,.12,.20,1), "glow": (.12,.85,1,1)},
    "federation": {"armor": (.53,.24,.17,1), "light": (.75,.51,.37,1), "dark": (.16,.10,.11,1), "glow": (1,.37,.08,1)},
    "psionic": {"armor": (.35,.20,.55,1), "light": (.62,.46,.80,1), "dark": (.12,.075,.21,1), "glow": (.22,1,.67,1)},
}
UNITS = ("soldier","specialist","tank","heavy","recon","harvester","aircraft")
BUILDINGS = ("hq","generator","refinery","barracks","factory","radar","tech","turret","beam","airfield")
ALL_KINDS = UNITS + BUILDINGS
FRAME_PLAN = {"unit": {"idle": 1,"move": 2,"attack": 1}, "building": {"idle": 2,"construct": 2,"damaged": 1}}
ROOT = None
PARTS = {}
MATS = {}

def mat(name, rgba, metallic=.3, roughness=.43, glow=0, rough_texture=False):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    nodes = m.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if glow:
            emit = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
            strength = bsdf.inputs.get("Emission Strength")
            if emit: emit.default_value = rgba
            if strength: strength.default_value = glow
        if rough_texture:
            noise = nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 12
            noise.inputs["Roughness"].default_value = .45
            bump = nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = .045
            bump.inputs["Distance"].default_value = .012
            m.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
            m.node_tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m

def create_materials(faction):
    p = FACTIONS[faction]
    result = {
        "armor": mat(faction+"_painted_metal",p["armor"],.67,.43,rough_texture=True),
        "light": mat(faction+"_beveled_steel",(.63,.68,.74,1) if faction=="coalition" else p["light"],.52,.36,rough_texture=True),
        "dark": mat(faction+"_black_titanium",p["dark"],.5,.52,rough_texture=True),
        "glow": mat(faction+"_emissive",p["glow"],.0,.26,glow=1.1),
        "glass": mat(faction+"_glass",tuple(min(1,v*.7+.15) for v in p["glow"][:3])+(1,),.14,.12),
        "rubber": mat(faction+"_rubber",(.055,.062,.073,1),.0,.85),
        "bronze": mat(faction+"_ore",(.76,.43,.18,1),.50,.36,rough_texture=True)
    }
    glass_bsdf=result["glass"].node_tree.nodes.get("Principled BSDF")
    if glass_bsdf:
        transmission=glass_bsdf.inputs.get("Transmission Weight")
        if transmission:transmission.default_value=.68
        ior=glass_bsdf.inputs.get("IOR")
        if ior:ior.default_value=1.45
    return result

def parent(obj):
    obj.parent = ROOT
    return obj

def box(name, loc, size, material, bevel=.07):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(MATS[material])
    if bevel:
        modifier = obj.modifiers.new("Hard surface bevel","BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return parent(obj)

def cyl(name, loc, radius, depth, material, axis="Z", vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o=bpy.context.object
    o.name=name
    if axis=="X":o.rotation_euler.y=math.pi/2
    if axis=="Y":o.rotation_euler.x=math.pi/2
    o.data.materials.append(MATS[material])
    return parent(o)

def sphere(name, loc, scale, material, segments=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=loc)
    o=bpy.context.object
    o.name=name
    o.scale=scale
    o.data.materials.append(MATS[material])
    bpy.ops.object.shade_smooth()
    return parent(o)

def mesh(name, verts, faces, material):
    data=bpy.data.meshes.new(name+"_geometry")
    data.from_pydata(verts,[],faces)
    data.update()
    o=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(MATS[material])
    return parent(o)

def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    sc=bpy.context.scene
    # Cycles software mode is stable on headless Linux CI runners without EGL / X11.
    sc.render.engine="CYCLES"
    sc.cycles.device="CPU"
    sc.cycles.samples=48
    # Ubuntu's apt Blender can be compiled without OpenImageDenoise.
    # Rely on more CPU samples so our GitHub runner remains headless-safe.
    sc.cycles.use_denoising=False
    sc.render.resolution_percentage=100
    sc.render.film_transparent=True
    sc.render.image_settings.file_format="PNG"
    sc.render.image_settings.color_mode="RGBA"
    sc.render.image_settings.color_depth="8"
    sc.render.resolution_x=160
    sc.render.resolution_y=160
    sc.view_settings.view_transform="Standard"
    try:sc.view_settings.look="Medium High Contrast"
    except (TypeError, ValueError):pass
    bpy.ops.object.light_add(type="AREA",location=(-4,-5,9))
    sun=bpy.context.object
    sun.name="Large studio softbox"
    sun.data.energy=900
    sun.data.shape="DISK"
    sun.data.size=7
    bpy.ops.object.light_add(type="AREA",location=(3,4,5))
    fill=bpy.context.object
    fill.name="Rim softbox"
    fill.data.energy=360
    fill.data.size=5
    bpy.ops.object.camera_add(location=(6,-8,7))
    sc.camera=bpy.context.object
    sc.camera.name="Fixed orthographic RTS camera"
    sc.camera.data.type="ORTHO"
    sc.render.image_settings.compression=45
    world = sc.world
    if world and world.use_nodes:
        background=world.node_tree.nodes.get("Background")
        if background:background.inputs["Strength"].default_value=.55
    return sc

def set_camera(kind):
    sc=bpy.context.scene
    h=1.1 if kind in ("soldier","specialist") else (1.35 if kind in UNITS else 1.8)
    point=Vector((0,0,h))
    camera=sc.camera
    camera.rotation_euler=(point-camera.location).to_track_quat("-Z","Y").to_euler()
    camera.data.ortho_scale=4.9 if kind in ("soldier","specialist") else (7.3 if kind in BUILDINGS else 6.8)

def base_infantry(kind):
    box("Torso exosuit",(0,0,1.52),(.65,.46,.91),"armor",.13)
    box("Chest armour",(0,-.25,1.63),(.46,.12,.53),"light",.065)
    box("Backpack",(-.26,.26,1.62),(.25,.31,.6),"dark",.035)
    box("Utility belt",(0,0,1.03),(.7,.53,.15),"dark",.035)
    for side in (-1,1):
        PARTS["leg"+str(side)] = box("Articulated leg",(.23*side,0,.56),(.27,.34,.93),"dark",.07)
        box("Boot",(.23*side,-.11,.15),(.29,.55,.28),"armor",.025)
        PARTS["arm"+str(side)] = box("Armoured shoulder",(.43*side,0,1.62),(.25,.40,.69),"armor",.07)
        sphere("Shoulder bearing",(.48*side,0,1.92),(.18,.18,.18),"light")
    sphere("Neck",(0,0,2.12),(.16,.16,.17),"dark")
    sphere("Head helmet",(0,0,2.33),(.32,.34,.32),"armor")
    box("Tactical visor",(0,-.31,2.32),(.50,.075,.17),"glass",.03)
    box("Helmet crest",(0,-.06,2.65),(.4,.41,.07),"light",.02)
    if kind=="specialist":
        sphere("Mindwave emitter",(.62,-.23,1.51),(.25,.24,.25),"glow")
        cyl("Pulse containment rings",(.62,-.23,1.51),.30,.06,"light",axis="X")
        sphere("Chest reactor",(0,-.34,1.60),(.14,.12,.14),"glow")
    else:
        box("Rifle receiver",(.57,-.40,1.55),(.83,.16,.18),"dark",.025)
        cyl("Rifle barrel",(1.05,-.40,1.56),.056,.78,"light",axis="X")
        box("Rifle optics",(.43,-.40,1.68),(.23,.14,.15),"glass",.02)
        PARTS["muzzle"]=sphere("Muzzle flash",(1.5,-.40,1.56),(.16,.20,.19),"glow")
    return

def base_vehicle(kind):
    body_len=3.7 if kind in ("tank","heavy") else 3.0
    track_y=1.0 if kind=="heavy" else .82
    box("Main armoured hull",(0,0,.75),(body_len,1.75,.78),"armor",.19)
    box("Upper glacis",(.65,0,1.13),(1.6,1.45,.29),"light",.08)
    for side in (-1,1):
        y=side*track_y
        box("Track housing",(0,y,.45),(body_len*1.05,.45,.63),"dark",.11)
        for i in range(6):
            cyl("Machined wheel",(-1.34+i*.54,y+side*.25,.43),.18,.13,"light",axis="Y")
        box("Top tread",(0,y,.82),(body_len*1.03,.48,.17),"rubber",.035)
        box("Painted skirt",(0,y,.92),(body_len*.83,.18,.19),"armor",.055)
    box("Front headlamps",(body_len*.48,-.41,.98),(.08,.23,.11),"glow",.02)
    box("Front headlamps",(body_len*.48,.41,.98),(.08,.23,.11),"glow",.02)
    if kind=="recon":
        box("Cabin",(-.12,0,1.40),(1.18,1.13,.67),"light",.14)
        box("Front window",(.43,-.02,1.62),(.08,.85,.35),"glass",.025)
        PARTS["radar"]=cyl("Radome",(-.48,0,2.0),.36,.21,"glow")
        cyl("Sensor mast",(-.48,0,1.92),.045,.56,"light")
    elif kind=="harvester":
        box("Protected mineral hopper",(-.40,0,1.70),(1.80,1.58,.83),"dark",.07)
        for i in range(4):
            sphere("Ore payload",(-.9+i*.43,0,2.14),(.21,.34,.19),"bronze")
        PARTS["radar"]=cyl("Harvester drum",(1.43,0,.83),.47,1.61,"light",axis="Y")
    else:
        PARTS["turret"]=box("Rotating turret",(-.12,0,1.58),(1.34,1.26,.55),"light",.15)
        turret=PARTS["turret"]
        count=2 if kind=="heavy" else 1
        for i in range(count):
            y=0 if count==1 else (-.3 if i==0 else .3)
            cyl("Coaxial cannon",(1.06,y,1.60),.13,1.78,"dark",axis="X")
            cyl("Barrel muzzle",(1.97,y,1.60),.17,.21,"light",axis="X")
        sphere("Targeting optics",(.42,-.42,1.91),(.15,.16,.13),"glow")
        if kind=="heavy":
            for side in (-1,1):
                box("Explosive reactive armour",(-.8,side*1.22,1.22),(1.32,.16,.38),"armor",.06)

def base_aircraft():
    mesh("Stealth fuselage",[(-1.65,-.38,.8),(-1.65,.38,.8),
        (2.25,0,.82),(-1.65,-.38,1.20),(-1.65,.38,1.20),(1.1,0,1.31)],
        [(0,1,2),(3,5,4),(0,3,4,1),(0,2,5,3),(1,4,5,2)],"armor")
    mesh("Delta swept wings",[(-1.2,-2.15,.89),(.55,-.45,1.02),(.55,.45,1.02),
        (-1.2,2.15,.89),(-1.35,.8,.93),(-1.35,-.8,.93)],
        [(0,1,2,3),(0,3,4,5)],"light")
    sphere("High resolution cockpit",(.36,0,1.25),(.9,.37,.31),"glass")
    for side in (-1,1):
        cyl("Twin jet nacelles",(-1.47,side*.38,.83),.21,.9,"dark",axis="X")
        sphere("Exhaust glow",(-1.96,side*.38,.83),(.08,.19,.19),"glow")
        mesh("Vertical stabilizer",[(-1.40,side*.47,.96),(-1.82,side*.67,1.72),
            (-.67,side*.47,1.0)],[(0,1,2)],"armor")
    PARTS["wing"]=ROOT

def base_building(kind,faction):
    # Faction and kind each select a unique 3D silhouette; authored from the design bible.
    model=build_faction_architecture(faction,kind,box,cyl,sphere,mesh,PARTS,MATS,ROOT)
    # Every structure has a physically blinking status lamp at a readable
    # foreground footing. Material-only emission fluctuations sometimes
    # render to identical RGBA PNGs on Linux CPU Cycles.
    beacon_position = {
        "coalition": (1.20,-1.25,.78),
        "federation": (1.30,-1.29,.89),
        "psionic": (1.18,-.96,.88)
    }[faction]
    PARTS["idle_beacon"]=sphere(
        "Visible animated base telemetry lamp",beacon_position,
        (.145,.145,.15),"glow",segments=12,rings=8)
    # Construction begins with the actual full-size foundation, not a
    # miniature copy of the finished building. Only upper equipment is
    # hidden during the first construction frame.
    PARTS["construction_structures"]=tuple(
        o for o in ROOT.children if o != PARTS["idle_beacon"])
    for index,(x,y) in enumerate(((-1.25,-1.20),(1.25,-1.20),
                                  (-1.25,1.20),(1.25,1.20))):
        post=box("Temporary build scaffold post",(x,y,1.29),
                 (.10,.10,1.36),"light",.012)
        post.hide_render=True
        PARTS["scaffold_post_"+str(index)]=post
    for y in (-1.20,1.20):
        beam=box("Temporary build scaffold top rail",(0,y,1.97),
                 (2.60,.11,.12),"light",.012)
        beam.hide_render=True
        PARTS["scaffold_rail_"+str(y)]=beam
    # Three actual jagged wreckage meshes replace the former
    # lean-and-dim-only damaged pose. Their position is on the visible
    # camera-facing apron (+X, -Y), not floating over the roof.
    for index,(dx,dy,dz) in enumerate(((0.0,0.0,0.0),
                                      (-.28,.26,-.12),(.16,.48,-.18))):
        fragment=mesh("Damaged fractured facade slab",[
            (1.02+dx,-1.30+dy,.80+dz),
            (1.56+dx,-1.30+dy,.79+dz),
            (1.48+dx,-1.18+dy,1.55+dz),
            (1.13+dx,-1.12+dy,1.20+dz)
        ],[(0,1,2),(0,2,3)],"armor" if index==0 else "dark")
        fragment.hide_render=True
        PARTS["damage_rubble_"+str(index)]=fragment
    return model

def animate(kind,state,frame,frames):
    # Two-frame poses are opposite, not sin(0) and sin(pi) (which are identical).
    pose=1 if frame % 2 else -1
    phase=(frame/max(1,frames))*math.pi*.68
    ROOT.scale=(1,1,1)
    ROOT.location=(0,0,0)
    ROOT.rotation_euler=(0,0,0)
    for part,o in PARTS.items():
        if part.startswith(("leg","arm")):o.rotation_euler.y=0
    if state=="move":
        if kind in ("soldier","specialist"):
            for side in (-1,1):
                PARTS["leg"+str(side)].rotation_euler.y=side*pose*.48
                PARTS["arm"+str(side)].rotation_euler.y=-side*pose*.27
            ROOT.location.z=.035 if frame % 2 else 0
        elif kind=="aircraft":ROOT.rotation_euler.x=.08*pose
        else:ROOT.location.z=.035 if frame % 2 else 0
    elif state=="attack":
        ROOT.location.x=-.07 if frame==0 else .0
    if "radar" in PARTS:
        PARTS["radar"].rotation_euler.z=phase
    if "muzzle" in PARTS:
        PARTS["muzzle"].hide_render=state!="attack"
    if "construction_structures" in PARTS:
        # Reset every render. Blender keeps hide_render flags between
        # sequential frames, so a hidden construction part must not leak
        # into the idle or damaged states.
        foundation_names=("foundation","technical deck","plinth",
                          "energy well","stone dais","base skirt",
                          "identity strip","furnace indicator",
                          "foundation needle","front blast buttress")
        early_build=state=="construct" and frame==0
        for o in PARTS["construction_structures"]:
            o.hide_render=(early_build and
                           not any(t in o.name.lower() for t in foundation_names))
        for part,o in PARTS.items():
            if part.startswith("scaffold_"):
                o.hide_render=not early_build
            elif part.startswith(("damage_rubble_","damage_only_")):
                # Architecture-authored collapsed steel and debris remain
                # invisible in idle/construct, including after a damaged pose.
                o.hide_render=state!="damaged"
        if state=="damaged":
            for part in ("damage_breakable","damage_secondary","damage_tertiary","damage_quaternary"):
                if part in PARTS:
                    PARTS[part].hide_render=True
    if "idle_beacon" in PARTS:
        PARTS["idle_beacon"].hide_render=(
            state!="idle" or frame%2==0)
    if state=="damaged":
        ROOT.rotation_euler.x=.045
    # Building idle frames actually pulse; otherwise symmetric toroids render static.
    glow=MATS.get("glow")
    if glow and glow.use_nodes:
        bsdf=glow.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            strength=bsdf.inputs.get("Emission Strength")
            if strength:strength.default_value=.45 if state=="damaged" else (1.35 if frame % 2 else .75)
    bpy.context.view_layer.update()

def clear_models():
    keep={o for o in bpy.context.scene.objects if o.type in {"CAMERA","LIGHT"}}
    for o in list(bpy.context.scene.objects):
        if o not in keep:bpy.data.objects.remove(o,do_unlink=True)

def run(output,kinds,factions,size):
    global ROOT,PARTS,MATS
    sc=reset_scene()
    sc.render.resolution_x=sc.render.resolution_y=size
    for faction in factions:
        for kind in kinds:
            clear_models()
            PARTS={}
            MATS=create_materials(faction)
            ROOT=bpy.data.objects.new("Animated "+faction+" "+kind,None)
            bpy.context.collection.objects.link(ROOT)
            if kind in ("soldier","specialist"):base_infantry(kind)
            elif kind=="aircraft":base_aircraft()
            elif kind in UNITS:base_vehicle(kind)
            else:base_building(kind,faction)
            set_camera(kind)
            source=output/"sources"/f"{faction}-{kind}.blend"
            source.parent.mkdir(parents=True,exist_ok=True)
            bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
            states=FRAME_PLAN["unit" if kind in UNITS else "building"]
            directions=8 if kind in UNITS else 1
            for state,num_frames in states.items():
                for facing in range(directions):
                    for frame in range(num_frames):
                        animate(kind,state,frame,num_frames)
                        ROOT.rotation_euler.z=facing*math.tau/directions
                        target=output/"frames"/faction/kind/state/f"{facing:02d}_{frame:02d}.png"
                        target.parent.mkdir(parents=True,exist_ok=True)
                        sc.render.filepath=str(target)
                        bpy.ops.render.render(write_still=True)
            print("Finished",faction,kind,flush=True)

def options():
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,default=Path("generated/chrono-hd"))
    p.add_argument("--kinds",default="soldier,specialist,heavy,aircraft,generator,factory,radar")
    p.add_argument("--factions",default="coalition,federation,psionic")
    p.add_argument("--size",type=int,default=160)
    a=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    return p.parse_args(a)

def main():
    args=options()
    kinds=list(ALL_KINDS) if args.kinds=="all" else args.kinds.split(",")
    factions=args.factions.split(",")
    unknown=set(kinds)-set(ALL_KINDS)
    if unknown:raise ValueError("Unknown kinds: "+str(unknown))
    if set(factions)-set(FACTIONS):raise ValueError("Unknown factions")
    if args.size not in (128,160,192,256):raise ValueError("Expected power-friendly sprite size")
    run(args.output,kinds,factions,args.size)

if __name__=="__main__":main()
