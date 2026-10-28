#!/usr/bin/env python3
"""COA-VEH-005 MK-III enlarged physical optical sails, fixed-hull QA.

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


def notched_beveled_sail(name, parent, material, width, depth, height, role):
    """Watertight dual-notch concave outline with physical chamfer ring."""
    outline = [(-.50,0),(.48,0),(.46,.24),(.31,.48),(.15,.45),
               (.10,.32),(-.03,.42),(.16,.64),(.26,.82),(.02,1.0),
               (-.24,.87),(-.39,.68),(-.29,.57),(-.44,.50)]
    points = [(x*width,y*depth) for x,y in outline]
    area = sum(points[i][0]*points[(i+1)%len(points)][1] -
               points[(i+1)%len(points)][0]*points[i][1]
               for i in range(len(points)))
    if area < 0:
        points.reverse()
    n = len(points)
    center_x, center_y = 0.0, depth*.46
    verts = ([(x,y,0.0) for x,y in points] +
             [(x,y,height*.76) for x,y in points] +
             [(center_x+(x-center_x)*.87,
               center_y+(y-center_y)*.87,height*.97) for x,y in points])
    faces = [tuple(reversed(range(n))), tuple(range(2*n,3*n))]
    faces += [(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
    faces += [(n+i,n+(i+1)%n,2*n+(i+1)%n,2*n+i) for i in range(n)]
    obj = prism(name,parent,material,verts,faces,role)
    edge = bpy.data.materials.get("Hunter deployed ceramic diffraction spine")
    assert edge
    obj.data.materials.append(edge)
    for face in list(obj.data.polygons)[n+2:]:
        face.material_index = 1
    obj["mk3_profile"] = "dual_notch_closed_bevel_v1"
    obj["mk3_profile_points"] = n
    obj["mk3_bevel_ratio"] = .13
    from collections import Counter
    counts = Counter(tuple(sorted((face.vertices[i],
                                   face.vertices[(i+1)%len(face.vertices)])))
                     for face in obj.data.polygons for i in range(len(face.vertices)))
    assert len(obj.data.vertices)==42 and len(obj.data.polygons)==30
    assert counts and all(v==2 for v in counts.values())
    return obj

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
    # MK-III enlarges real physical sails without adding excessive glow.
    # Fixed-hull diagnostic frames isolate hinge and sail shape from chassis bob.
    glass = material("Hunter deployed dichroic graphite",(.12,.37,.37,1),.08)
    edge = material("Hunter deployed ceramic diffraction spine",(.36,.59,.56,1),.03)
    sails, ribs = [], []
    for i, hinge in enumerate(vanes):
        side = -1 if i < 2 else 1
        sail = notched_beveled_sail("Hunter optical deployment sail %d" % i,
                             hinge, glass, .98, side*.82, .57, "sail")
        sail.location = (-.06, side*.09, .28)
        sail["mk3_width"]=.98
        sail["mk3_depth"]=.82
        sail["mk3_height"]=.57
        sail["mk3_revision"]="dual_notch_bevel"
        sails.append(sail)
        for j in range(2):
            rib = tapered_plate("Hunter optical diffraction rib %d %d" % (i,j),
                                 hinge, edge, .17, side*(.54+j*.16), .22, "rib")
            rib.location = ((j-.5)*.39, side*.14, .37+j*.055)
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
    source = out/"coalition-hunter-optics-mk3.blend"
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
                obj.hide_render = False  # real folded fins, not vanished geometry
                obj.scale = ((.72,)*3 if phase_index == 0 else
                             ((1.,)*3 if phase_index in (1,3) else (1.09,)*3))
                obj.rotation_euler.z = ((-.03,.10,.21,.13)[phase_index] * (-1 if i<2 else 1))
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
    # Diagnostic render: fixed chassis, turret, wheels, tracks and camera;
    # only the real hinge/sail/shutter assemblies change between beats.
    # Four additional renders are NEW, not a rerender of validated assets.
    for phase_index, beat in enumerate(BEATS):
        root.rotation_euler = (0,0,4*math.tau/FACINGS)
        hull.location.z = 0
        hull.rotation_euler = (0,0,0)
        turret.rotation_euler = (0,0,0)
        for wheel in wheels:
            wheel.rotation_euler.y = 0
        for i,cleat in enumerate(cleats):
            cleat.location.x = -1.41+(i%12)*.25
        for i,vane in enumerate(vanes):
            side = -1 if i < 2 else 1
            vane.rotation_euler = (
                side*(.10,.36,.62,.44)[phase_index],
                (-.09,.08,.26,.13)[phase_index] * (1 if i%2 else -1),
                (.02,.10,.18,.09)[phase_index] * (1 if i%2 else -1))
        for i,obj in enumerate(sails):
            obj.hide_render = False
            obj.scale = ((.72,)*3 if phase_index == 0 else
                         ((1.,)*3 if phase_index in (1,3) else (1.09,)*3))
            obj.rotation_euler.z = ((-.03,.10,.21,.13)[phase_index] * (-1 if i<2 else 1))
        for i,obj in enumerate(ribs):
            obj.hide_render = phase_index < 2 or (phase_index==2 and i%2==1)
        for i,obj in enumerate(shutters):
            obj.hide_render = phase_index == 0
            obj.rotation_euler.y = (.0,.20,.40,.27)[phase_index] * (-1 if i%2 else 1)
        for obj in effects+wreck:
            obj.hide_render = True
        bpy.context.view_layer.update()
        target = out/"fixed_hull"/(beat+".png")
        target.parent.mkdir(parents=True,exist_ok=True)
        scene.render.filepath = str(target)
        bpy.ops.render.render(write_still=True)
    print("PREVIEW ONLY",source,"128 MK-III frames + 4 fixed-hull diagnostic frames",flush=True)

if __name__ == "__main__":
    main()
