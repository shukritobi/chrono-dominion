#!/usr/bin/env python3
"""COA-VEH-007 original Coalition MCV: folding dual-rail field constructor.

PREVIEW ONLY. Ten-point custom armored hull (20 vertices), eight individually
pivoted wheels, four physical ground outriggers, folding dual-rail crane,
hydraulic work deck, twelve watertight asymmetrical wreck meshes.
128 independent 160px RGBA renders. No live artwork is written.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "deploy", "destroyed")

def beam(name, start, end, width, material, parent):
    a, b = Vector(start), Vector(end)
    direction = b - a
    obj = cube(name, (a + b) * .5,
               (width, width, direction.length), material, parent)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj

def fragment(name, location, size, angles, material, parent):
    perimeter = [(-.74, -.21), (-.37, -.62), (.28, -.48),
                 (.75, -.08), (.34, .58), (-.46, .42)]
    sx, sy, sz = size
    verts = [(x*sx, y*sy, -.5*sz) for x,y in perimeter]
    verts += [(x*sx, y*sy, .5*sz) for x,y in perimeter]
    faces = [tuple(range(5,-1,-1)), tuple(range(6,12))]
    faces += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    obj = wedge(name, verts, faces, material, parent)
    obj.location = location
    obj.rotation_euler = angles
    obj["closed_fracture"] = True
    obj["wreckage_only"] = True
    obj.hide_render = True
    return obj

def deployment(obj):
    obj["deployment_only"] = True
    obj.hide_render = True
    return obj

def build():
    blue = mat("MCV coalition marine-blue ballistic steel", (.20,.37,.53,1), .66)
    pale = mat("MCV pale ceramic upper armour", (.63,.79,.84,1), .48)
    dark = mat("MCV graphite engineering steel", (.045,.075,.10,1), .40)
    tire = mat("MCV nonmetallic tire rubber", (.025,.035,.041,1), .02)
    gold = mat("MCV copper hydraulic hardware", (.82,.52,.21,1), .64)
    cyan = mat("MCV illuminated construction scanner", (.13,.87,1,1), .08, 1.7)
    fracture = mat("MCV bright torn metal fracture edges", (.96,.51,.18,1), .24, .25)
    root = empty("COA-VEH-007 ORIGINAL Coalition mobile construction yard")
    chassis = empty("MCV independent rolling suspension", root)
    outline = [(1.90,-.48),(1.73,.57),(1.15,.85),(.23,.92),
               (-1.16,.81),(-1.91,.42),(-1.91,-.42),
               (-1.19,-.85),(.23,-.94),(1.18,-.83)]
    lower = [(x,y,.48) for x,y in outline]
    upper = [(x*.91,y*.88,1.23+(.13 if x < -.7 else 0))
             for x,y in outline]
    faces = [tuple(range(9,-1,-1)),tuple(range(10,20))]
    faces += [(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
    hull = wedge("MCV custom 20-vertex chamfered constructor hull",
                 lower+upper, faces, blue, chassis)
    hull["custom_hull"] = True
    cube("MCV lower service belly",(-.06,0,.47),(3.36,1.44,.30),dark,chassis)
    cube("MCV central armoured build deck",(-.33,0,1.29),(2.20,1.44,.16),pale,chassis)
    cube("MCV angled front dozer housing",(1.46,0,.78),(.70,1.36,.38),pale,chassis)
    cube("MCV front sensor eyebrow",(1.67,-.17,1.15),(.24,.66,.14),cyan,chassis)
    cube("MCV asymmetric rear power cabinet",(-1.23,.18,1.53),
         (.64,.81,.52),blue,chassis)
    cube("MCV rear exhaust grille",(-1.57,-.19,1.66),(.13,.36,.27),dark,chassis)
    wheels = []
    for side in (-1,1):
        cube("MCV eight-wheel flank skirt",(0,side*.81,.79),
             (2.85,.20,.42),blue,chassis)
        cube("MCV flank hazard stripe",(.12,side*.925,1.04),
             (1.40,.055,.09),gold,chassis)
        for x in (-1.25,-.43,.39,1.20):
            pivot = empty("MCV independently rotating roadwheel hub",
                          chassis,(x,side*.94,.34))
            wheels.append(pivot)
            cyl("MCV heavy all-terrain tire",(0,0,0),.33,.22,tire,pivot,"Y")
            cyl("MCV wheel steel hub",(0,side*.14,0),.18,.04,pale,pivot,"Y")
            for j in range(3):
                angle=j*math.tau/3
                cube("MCV radial wheel spoke",
                     (.12*math.cos(angle),side*.17,.12*math.sin(angle)),
                     (.16,.035,.046),gold,pivot)
    # Dual side rails share one articulated gantry hinge. Unlike a vertical
    # transport mast, the entire construction crane lies along the roof.
    gantry = empty("MCV independent folding twin-rail gantry hinge",
                   chassis,(-.63,0,1.47))
    for side in (-1,1):
        beam("MCV physical deployable crane rail",
             (0,side*.48,0),(0,side*.48,1.40),.16,pale,gantry)
        beam("MCV exposed rail hydraulic piston",
             (.11,side*.48,.20),(.11,side*.48,1.17),.065,gold,gantry)
        cube("MCV gantry scanning tip",(0,side*.48,1.39),
             (.22,.22,.14),cyan,gantry)
    beam("MCV open top gantry bridge",(0,-.52,1.40),
         (0,.52,1.40),.17,blue,gantry)
    cube("MCV central construction clamp",(.02,0,1.26),
         (.28,.36,.25),gold,gantry)
    # Four independently editable outriggers and real ground shoes.
    outriggers = []
    for x in (-1.18,1.02):
        for side in (-1,1):
            pivot=empty("MCV independent deployable outrigger pivot",
                        chassis,(x,side*.75,.70))
            outriggers.append(pivot)
            deployment(beam("MCV telescoping diagonal stabilizer",
                            (0,0,0),(.15,side*.93,-.43),
                            .17,gold,pivot))
            deployment(cube("MCV deployed ground shoe",
                            (.15,side*1.06,-.52),
                            (.62,.49,.18),dark,pivot))
            deployment(cube("MCV luminous outrigger pressure lock",
                            (.15,side*1.06,-.38),
                            (.25,.25,.10),cyan,pivot))
    deployment(cube("MCV elevated fabrication worktable",
                    (-.16,0,1.65),(1.65,1.17,.17),pale,chassis))
    deployment(cube("MCV active building blueprint projector",
                    (-.16,0,1.80),(.90,.58,.10),cyan,chassis))
    wreck_specs = [
        ("torn glacis", (1.27,-.65,.53),(.85,.44,.30),(.26,.20,-.41),pale),
        ("sheared front corner",(1.32,.62,.52),(.77,.43,.30),(.28,-.19,.42),blue),
        ("fallen port crane",(-.43,-.92,.66),(.91,.32,.25),(.37,.18,-.51),pale),
        ("fallen starboard crane",(-.68,.91,.62),(.90,.31,.24),(.35,-.20,.44),blue),
        ("torn crane crossbar",(-.07,-.39,.80),(.73,.34,.24),(.29,.19,-.36),gold),
        ("buckled engine hatch",(-1.24,.29,.68),(.78,.42,.26),(.31,-.19,.31),blue),
        ("fractured deck edge",(.22,-.73,.74),(.89,.32,.27),(.24,.18,-.34),fracture),
        ("collapsed fabrication clamp",(.35,.45,.80),(.64,.39,.25),(.23,-.20,.35),gold),
        ("crushed rear panel",(-1.45,-.48,.52),(.73,.42,.31),(.29,.17,-.43),pale),
        ("port axle wreck",(-.87,-.95,.31),(.65,.40,.25),(.30,.22,-.36),dark),
        ("starboard axle wreck",(.80,.95,.32),(.68,.43,.26),(.30,-.23,.42),dark),
        ("exposed orange hull tear",(.67,-.17,.78),(.76,.47,.27),(.26,.18,-.31),fracture),
    ]
    wreck = [fragment("MCV wreck "+name,loc,size,rot,material,root)
             for name,loc,size,rot,material in wreck_specs]
    return dict(root=root,chassis=chassis,hull=hull,wheels=wheels,
                gantry=gantry,outriggers=outriggers,wreck=wreck)

def pose(p,state,facing):
    assert state in STATES
    p["root"].rotation_euler.z=facing*math.tau/32
    c=p["chassis"]
    c.location.z=.065 if state=="move" else -.14 if state=="destroyed" else 0
    c.rotation_euler.y=.032 if state=="move" else -.12 if state=="destroyed" else 0
    for i,wheel in enumerate(p["wheels"]):
        wheel.rotation_euler.y=.83 if state=="move" else 0
    p["gantry"].rotation_euler.y=0 if state=="deploy" else 1.44
    for o in c.children_recursive:
        if o.type=="MESH":
            o.hide_render=bool(o.get("deployment_only")) and state!="deploy"
    for o in p["wreck"]:
        o.hide_render=state!="destroyed"
    p["hull"].hide_render=state=="destroyed"
    if state=="destroyed":
        for o in c.children_recursive:
            if o.type=="MESH" and any(s in o.name.lower() for s in (
                "crane rail","rail hydraulic","gantry scanning","gantry bridge",
                "construction clamp","front sensor","hazard stripe",
                "rear power cabinet","rear exhaust","radial wheel spoke",
                "wheel steel hub","fabrication worktable","blueprint projector")):
                o.hide_render=True
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
    source=out/"coalition-mcv.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            path=out/"frames"/state/f"{facing:02d}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 facings",flush=True)
    print("PREVIEW ONLY: 128 original RGBA frames; live art untouched",flush=True)

if __name__=="__main__":
    main()
