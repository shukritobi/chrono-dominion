#!/usr/bin/env python3
"""Original Psionic Spindle Cannon Tank (PSI-VEH-003), preview only.

Six real rotating barrel tubes on an independently articulated spindle, twin
splayed hover outriggers, and physical asymmetric wreckage. Renders 32 facings
for each of idle/move/attack/destroyed; never touches live game artwork.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")
FACINGS = 32


def ring(name, position, major, minor, material, parent, damage=False):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=24, minor_segments=8,
        location=position, major_radius=major, minor_radius=minor
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.y = math.pi / 2  # torus axis points along the cannon
    obj.parent = parent
    obj.data.materials.append(material)
    obj["wreckage_only"] = damage
    obj.hide_render = damage
    return obj


def build():
    ceramic = mat("Spindle midnight ceramic", (.075, .043, .135, 1), .46)
    violet = mat("Spindle lavender armored facets", (.35, .17, .49, 1), .55)
    bone = mat("Spindle pale metallic weapon guards", (.62, .65, .69, 1), .78)
    graphite = mat("Spindle dark graphite joints", (.035, .036, .056, 1), .30)
    cyan = mat("Spindle restrained turquoise field", (.13, .72, .76, 1), .12, 1.2)
    purple = mat("Spindle focused amethyst discharge", (.73, .28, .96, 1), .04, 1.8)
    fracture = mat("Spindle broken copper crystal", (.79, .37, .26, 1), .24, .35)

    root = empty("Psionic Spindle Cannon Tank - 32 facing original")
    hover = empty("Spindle independent floating hull", root)
    cube("Spindle suspended armored keel", (-.19, 0, .75),
         (2.52, 1.34, .46), ceramic, hover)
    cube("Spindle ventral gravitic ballast", (-.29, 0, .47),
         (1.74, .62, .23), graphite, hover)
    wedge("Spindle faceted split-front prow", [
        (.50,-.59,.56),(1.43,-.34,.56),(1.43,.34,.56),(.50,.59,.56),
        (.41,-.57,1.03),(1.12,-.27,.93),(1.12,.27,.93),(.41,.57,1.03)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        violet, hover)
    cube("Spindle rear engine casing", (-1.14, 0, .92),
         (.57, 1.02, .42), violet, hover)
    cube("Spindle split dorsal carapace", (-.45, 0, 1.14),
         (1.35, .94, .18), bone, hover)
    skids = []
    for side in (-1, 1):
        skid = empty("Spindle articulated lateral gravity outrigger",
                     hover, (-.19, side*.81, .61))
        skids.append(skid)
        cube("Spindle tapered hover outrigger", (-.08, side*.12, .01),
             (2.37, .34, .28), violet, skid)
        cube("Spindle exposed side levitation seam", (-.23, side*.15, -.18),
             (1.56, .18, .09), cyan, skid)
        for x in (-.75, .04, .78):
            cyl("Spindle triple field pad", (x, side*.17, -.24),
                .14, .11, graphite, skid, "Z")
        wedge("Spindle splayed side blade", [
            (-.88,-.13,.13),(.72,-.13,.13),(.72,.13,.13),(-.88,.13,.13),
            (-1.05,-.12,.40),(.22,-.12,.24),(.22,.12,.24),(-1.05,.12,.40)],
            [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
            ceramic, skid)
        cube("Spindle sharp forward field stabilizer",
             (.99, side*.13, .16), (.40, .14, .16), bone, skid)
    turret = empty("Spindle traversing cannon pedestal", hover, (-.17,0,1.16))
    cyl("Spindle heavy rotary bearing", (0,0,.10), .53,.22, graphite,turret,"Z")
    cube("Spindle low hexagonal gun receiver", (.20,0,.37),
         (1.14,.92,.49), ceramic,turret)
    cube("Spindle rear armored loading magazine", (-.41,0,.48),
         (.58,.69,.59), violet,turret)
    cube("Spindle exposed dorsal sight", (-.27,0,.85),
         (.38,.28,.27), bone,turret)
    cube("Spindle slim sensor visor", (.63,0,.53),
         (.09,.62,.13), cyan,turret)

    spindle = empty("Spindle independently rotating six-barrel drum",
                    turret, (.32,0,.46))
    cyl("Spindle central carbon rotary shaft", (.53,0,0),
        .22,1.51,graphite,spindle,"X")
    ring("Spindle front six-bore retaining collar", (1.12,0,0),
         .37,.085,bone,spindle)
    ring("Spindle rear six-bore retaining collar", (.11,0,0),
         .36,.085,violet,spindle)
    barrels = []
    for index in range(6):
        angle = index*math.tau/6
        y,z = .30*math.cos(angle), .30*math.sin(angle)
        tube = cyl("Spindle independent rifled barrel", (.76,y,z),
                   .088,1.36,bone,spindle,"X")
        tube["barrel_index"] = index
        barrels.append(tube)
        cyl("Spindle dark muzzle bore", (1.47,y,z),
            .057,.065,graphite,spindle,"X")
        cube("Spindle exposed barrel heat rib", (.45,y,z),
             (.15,.17,.17),violet,spindle)
    for index in range(3):
        angle = index*math.tau/3
        y,z = .49*math.cos(angle), .49*math.sin(angle)
        cube("Spindle triangular gun cage spar", (.22,y,z),
             (.74,.10,.12),bone,turret)

    flash = cube("Spindle attack-only forward discharge", (1.95,0,0),
                 (.62,.48,.45),purple,spindle)
    flash.hide_render = True
    shock = ring("Spindle attack-only radial pressure wave", (1.63,0,0),
                 .47,.085,cyan,spindle)
    shock.hide_render = True
    spear = cube("Spindle attack-only focused pulse core", (2.16,0,0),
                 (.51,.19,.18),cyan,spindle)
    spear.hide_render = True

    wreck_specs = [
        ("sheared front gun drum", (1.00,-.67,1.02),(1.03,.38,.37),(.27,.51,-.43),bone),
        ("detached outer barrel A", (1.61,-.93,.76),(1.21,.13,.13),(.18,.47,-.51),bone),
        ("detached outer barrel B", (1.14,.86,.91),(.96,.13,.13),(-.32,.39,.37),bone),
        ("fractured cannon collar", (.30,-.73,1.40),(.63,.34,.17),(.37,-.27,-.41),violet),
        ("collapsed loading magazine", (-.76,.49,1.23),(.77,.44,.38),(.32,.41,.20),ceramic),
        ("torn left hover wing", (-.69,-1.05,.72),(1.19,.31,.20),(.28,-.21,.42),violet),
        ("torn right hover wing", (.47,1.08,.58),(1.02,.27,.23),(-.24,.39,-.32),ceramic),
        ("exposed rear reactor fracture", (-1.11,-.19,1.14),(.46,.49,.32),(.22,.28,-.19),fracture),
        ("split front prow", (1.20,.16,.73),(.71,.54,.23),(.23,-.35,.26),bone),
        ("fallen sensor visor", (-.27,-.92,1.43),(.49,.13,.18),(.41,.20,-.52),cyan),
        ("twisted upper gun spar", (.18,.81,1.48),(.81,.12,.15),(-.34,.48,.36),bone),
        ("broken spindle axle", (.70,-.25,.57),(.92,.22,.21),(.28,-.29,.31),graphite),
    ]
    wreck = []
    for label, loc, dim, rot, material in wreck_specs:
        obj = cube("Spindle wreckage "+label,loc,dim,material,root,True)
        obj.rotation_euler = rot
        obj["fracture_role"] = label
        wreck.append(obj)
    return root,hover,skids,turret,spindle,barrels,(flash,shock,spear),wreck


def apply_pose(parts,state,facing):
    root,hover,skids,turret,spindle,barrels,effects,wreck=parts
    root.rotation_euler = (0,0,facing*math.tau/FACINGS)
    hover.location.z = .17 if state=="move" else -.13 if state=="destroyed" else 0
    hover.rotation_euler = (0,-.065 if state=="move" else .13 if state=="destroyed" else 0,0)
    for i,skid in enumerate(skids):
        sign = -1 if i==0 else 1
        skid.rotation_euler = (sign*(.20 if state=="move" else -.15 if state=="destroyed" else 0),
                               sign*(.08 if state=="move" else 0),0)
    turret.rotation_euler.z = -.10 if state=="attack" else .04 if state=="move" else 0
    spindle.rotation_euler.x = .47 if state=="attack" else .18 if state=="move" else 0
    spindle.location.x = .22 if state=="attack" else .32
    for obj in hover.children_recursive:
        if obj.type=="MESH":
            obj.hide_render = False
    for obj in effects:
        obj.hide_render = state!="attack"
    for obj in wreck:
        obj.hide_render = state!="destroyed"
    if state=="destroyed":
        for obj in hover.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "six-barrel", "rifled barrel", "muzzle bore", "barrel heat rib",
                "rotary shaft", "gun receiver", "loading magazine",
                "sensor visor", "dorsal sight", "split dorsal carapace",
                "tapered hover outrigger", "splayed side blade",
                "gun cage spar", "retaining collar")):
                obj.hide_render = True
    bpy.context.view_layer.update()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    output=args.output.resolve()
    output.mkdir(parents=True,exist_ok=True)
    scene=scene_setup()
    parts=build()
    apply_pose(parts,"idle",0)
    saved=output/"psionic-spindle-cannon-tank.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(saved),compress=True)
    assert saved.stat().st_size>2000
    for state in STATES:
        for facing in range(FACINGS):
            apply_pose(parts,state,facing)
            dest=output/"frames"/state/f"{facing:02d}.png"
            dest.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(dest)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,FACINGS,"facings",flush=True)
    print("PREVIEW_ONLY",saved,"128 original RGBA sprites",flush=True)


if __name__=="__main__":
    main()
