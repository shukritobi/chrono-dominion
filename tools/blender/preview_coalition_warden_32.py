#!/usr/bin/env python3
"""Coalition Autonomous Warden Tank: original editable 32-facing Blender preview.

Uncrewed split-track sentry tank with faceted sensor crown, dual ion emitters,
animated track pads, independently articulated attack gear and real wreckage.
Renders only preview frames; never modifies live sprites or manifests.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_coalition_carrier_32 import scene_setup, mat, empty, cube, cyl, wedge

STATES = ("idle", "move", "attack", "destroyed")


def build():
    navy = mat("Warden deep naval titanium", (.12, .29, .42, 1), .72)
    ceramic = mat("Warden pale faceted ceramic", (.53, .73, .80, 1), .43)
    carbon = mat("Warden black carbon machinery", (.026, .055, .078, 1), .25)
    tracks = mat("Warden graphite rubber", (.024, .031, .040, 1), .07)
    cyan = mat("Warden ion aperture cyan", (.045, .80, 1, 1), .08, 3.0)
    teal = mat("Warden radar indicator", (.17, 1, .76, 1), .07, 1.7)
    copper = mat("Warden exposed burnt copper", (.76, .34, .14, 1), .50)
    fire = mat("Warden ruptured capacitor", (1, .19, .035, 1), .10, 2.4)

    root = empty("Coalition Autonomous Warden Tank - original 32-facing source")
    hull = empty("Autonomous low profile split-track hull", root)
    cube("Central protected unmanned core", (0, 0, .68), (2.78, 1.28, .58), navy, hull)
    cube("Lower blast-resistant battery cassette", (-.30, 0, .37),
         (1.89, 1.08, .26), carbon, hull)
    wedge("Front twin-chevron sloped glacis", [
        (.58,-.64,.52), (1.68,-.46,.54), (1.68,.46,.54), (.58,.64,.52),
        (.48,-.61,1.12), (1.28,-.35,.87), (1.28,.35,.87), (.48,.61,1.12)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        ceramic, hull)
    cube("Left roof shoulder armor", (-.45,-.46,1.05), (1.48,.34,.18), ceramic, hull)
    cube("Right roof shoulder armor", (-.45,.46,1.05), (1.48,.34,.18), ceramic, hull)
    cube("Rear removable drone maintenance hatch", (-1.31,0,.98), (.32,.86,.23), navy, hull)
    for side in (-1,1):
        cube("Independent side track armored pod", (-.05,side*.79,.57),
             (3.13,.56,.83), carbon, hull)
        cube("Raised angled track skirt", (-.14,side*.99,.98),
             (2.56,.14,.23), navy, hull)
        cube("Ceramic track side identification bar", (.31,side*1.08,1.00),
             (.83,.055,.09), teal, hull)
        cube("Forward armored track nose", (1.43,side*.79,.57),
             (.36,.58,.68), ceramic, hull)
        cube("Rear track drive housing", (-1.48,side*.79,.58),
             (.29,.57,.67), navy, hull)

    pads = []
    for side in (-1,1):
        for x in (-1.19,-.89,-.59,-.29,.01,.31,.61,.91,1.21):
            pad = cube("Independently cycling track cleat", (x,side*1.105,.44),
                       (.20,.095,.39), tracks, hull)
            pads.append((pad,x))
        for x in (-1.14,1.15):
            cyl("Exposed track drive hub", (x,side*1.15,.48),
                .21,.11,ceramic,hull)
    for side in (-1,1):
        cube("Forward optical ranging slit", (1.42,side*.34,.81),
             (.12,.37,.10), cyan, hull)
        cube("Rear ventilation heat sink", (-1.29,side*.40,1.13),
             (.48,.19,.13), carbon, hull)

    crown = empty("Gyrostabilised faceted autonomous targeting crown", hull,
                  (-.08,0,1.10))
    cyl("Crown rotating bearing", (0,0,.07), .55,.17,carbon,crown,"Z")
    cube("Angular low-profile sensor crown", (.08,0,.37),
         (1.04,.96,.45),navy,crown)
    wedge("Sloped armored rangefinder face", [
        (.49,-.47,.22),(.76,-.35,.22),(.76,.35,.22),(.49,.47,.22),
        (.40,-.42,.66),(.66,-.30,.49),(.66,.30,.49),(.40,.42,.66)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        ceramic,crown)
    cube("Wide autonomous panoramic sensor", (.69,0,.40),
         (.09,.58,.16),cyan,crown)
    for side in (-1,1):
        cube("Ion cannon articulated receiver", (.43,side*.50,.25),
             (.79,.29,.28),ceramic,crown)
        cyl("Independent ion accelerator barrel", (1.02,side*.50,.26),
            .11,.91,carbon,crown,"X")
        cyl("Glowing muzzle capacitor", (1.50,side*.50,.26),
            .16,.20,cyan,crown,"X")
        cube("Ceramic barrel cooling fin", (1.02,side*.50,.45),
             (.42,.22,.08),navy,crown)
    cyl("Rear sensor uplink antenna", (-.37,.26,.90),
        .045,.53,ceramic,crown,"Z")
    cube("Antenna transponder beacon", (-.37,.26,1.20),
         (.15,.16,.17),teal,crown)
    flare = cube("Attack-only coherent ion bolt", (1.96,-.50,.27),
                 (.76,.20,.21),cyan,crown)
    flare.hide_render = True
    flare2 = cube("Attack-only ion muzzle discharge", (1.81,.50,.27),
                  (.39,.31,.32),teal,crown)
    flare2.hide_render = True

    wreck = [
        cube("Wreckage sheared sensor crown", (.42,-.67,1.39),
             (1.02,.80,.34),navy,root,True),
        cube("Wreckage fallen port ion barrel", (1.26,-.91,1.14),
             (1.20,.22,.25),carbon,root,True),
        cube("Wreckage starboard cannon receiver", (-.52,.85,1.22),
             (.89,.33,.29),ceramic,root,True),
        cube("Wreckage torn upper roof plate", (-.37,-.47,1.38),
             (1.33,.43,.19),ceramic,root,True),
        cube("Wreckage exposed orange battery fracture", (.66,-.12,1.11),
             (.34,.45,.37),fire,root,True),
        cube("Wreckage raised ruptured left track guard", (-.31,-1.02,1.14),
             (1.42,.21,.29),copper,root,True),
        cube("Wreckage detached rear track module", (-1.32,.94,.79),
             (.67,.43,.51),navy,root,True),
        cube("Wreckage antenna snapped against roof", (-.89,.20,1.42),
             (.15,.14,.72),copper,root,True),
    ]
    for part,angles in zip(wreck, (
        (.21,.34,-.45),(.24,-.42,-.27),(.31,.24,.42),(.43,-.25,.29),
        (.16,.26,-.19),(.22,-.32,-.31),(.13,.38,.40),(.52,-.28,.18))):
        part.rotation_euler = angles
    return root,hull,crown,pads,flare,flare2,wreck


def apply_pose(parts,state,facing):
    root,hull,crown,pads,flare,flare2,wreck = parts
    root.rotation_euler = (0,0,facing*math.tau/32)
    hull.location.z = .085 if state=="move" else -.095 if state=="destroyed" else 0
    hull.rotation_euler = (0,.04 if state=="move" else .13 if state=="destroyed" else 0,0)
    crown.rotation_euler.z = .19 if state=="attack" else -.10 if state=="move" else 0
    crown.rotation_euler.y = -.12 if state=="attack" else .17 if state=="destroyed" else 0
    for pad,x in pads:
        pad.location.x = x + (.11 if state=="move" else 0)
    for obj in hull.children_recursive:
        if obj.type=="MESH":
            obj.hide_render=False
    flare.hide_render=state!="attack"
    flare2.hide_render=state!="attack"
    for obj in wreck:
        obj.hide_render=state!="destroyed"
    if state=="destroyed":
        for obj in hull.children_recursive:
            if obj.type=="MESH" and any(token in obj.name.lower() for token in (
                "sensor crown","ion cannon","ion accelerator","muzzle capacitor",
                "barrel cooling","antenna","transponder beacon",
                "panoramic sensor","rangefinder face","roof shoulder armor")):
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
    apply_pose(parts,"idle",0)
    source=out/"coalition-autonomous-warden-tank.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    assert source.stat().st_size>2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts,state,facing)
            path=out/"frames"/state/f"{facing:02d}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            scene.render.filepath=str(path)
            bpy.ops.render.render(write_still=True)
        print("RENDERED",state,"32 original facings",flush=True)
    print("PREVIEW_ONLY",source,"128 RGBA frames",flush=True)


if __name__=="__main__":
    main()
