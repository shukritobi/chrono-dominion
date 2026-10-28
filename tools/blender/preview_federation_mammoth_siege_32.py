#!/usr/bin/env python3
"""FED-VEH-006 original Federation Mammoth Siege Tank.
Preview ONLY: 32 facings x idle/move/attack/destroyed, editable source, no live assets.
All geometry is authored here as real Blender meshes, not borrowed game sprites.
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


def faceted_shard(name, location, size, rotation, material, parent):
    """Twelve-vertex closed irregular extrusion with deliberately unequal facets."""
    outline = [(-.58, -.19), (-.32, -.51), (.26, -.46),
               (.61, -.07), (.13, .51), (-.45, .32)]
    sx, sy, sz = size
    vertices = [(x*sx, y*sy, -.5*sz) for x,y in outline]
    vertices += [(x*sx, y*sy, .5*sz) for x,y in outline]
    faces = [tuple(range(5,-1,-1)), tuple(range(6,12))]
    faces += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    o = wedge(name, vertices, faces, material, parent)
    o.location = location
    o.rotation_euler = rotation
    o["closed_fracture"] = True
    o["wreckage_only"] = True
    o.hide_render = True
    return o


def build():
    red = mat("Mammoth Federation dark scarlet armor", (.34,.105,.105,1), .78)
    upper = mat("Mammoth forged warm steel", (.52,.40,.32,1), .69)
    iron = mat("Mammoth oxidized black iron", (.048,.055,.061,1), .53)
    trackmat = mat("Mammoth hard graphite track links", (.075,.078,.085,1), .34)
    brass = mat("Mammoth precision bronze recoil collar", (.66,.39,.16,1), .65)
    ember = mat("Mammoth ember cannon chamber", (1,.32,.075,1), .14, 1.7)
    fracture = mat("Mammoth restrained hot fracture edge", (.90,.38,.14,1), .28, .23)

    root = empty("FED-VEH-006 Mammoth Siege Tank ORIGINAL")
    chassis = empty("Mammoth independent armored chassis", root)
    # Original chamfered 16-vertex upper/lower hull, sloped frontal glacis.
    low = [(1.66,-.86,.59),(1.85,-.58,.59),(1.85,.58,.59),
           (1.66,.86,.59),(-1.52,.86,.59),(-1.80,.60,.59),
           (-1.80,-.60,.59),(-1.52,-.86,.59)]
    high = [(1.30,-.72,1.43),(1.48,-.49,1.27),(1.48,.49,1.27),
            (1.30,.72,1.43),(-1.30,.72,1.41),(-1.51,.51,1.32),
            (-1.51,-.51,1.32),(-1.30,-.72,1.41)]
    faces = [tuple(range(7,-1,-1)), tuple(range(8,16))]
    faces += [(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
    hull = wedge("Mammoth ORIGINAL 16 vertex sloped forged hull", low+high,
                 faces, red, chassis)
    hull["custom_hull"] = True
    cube("Mammoth lower reinforced belly", (0,0,.47), (3.22,1.62,.35), iron, chassis)
    cube("Mammoth asymmetrical rear engine slab", (-1.17,0,1.53), (.86,1.30,.30), upper, chassis)
    for side in (-1,1):
        cube("Mammoth slotted upper track guard", (-.10,side*.97,1.02),
             (3.42,.23,.30), upper, chassis)
        cube("Mammoth front track glacis shield", (1.39,side*1.03,.90),
             (.66,.21,.48), red, chassis)
        cube("Mammoth rear exhaust louver", (-1.34,side*.79,1.64),
             (.35,.19,.33), iron, chassis)
        for i in range(3):
            cube("Mammoth separate vent gill", (-1.47+i*.14,side*.91,1.62),
                 (.055,.055,.23), brass, chassis)

    tracks = []
    wheels = []
    cleats = []
    for side in (-1,1):
        track = empty("Mammoth independent left/right continuous track",
                      root, (0,side*1.08,0))
        tracks.append(track)
        cube("Mammoth armored track belt core", (0,0,.47), (3.63,.45,.72),
             trackmat, track)
        for i,x in enumerate((-1.36,-.68,0,.68,1.36)):
            wheel = empty("Mammoth independently rotating roadwheel",
                          track, (x,side*.20,.42))
            wheels.append(wheel)
            cyl("Mammoth 22 sided sprocket", (0,0,0), .34,.18, iron,wheel,"Y")
            cyl("Mammoth machined hub", (0,-side*.105,0), .15,.04,brass,wheel,"Y")
        for i in range(14):
            x=-1.66+i*.255
            link = cube("Mammoth independently indexed track cleat",
                        (x,side*.24,.19),(.19,.12,.11),upper,track)
            link["track_link"] = True
            link["link_index"] = i
            cleats.append(link)
        for x in (-1.72,1.72):
            cube("Mammoth angled armored track end", (x,0,.51),
                 (.27,.46,.48),red,track)

    turret = empty("Mammoth independent twin-rail siege turret", chassis,(.02,0,1.47))
    cube("Mammoth turret base traverse ring", (0,0,.09),(1.65,1.47,.23),iron,turret)
    # A faceted six-point turret shell instead of a generic box.
    crown_bottom=[(-.83,-.65,.14),(.62,-.67,.14),(1.00,-.36,.14),
                  (1.00,.36,.14),(.62,.67,.14),(-.83,.65,.14)]
    crown_top=[(-.66,-.51,.80),(.48,-.54,.80),(.83,-.29,.69),
               (.83,.29,.69),(.48,.54,.80),(-.66,.51,.80)]
    tf=[tuple(range(5,-1,-1)),tuple(range(6,12))]
    tf += [(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
    crown=wedge("Mammoth 12 vertex bevelled independent turret shell",
                crown_bottom+crown_top,tf,upper,turret)
    crown["custom_turret"]=True
    cube("Mammoth commander's offset hatch",(-.40,-.25,.87),
         (.46,.44,.13),red,turret)
    cube("Mammoth protected gunner visor",(.69,0,.59),(.12,.48,.15),ember,turret)

    recoil = empty("Mammoth physically recoiling twin gun cradle",turret,(.50,0,.46))
    guns = []
    for side in (-1,1):
        gun = empty("Mammoth independent left/right siege rail",recoil,(0,side*.35,0))
        guns.append(gun)
        cube("Mammoth primary elongated rectangular rail barrel",
             (.86,0,0),(2.08,.29,.29),iron,gun)
        cube("Mammoth upper machined cannon spine",(.93,0,.19),
             (1.77,.12,.10),upper,gun)
        cube("Mammoth forward twin barrel split-tip", (1.92,0,0),
             (.29,.38,.36),red,gun)
        for x in (.32,.82,1.32):
            cube("Mammoth recoil collar", (x,0,0),(.13,.40,.39),brass,gun)
        cube("Mammoth physical inner muzzle bore", (2.09,0,0),
             (.05,.17,.17),iron,gun)

    pods=[]
    for side in (-1,1):
        pod=empty("Mammoth independent shoulder missile pod",
                  chassis,(-.80,side*.66,1.76))
        pods.append(pod)
        cube("Mammoth armored missile cassette", (0,0,.16),
             (.95,.44,.44),red,pod)
        for z in (.04,.27):
            cyl("Mammoth separate anti-air missile tube",
                (.43,0,z),.075,.54,iron,pod,"X")
        cube("Mammoth cassette bronze rear hinge",(-.42,0,.16),
             (.14,.49,.28),brass,pod)

    effects=[]
    for side,gun in zip((-1,1),guns):
        # Flash is parented to the moving gun, physically overlapping its muzzle.
        # The previous root-space flash visibly floated away during recoil.
        flash=faceted_shard("Mammoth attack-only gun-attached muzzle flash",
                           (2.24,0,0),(.42,.27,.23),
                           (.08,0,side*.22),ember,gun)
        flash["attack_only"]=True
        flash["wreckage_only"]=False
        flash["closed_fracture"]=False
        effects.append(flash)

    wreck=[]
    parts=[
      ("Mammoth wreck sheared left siege rail",(1.38,-1.06,.91),(.99,.34,.27),(.30,.32,-.49),iron),
      ("Mammoth wreck sheared right siege rail",(1.70,.81,.72),(1.04,.32,.29),(.22,-.36,.55),upper),
      ("Mammoth wreck shattered forward glacis",(1.34,-.53,.77),(.89,.53,.37),(.27,.29,-.24),red),
      ("Mammoth wreck buckled turret crown",(-.12,.40,1.17),(1.01,.68,.35),(.41,-.18,.42),upper),
      ("Mammoth wreck left track fender",(-.71,-1.15,.58),(.89,.34,.25),(.21,.27,-.57),red),
      ("Mammoth wreck right track fender",(-1.00,1.13,.57),(.91,.34,.29),(.31,-.24,.43),upper),
      ("Mammoth wreck torn missile cassette",(-1.23,-.81,1.01),(.70,.38,.35),(.48,.22,-.29),red),
      ("Mammoth wreck broken launch tube",(-.84,1.13,.84),(.66,.22,.20),(.35,-.31,.48),brass),
      ("Mammoth wreck exposed reactor split",(-.35,-.12,1.16),(.81,.62,.23),(.15,.18,-.26),fracture),
      ("Mammoth wreck broken side armor",(0.44,-1.25,.60),(.84,.30,.28),(.31,.22,.47),red),
      ("Mammoth wreck detached sighting mast",(-.40,.88,1.03),(.57,.23,.23),(.40,-.24,-.40),brass),
      ("Mammoth wreck twisted engine louver",(-1.44,.37,.77),(.67,.37,.24),(.22,.34,.26),iron),
    ]
    for name,loc,size,rotation,material in parts:
        wreck.append(faceted_shard(name,loc,size,rotation,material,root))
    return root,chassis,hull,turret,recoil,guns,pods,tracks,wheels,cleats,effects,wreck


def pose(parts,state,facing):
    root,chassis,hull,turret,recoil,guns,pods,tracks,wheels,cleats,effects,wreck=parts
    root.rotation_euler.z=facing*math.tau/32
    chassis.location.z=.065 if state=="move" else -.13 if state=="destroyed" else 0
    chassis.rotation_euler.y=.035 if state=="move" else -.17 if state=="destroyed" else 0
    turret.rotation_euler.z=-.11 if state=="attack" else -.28 if state=="destroyed" else 0
    recoil.location.x=.28 if state=="attack" else .50
    for i,wheel in enumerate(wheels):
        wheel.rotation_euler.y=(.55 if i%2 else -.55) if state=="move" else 0
    for i,link in enumerate(cleats):
        # Real track-link indexing, not just translating the whole vehicle.
        link.location.x=(-1.66+(i%14)*.255)+(.065 if state=="move" and i%2 else 0)
    for i,pod in enumerate(pods):
        pod.rotation_euler.y=.20 if state=="attack" else 0
        pod.rotation_euler.x=.08*(-1 if i==0 else 1) if state=="attack" else 0
    for o in chassis.children_recursive:
        if o.type=="MESH":o.hide_render=False
    for track in tracks:
        for o in track.children_recursive:
            if o.type=="MESH":o.hide_render=False
    for o in effects:o.hide_render=state!="attack"
    for o in wreck:o.hide_render=state!="destroyed"
    if state=="destroyed":
        hull.hide_render=True
        for o in turret.children_recursive:
            if o.type=="MESH":o.hide_render=True
        for pod in pods:
            for o in pod.children_recursive:
                if o.type=="MESH":o.hide_render=True
        for o in chassis.children_recursive:
            if o.type=="MESH" and any(t in o.name.lower() for t in
                    ("upper track guard","front track glacis shield","engine slab",
                     "rear exhaust louver","separate vent gill")):
                o.hide_render=True
        # Distinctive damaged track undercarriage remains visible beneath the wreck.
    bpy.context.view_layer.update()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup();parts=build();pose(parts,"idle",0)
    source=out/"federation-mammoth-siege.blend"
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
    print("PREVIEW_ONLY",source,"128 separate transparent RGBA frames",flush=True)

if __name__=="__main__":
    main()
