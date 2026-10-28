#!/usr/bin/env python3
"""PSI-VEH-004 Hallucination Drone: original tri-helix distortion skimmer.

PREVIEW ONLY: purpose-built asymmetric nine-sided hover hull, four articulated
split membrane fins, three physically open helical projector masts, independent
hover rotors, attack-only refractive ring geometry and closed manifold wrecks.
Writes only beneath --output; no game textures, manifests or runtime changes.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")

def strut(name, start, end, thickness, material, parent):
    a, b = Vector(start), Vector(end)
    direction = b-a
    obj = cube(name, (a+b)*.5, (thickness, thickness, direction.length),
               material, parent)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj

def shard(name, location, scale, rotation, material, parent):
    # Six non-regular planar corners, extruded to a closed manifold solid.
    corners = [(-.67,-.18),(-.29,-.57),(.19,-.43),(.65,-.03),
               (.23,.49),(-.46,.36)]
    sx,sy,sz = scale
    verts = [(x*sx,y*sy,-sz*.5) for x,y in corners]
    verts += [(x*sx,y*sy,sz*.5) for x,y in corners]
    faces = [tuple(range(5,-1,-1)),tuple(range(6,12))]
    faces += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    o = wedge(name, verts, faces, material, parent)
    o.location = location
    o.rotation_euler = rotation
    o["closed_fracture"] = True
    o["wreckage_only"] = True
    o.hide_render = True
    return o

def build():
    indigo = mat("Hallucination indigo composite", (.135,.082,.29,1), .51)
    lilac = mat("Hallucination iridescent ceramic", (.59,.43,.79,1), .34)
    dark = mat("Hallucination obsidian joints", (.038,.028,.075,1), .26)
    bronze = mat("Hallucination rose-bronze conductor", (.64,.28,.48,1), .73)
    green = mat("Hallucination ghost-green emitter", (.32,.98,.63,1), .10, 1.35)
    pulse = mat("Hallucination unstable violet interference", (.88,.44,1,1), .08, 1.75)
    hot = mat("Hallucination exposed fracture", (.90,.30,.56,1), .15, .35)

    root = empty("PSI-VEH-004 ORIGINAL Hallucination Drone")
    body = empty("Hallucination independent hover chassis", root)
    # Purpose-authored 18-vertex closed polygonal hull, neither a cube nor
    # the 20-vertex manta body of PSI-VEH-006.
    footprint = [(1.77,-.13),(1.77,.18),(1.22,.56),(.38,.89),
                 (-.96,.79),(-1.54,.34),(-1.62,-.39),(-.89,-.88),(.36,-.95)]
    lower = [(x,y,.53) for x,y in footprint]
    upper = [(x*.87,y*.87,1.10+(.10 if x<-.6 else 0)) for x,y in footprint]
    faces = [tuple(range(8,-1,-1)),tuple(range(9,18))]
    faces += [(i,(i+1)%9,(i+1)%9+9,i+9) for i in range(9)]
    hull = wedge("Hallucination ORIGINAL 18-vertex dart hull",
                 lower+upper, faces, indigo, body)
    hull["custom_hull"] = True
    cube("Hallucination underbelly field trough", (-.08,0,.48),
         (2.45,1.10,.18), dark, body)
    # Asymmetric split prow distinguishes front/back at 80px.
    for side in (-1,1):
        wedge("Hallucination split beak %s" % side,
              [(1.10,side*.19,.71),(1.93,side*.34,.63),
               (1.11,side*.46,.73),(1.08,side*.23,1.10),
               (1.69,side*.34,1.00),(1.08,side*.43,1.10)],
              [(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),
               (2,0,3,5)], lilac, body)
    cube("Hallucination offset central optical eye", (1.52,-.09,1.02),
         (.20,.33,.15), green, body)
    cube("Hallucination rear equipment spine", (-.92,.18,1.23),
         (.64,.52,.27), lilac, body)

    rotors = []
    for side in (-1,1):
        for x in (-.97,.94):
            pivot = empty("Hallucination independent hover rotor",
                          body, (x,side*.78,.40))
            rotors.append(pivot)
            cyl("Hallucination toroidal rotor housing", (0,0,0),
                .31,.22,indigo,pivot,"Y")
            cyl("Hallucination rotating iridescent rotor", (0,side*.15,0),
                .19,.07,lilac,pivot,"Y")
            cyl("Hallucination exposed green levitation core",
                (0,side*.20,0),.10,.035,green,pivot,"Y")

    fins = []
    for side in (-1,1):
        for x in (-.64,.66):
            pivot = empty("Hallucination independent membrane fin hinge",
                          body, (x,side*.76,1.01))
            pivot["fin_hinge"] = True
            fins.append(pivot)
            # Open V-shaped forked foil: separate tapered beams, not a
            # transparent rectangle or fake alpha-masked solid.
            for j,dx in enumerate((-.23,.23)):
                o = strut("Hallucination split foil structural spar",
                          (0,0,0),(dx,side*.73,.33),
                          .13,lilac,pivot)
                o["open_fin_spar"] = True
            strut("Hallucination foil edge conductor",
                  (-.23,side*.73,.33),(.23,side*.73,.33),
                  .09,bronze,pivot)
            cube("Hallucination green fin-tip prism",
                 (0,side*.75,.35),(.20,.17,.14),green,pivot)

    projector = empty("Hallucination tri-helix open projector assembly",
                      body, (-.15,0,1.18))
    helices = []
    # Three helices each with four physical struts. No cylinder or dome
    # obstructs the central vertical opening.
    for arm in range(3):
        base_angle = arm*math.tau/3+.18
        points = []
        for step in range(5):
            angle = base_angle + step*.25
            radius = .62-.055*step
            points.append((radius*math.cos(angle),
                           radius*math.sin(angle),step*.25+.03))
        for segment in range(4):
            o = strut("Hallucination open twisted projector %d-%d" %
                      (arm,segment),points[segment],points[segment+1],
                      .12,bronze if segment<3 else lilac,projector)
            o["helix_strut"] = True
            helices.append(o)
        cube("Hallucination floating projector endpoint",points[-1],
             (.22,.22,.19),green,projector)
    # Physically distinct concentric interference arcs (18 total), hidden
    # until attack; each segment follows the projector assembly.
    effects = []
    for ring,(radius,z) in enumerate(((.98,.78),(1.32,.48))):
        for index in range(9):
            a = index*math.tau/9
            b = (index+1)*math.tau/9
            o = strut("Hallucination attack-only distortion arc %d-%02d" %
                      (ring,index),
                      (radius*math.cos(a),radius*math.sin(a),z),
                      (radius*math.cos(b),radius*math.sin(b),z),
                      .095 if ring==0 else .075,pulse,projector)
            o["attack_only"] = True
            o.hide_render = True
            effects.append(o)

    pieces = [
        ("broken prow left",(1.20,-.35,.49),(.79,.40,.30),(.23,.18,-.38),lilac),
        ("broken prow right",(1.18,.41,.48),(.73,.42,.31),(.32,-.22,.40),indigo),
        ("severed port wing",(-.40,-.92,.47),(.84,.35,.26),(.33,.19,-.48),lilac),
        ("severed starboard wing",(-.36,.90,.44),(.85,.36,.29),(.24,-.21,.42),indigo),
        ("fallen helix one",(-.45,-.38,.71),(.71,.25,.28),(.41,.20,-.37),bronze),
        ("fallen helix two",(.37,.47,.69),(.70,.29,.27),(.30,-.28,.34),bronze),
        ("shattered projector core",(.06,-.12,.65),(.63,.47,.25),(.25,-.16,.26),hot),
        ("crushed aft chassis",(-1.18,.08,.52),(.85,.51,.29),(.35,.17,-.24),indigo),
        ("torn rotor pod",(-1.16,-.83,.30),(.62,.43,.29),(.29,.14,-.40),indigo),
        ("fractured optical eye",(.78,.22,.61),(.59,.39,.24),(.28,-.20,.30),hot),
    ]
    wreck = [shard("Hallucination wreck "+name,loc,scale,rot,material,root)
             for name,loc,scale,rot,material in pieces]
    return root,body,hull,rotors,fins,projector,helices,effects,wreck

def pose(parts,state,facing):
    root,body,hull,rotors,fins,projector,helices,effects,wreck = parts
    root.rotation_euler.z = facing*math.tau/32
    body.location.z = .12 if state=="move" else -.12 if state=="destroyed" else 0
    body.rotation_euler.y = .075 if state=="move" else -.10 if state=="destroyed" else 0
    for i,rotor in enumerate(rotors):
        rotor.rotation_euler.y = (.47 if i%2 else -.47) if state=="move" else 0
    for i,fin in enumerate(fins):
        fin.rotation_euler.x = ((.52 if i%2 else -.52) if state=="attack"
                                else (.18 if i%2 else -.18) if state=="move"
                                else 0)
        fin.rotation_euler.y = -.22 if state=="attack" else 0
    projector.rotation_euler.z = .25 if state=="attack" else 0
    for o in body.children_recursive:
        if o.type=="MESH": o.hide_render=False
    for effect in effects: effect.hide_render = state!="attack"
    for piece in wreck: piece.hide_render = state!="destroyed"
    if state=="destroyed":
        hull.hide_render=True
        for o in body.children_recursive:
            if o.type=="MESH" and (o.get("helix_strut") or o.get("open_fin_spar")
                    or any(token in o.name.lower() for token in
                           ("split beak","foil edge","fin-tip","projector endpoint",
                            "offset central optical eye","rear equipment spine"))):
                o.hide_render=True
        for effect in effects: effect.hide_render=True
    bpy.context.view_layer.update()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve()
    out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup()
    parts=build()
    pose(parts,"idle",0)
    source=out/"psionic-hallucination-drone.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            target=out/"frames"/state/("%02d.png"%facing)
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,32,flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)

if __name__=="__main__":
    main()
