#!/usr/bin/env python3
"""COA-VEH-005 four-beat adaptive-optic deployment, original Blender geometry.

PREVIEW ONLY. Reuses the validated saved Hunter .blend without rerendering
or mutating its 128 approved-as-preview baseline PNGs. The four beats are
fold, spread, refract and glide, each rendered at 32 facings.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy

BEATS = ("fold", "spread", "refract", "glide")
FACINGS = 32

def objects(prefix):
    return sorted((o for o in bpy.data.objects if o.name.startswith(prefix)), key=lambda o: o.name)

def material(name, color, glow):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    node = m.node_tree.nodes.get("Principled BSDF")
    assert node
    node.inputs["Base Color"].default_value = color
    node.inputs["Metallic"].default_value = .32
    node.inputs["Roughness"].default_value = .38
    node.inputs["Emission Color"].default_value = (.045, .22, .19, 1)
    node.inputs["Emission Strength"].default_value = glow
    return m

def prism(name, parent, material, vertices, faces, role):
    mesh = bpy.data.meshes.new(name + " editable solid")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(material)
    obj["optical_deployment_only"] = True
    obj["optical_role"] = role
    obj.hide_render = True
    return obj

def tapered_plate(name, parent, material, width, depth, height, role):
    # CLOSED, eight-vertex asymmetric wedge, not a flat plane or billboard.
    verts = [(-width*.52, 0, 0), (width*.47, 0, 0),
             (width*.34, depth, 0), (-width*.42, depth*.88, 0),
             (-width*.37, 0, height), (width*.30, 0, height),
             (width*.20, depth*.83, height*.83),
             (-width*.31, depth*.78, height*.88)]
    faces = [(3,2,1,0),(4,5,6,7),(0,1,5,4),
             (1,2,6,5),(2,3,7,6),(3,0,4,7)]
    return prism(name,parent,material,verts,faces,role)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.resolution_x == 160 and scene.render.resolution_y == 160
    roots = objects("Coalition Camouflage Hunter COA-VEH-005 original 32 facing")
    hulls = objects("Hunter independent tracked suspension")
    turrets = objects("Hunter rotating adaptive-optic turret")
    vanes = objects("Hunter independent optical camouflage vane hinge")
    wheels = objects("Hunter independently articulated roadwheel")
    cleats = objects("Hunter independent segmented tread cleat")
    effects = [o for o in bpy.data.objects if o.get("attack_only")]
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    assert tuple(map(len, (roots,hulls,turrets,vanes,wheels,cleats,effects,wreck))) == (1,1,1,4,8,24,3,14)
    root,hull,turret = roots[0],hulls[0],turrets[0]
    # A restrained physical dichroic finish, not a bright glow masking geometry.
    glass = material("Hunter deployed dichroic graphite",(.12,.37,.37,1),.08)
    edge = material("Hunter deployed ceramic diffraction spine",(.36,.59,.56,1),.03)
    sails, ribs = [], []
    for i, hinge in enumerate(vanes):
        side = -1 if i < 2 else 1
        sail = tapered_plate("Hunter optical deployment sail %d" % i,
                             hinge, glass, .66, side*.56, .34, "sail")
        sail.location = (-.04, side*.08, .18)
        sails.append(sail)
        for j in range(2):
            rib = tapered_plate("Hunter optical diffraction rib %d %d" % (i,j),
                                 hinge, edge, .14, side*(.38+j*.12), .16, "rib")
            rib.location = ((j-.5)*.31, side*.12, .25+j*.035)
            ribs.append(rib)
    # Four small physical projector shutters, independently articulated.
    shutters = []
    for i in range(4):
        shutter = tapered_plate("Hunter optical projector shutter %d" % i,
                                turret, edge, .20, .24, .14, "shutter")
        shutter.location = (.73, (-.35,-.13,.13,.35)[i], .31)
        shutters.append(shutter)
    added = sails+ribs+shutters
    assert (len(sails),len(ribs),len(shutters)) == (4,8,4)
    intact = [o for o in hull.children_recursive if o.type == "MESH"]
    # Save an intact pose, so the .blend can be reopened and edited safely.
    root.rotation_euler = (0,0,0)
    hull.location.z = 0
    hull.rotation_euler = (0,0,0)
    turret.rotation_euler = (0,0,0)
    for vane in vanes:
        vane.rotation_euler = (0,0,0)
    for obj in intact:
        obj.hide_render = obj in effects
    for obj in added+wreck:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out/"coalition-hunter-four-phase-optics.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 100000

    # No alpha-fading fake transparency: silhouette is altered by hinged,
    # individually editable physical surfaces and staggered deployment.
    for phase_index, beat in enumerate(BEATS):
        for facing in range(FACINGS):
            root.rotation_euler = (0,0,facing*math.tau/FACINGS)
            hull.location.z = (.05,.12,.08,.10)[phase_index]
            hull.rotation_euler = (
                (.018,.036,-.018,.012)[phase_index],
                (-.025,.018,.040,-.035)[phase_index],
                (0,.012,-.015,.025)[phase_index])
            turret.rotation_euler.z = (-.04,.03,-.025,.045)[phase_index]
            for i, vane in enumerate(vanes):
                side = -1 if i < 2 else 1
                vane.rotation_euler = (
                    side*(.10,.36,.62,.44)[phase_index],
                    (-.09,.08,.26,.13)[phase_index] * (1 if i%2 else -1),
                    (.02,.10,.18,.09)[phase_index] * (1 if i%2 else -1))
            for i,wheel in enumerate(wheels):
                wheel.rotation_euler.y = (.20,.48,.82,1.12)[phase_index] * (1 if i%2 else -1)
            for i,cleat in enumerate(cleats):
                cleat.location.x = (-1.41+(i%12)*.25)+(
                    (.025,.065,.12,.17)[phase_index] if i%2 else 0)
            for i,obj in enumerate(sails):
                obj.hide_render = phase_index == 0
                obj.rotation_euler.z = side * 0 if phase_index == 0 else (
                    (-.06,.06,.14,.10)[phase_index] * (-1 if i<2 else 1))
            for i,obj in enumerate(ribs):
                obj.hide_render = phase_index < 2 or (phase_index==2 and i%2==1)
            for i,obj in enumerate(shutters):
                obj.hide_render = phase_index == 0
                obj.rotation_euler.y = (.0,.20,.40,.27)[phase_index] * (-1 if i%2 else 1)
            for obj in effects+wreck:
                obj.hide_render = True
            bpy.context.view_layer.update()
            target = out/"frames"/beat/("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",beat,FACINGS,flush=True)
    print("PREVIEW ONLY",source,"128 new original optical deployment frames",flush=True)

if __name__ == "__main__":
    main()
