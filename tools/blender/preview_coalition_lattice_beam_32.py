#!/usr/bin/env python3
"""COA-VEH-006 original Coalition Lattice Beam Tank: PREVIEW ONLY.

A purpose-built sixteen-vertex hull, physical open-frame diamond emitter,
four separately hinged focusing prongs, ten roadwheels, twenty-six cleats,
and twelve closed asymmetric wreck meshes. 32 facings x four states.
Never writes production artwork, sprite manifests or gameplay files.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")


def fracture(name, loc, scale, angles, material, parent):
    """Closed nonrectangular twelve-vertex prism; every edge is manifold."""
    outline = [(-.62, -.13), (-.31, -.50), (.19, -.43),
               (.58, -.09), (.32, .42), (-.41, .38)]
    sx, sy, sz = scale
    verts = [(x*sx, y*sy, -.5*sz) for x,y in outline]
    verts += [(x*sx, y*sy, .5*sz) for x,y in outline]
    faces = [tuple(range(5,-1,-1)), tuple(range(6,12))]
    faces += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    obj = wedge(name, verts, faces, material, parent)
    obj.location = loc
    obj.rotation_euler = angles
    obj["closed_fracture"] = True
    obj["wreckage_only"] = True
    obj.hide_render = True
    return obj


def tapered_bar(name, start, end, width, material, parent):
    """Physical tapered eight-vertex quadrilateral beam, not a flat sprite."""
    ax,ay,az = start
    bx,by,bz = end
    w = width
    verts = [(ax,ay-w,az-w), (ax,ay+w,az-w),
             (ax,ay+w,az+w), (ax,ay-w,az+w),
             (bx,by-w*.63,bz-w*.63), (bx,by+w*.63,bz-w*.63),
             (bx,by+w*.63,bz+w*.63), (bx,by-w*.63,bz+w*.63)]
    faces = [(3,2,1,0),(4,5,6,7),(0,1,5,4),
             (1,2,6,5),(2,3,7,6),(3,0,4,7)]
    obj = wedge(name, verts, faces, material, parent)
    obj["custom_tapered_bar"] = True
    return obj


def build():
    navy = mat("Lattice Coalition deep cerulean titanium", (.11,.29,.47,1), .75)
    ceramic = mat("Lattice pale ceramic armor", (.67,.82,.88,1), .55)
    frame = mat("Lattice graphite precision frame", (.038,.068,.09,1), .62)
    trackmat = mat("Lattice dark indexed treads", (.035,.045,.055,1), .15)
    brass = mat("Lattice gold mechanical contact", (.69,.47,.20,1), .70)
    light = mat("Lattice restrained cyan optic", (.12,.85,1,1), .15, 1.35)
    beam = mat("Lattice concentrated beam core", (.31,.94,1,1), .12, 2.25)
    fracture_glow = mat("Lattice exposed warm fracture", (.90,.44,.16,1), .25, .32)

    root = empty("COA-VEH-006 ORIGINAL Lattice Beam Tank")
    chassis = empty("Lattice articulated tracked chassis", root)

    # 16-vertex original chamfered arrowhead hull, non-box construction.
    lower = [(1.69,-.66,.59),(1.91,-.36,.59),(1.91,.36,.59),
             (1.69,.66,.59),(-1.39,.77,.59),(-1.72,.47,.59),
             (-1.72,-.47,.59),(-1.39,-.77,.59)]
    upper = [(1.27,-.58,1.37),(1.54,-.30,1.11),(1.54,.30,1.11),
             (1.27,.58,1.37),(-1.25,.63,1.40),(-1.45,.37,1.31),
             (-1.45,-.37,1.31),(-1.25,-.63,1.40)]
    faces = [tuple(range(7,-1,-1)),tuple(range(8,16))]
    faces += [(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
    hull = wedge("Lattice ORIGINAL 16-vertex arrowhead hull",
                 lower+upper, faces, navy, chassis)
    hull["custom_hull"] = True
    cube("Lattice recessed undercarriage", (0,0,.46),(3.21,1.49,.30),frame,chassis)
    cube("Lattice rear power transfer deck", (-1.15,0,1.50),
         (.74,1.19,.26),ceramic,chassis)
    for side in (-1,1):
        cube("Lattice long faceted side skirt",(-.04,side*.90,.98),
             (3.13,.19,.37),ceramic,chassis)
        cube("Lattice inset navy skirt rail",(.06,side*1.01,1.03),
             (2.42,.055,.09),navy,chassis)
        for i in range(4):
            cube("Lattice individual radiator slot",
                 (-1.39+i*.23,side*.60,1.68),
                 (.10,.13,.055),frame,chassis)
        cube("Lattice front rangefinder crystal",
             (1.49,side*.29,.94),(.14,.20,.13),light,chassis)
        cube("Lattice rear angled skirt heel",
             (-1.48,side*.94,.78),(.39,.28,.27),navy,chassis)

    wheels = []
    cleats = []
    for side in (-1,1):
        track = empty("Lattice separate track assembly",root,(0,side*1.03,0))
        cube("Lattice physical track core",(0,0,.47),
             (3.49,.40,.64),trackmat,track)
        for x in (-1.34,-.67,0,.67,1.34):
            wheel = empty("Lattice independent roadwheel pivot",
                          track,(x,side*.19,.43))
            wheels.append(wheel)
            cyl("Lattice toothed wheel rim",(0,0,0),.31,.17,frame,wheel,"Y")
            cyl("Lattice five-spoke wheel hub",
                (0,-side*.10,0),.14,.05,ceramic,wheel,"Y")
            for angle in (0,math.tau/5,2*math.tau/5,
                          3*math.tau/5,4*math.tau/5):
                cube("Lattice individual wheel spoke",
                     (.10*math.cos(angle),-side*.14,.10*math.sin(angle)),
                     (.12,.024,.035),brass,wheel)
        for i in range(13):
            x=-1.57+i*.262
            cleat = cube("Lattice indexed independent track cleat",
                         (x,side*.24,.20),(.18,.12,.13),trackmat,track)
            cleat["track_link"] = True
            cleat["link_index"] = i
            cleats.append(cleat)

    turret = empty("Lattice independent traversing emitter turret",
                   chassis,(-.05,0,1.45))
    cyl("Lattice broad traverse bearing",(0,0,.08),.66,.18,frame,turret,"Z")
    # The turret is a narrow, genuinely open-frame energy instrument.
    crown_bottom = [(-.70,-.49,.18),(.50,-.51,.18),(.77,-.24,.18),
                    (.77,.24,.18),(.50,.51,.18),(-.70,.49,.18)]
    crown_top = [(-.53,-.39,.65),(.39,-.42,.65),(.66,-.19,.56),
                 (.66,.19,.56),(.39,.42,.65),(-.53,.39,.65)]
    tf = [tuple(range(5,-1,-1)),tuple(range(6,12))]
    tf += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    crown = wedge("Lattice custom 12-vertex emitter saddle",
                  crown_bottom+crown_top,tf,ceramic,turret)
    crown["custom_turret"] = True
    cube("Lattice left offset optics module",
         (-.28,-.42,.78),(.43,.28,.26),navy,turret)
    cube("Lattice transverse heat sink",
         (-.57,0,.72),(.31,.85,.16),brass,turret)
    for side in (-1,1):
        cube("Lattice shoulder coolant fin",
             (-.26,side*.54,.49),(.83,.13,.24),navy,turret)

    emitter = empty("Lattice articulated open-beam carriage",
                    turret,(.51,0,.48))
    cube("Lattice beam source breech",(.17,0,0),
         (.62,.47,.34),frame,emitter)
    cyl("Lattice central waveguide",(1.05,0,0),.13,1.50,
        brass,emitter,"X")
    cyl("Lattice front hollow optical collar",(1.79,0,0),
        .22,.16,ceramic,emitter,"X")
    cyl("Lattice emitter inner cyan aperture",(1.89,0,0),
        .12,.04,light,emitter,"X")

    # Three separate physical diamond cages with open centers.
    cages=[]
    for i,x in enumerate((.69,1.14,1.58)):
        cage=empty("Lattice independent open diamond focusing cage",
                   emitter,(x,0,0))
        cages.append(cage)
        corners=[(0,-.35,0),(0,0,.31),(0,.35,0),(0,0,-.31)]
        for j in range(4):
            a,b=corners[j],corners[(j+1)%4]
            tapered_bar("Lattice open diamond cage edge",
                        a,b,.055,ceramic,cage)
        cube("Lattice cage mechanical clamp",
             (0,-.38,0),(.14,.12,.15),brass,cage)

    prongs=[]
    for side in (-1,1):
        for height in (-1,1):
            pivot=empty("Lattice independently hinged focusing prong",
                        emitter,(.55,side*.26,height*.23))
            prongs.append((pivot,side,height))
            tapered_bar("Lattice physical prong spar",
                        (0,0,0),(1.17,side*.11,height*.13),
                        .11,navy,pivot)
            tapered_bar("Lattice inset cyan diffraction blade",
                        (.34,side*.04,height*.04),
                        (1.25,side*.12,height*.16),.043,light,pivot)
            cube("Lattice prong beveled ceramic tip",
                 (1.25,side*.12,height*.16),
                 (.25,.18,.16),ceramic,pivot)

    # Physically separate forward pulse geometry, hidden outside attack.
    effects=[]
    for i,(x,length,width) in enumerate(((2.12,.44,.16),
                                          (2.43,.39,.12),
                                          (2.71,.30,.08))):
        obj=tapered_bar("Lattice attack-only stepped coherent beam",
                        (x,0,0),(x+length,0,0),width,beam,emitter)
        obj["attack_only"]=True
        obj.hide_render=True
        effects.append(obj)
    for side in (-1,1):
        arc=tapered_bar("Lattice attack-only fork arc",
                        (1.80,side*.24,.04),
                        (2.17,side*.05,.02),.055,light,emitter)
        arc["attack_only"]=True
        arc.hide_render=True
        effects.append(arc)

    wreck=[]
    pieces=[
        ("sheared arrowhead glacis",(1.46,-.47,.77),(.86,.50,.36),(.31,.22,-.35),navy),
        ("detached pale nose shield",(1.50,.44,.63),(.74,.43,.29),(.27,-.30,.42),ceramic),
        ("left ruptured side skirt",(-.47,-1.03,.70),(1.12,.27,.27),(.28,.17,-.41),ceramic),
        ("right broken skirt heel",(-1.16,1.00,.63),(.87,.29,.25),(.24,-.25,.46),navy),
        ("collapsed emitter saddle",(-.10,-.35,1.08),(.89,.56,.29),(.40,.18,.25),ceramic),
        ("snapped waveguide",(1.14,-.82,.82),(.94,.22,.23),(.23,-.34,-.47),brass),
        ("fractured left prong",(1.23,.81,.73),(.78,.20,.18),(.31,.25,.47),navy),
        ("fractured right prong",(.49,1.08,.66),(.71,.22,.19),(.28,-.29,.38),ceramic),
        ("twisted first cage",(-.42,.82,.94),(.54,.32,.25),(.42,.19,-.32),brass),
        ("broken final cage",(1.32,.08,.94),(.55,.41,.27),(.22,-.31,.33),navy),
        ("exposed reactor fracture",(-.43,-.12,1.02),(.73,.54,.20),(.14,.21,-.26),fracture_glow),
        ("rear snapped heat sink",(-1.32,.30,.78),(.59,.36,.22),(.29,.33,.31),frame),
    ]
    for label,loc,scale,angles,material in pieces:
        wreck.append(fracture("Lattice wreck "+label,
                              loc,scale,angles,material,root))
    return (root,chassis,hull,turret,emitter,wheels,cleats,
            cages,prongs,effects,wreck)


def pose(parts,state,facing):
    (root,chassis,hull,turret,emitter,wheels,cleats,
     cages,prongs,effects,wreck)=parts
    root.rotation_euler.z=facing*math.tau/32
    chassis.location.z=.065 if state=="move" else -.10 if state=="destroyed" else 0
    chassis.rotation_euler.y=.035 if state=="move" else -.12 if state=="destroyed" else 0
    turret.rotation_euler.z=-.13 if state=="attack" else .045 if state=="move" else 0
    emitter.location.x=.72 if state=="attack" else .51
    emitter.rotation_euler.y=-.08 if state=="attack" else 0
    for wheel in wheels:
        wheel.rotation_euler.y=.72 if state=="move" else 0
    for i,cleat in enumerate(cleats):
        cleat.location.x=(-1.57+(i%13)*.262)+(
            .10 if state=="move" and i%2==0 else 0)
    for i,cage in enumerate(cages):
        cage.rotation_euler.x=(.18 if i%2 else -.15) if state=="attack" else 0
    for pivot,side,height in prongs:
        pivot.rotation_euler.z=side*(.32 if state=="attack" else -.045)
        pivot.rotation_euler.y=height*(.23 if state=="attack" else 0)
    for obj in chassis.children_recursive:
        if obj.type=="MESH":obj.hide_render=False
    for obj in effects:obj.hide_render=state!="attack"
    for obj in wreck:obj.hide_render=state!="destroyed"
    if state=="destroyed":
        hull.hide_render=True
        for obj in turret.children_recursive:
            if obj.type=="MESH":obj.hide_render=True
        for obj in chassis.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "long faceted side skirt","rear power transfer deck",
                "inset navy skirt rail","front rangefinder crystal",
                "individual radiator slot")):
                obj.hide_render=True
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
    source=out/"coalition-lattice-beam-tank.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            pose(parts,state,facing)
            target=out/"frames"/state/f"{facing:02d}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 facings",flush=True)
    print("PREVIEW_ONLY",source,"128 transparent RGBA frames",flush=True)


if __name__=="__main__":
    main()
