#!/usr/bin/env python3
"""Original Psionic Phase-Loom hover carrier: editable 32-facing Blender preview.

Four states, 128 independent RGBA renders. Uses only the shared modeling
primitives from the already-reviewed Coalition preview; never touches game art.
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
    violet = mat("Psionic ceramic violet armour", (.29, .14, .46, 1), .42)
    lilac = mat("Iridescent lavender edge plates", (.64, .40, .82, 1), .58)
    graphite = mat("Graphite levitation machinery", (.045, .038, .075, 1), .28)
    mint = mat("Mint phase field", (.08, 1.0, .66, 1), .12, 2.8)
    cyan = mat("Cyan focus lattice", (.13, .77, 1.0, 1), .18, 2.3)
    fracture = mat("Exposed golden fractured crystal", (1.0, .43, .18, 1), .24, .45)
    root = empty("Psionic Phase-Loom Hover Carrier - 32 original facings")
    hover = empty("Animated antigravity suspension", root)

    # A genuine forked floating craft, not a recoloured tank or wheeled carrier.
    wedge("Tapered central levitating keel", [
        (-1.55,-.67,.62), (1.04,-.53,.62), (1.04,.53,.62), (-1.55,.67,.62),
        (-1.40,-.56,1.08), (.56,-.42,1.24), (.56,.42,1.24), (-1.40,.56,1.08)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
        violet, hover)
    cube("Armoured rear gravity engine", (-1.18,0,1.12), (.83,1.20,.54), lilac, hover)
    cube("Recessed black central channel", (.65,0,1.08), (1.45,.58,.13), graphite, hover)
    cube("Inner glowing focus rail", (.72,0,1.19), (1.30,.12,.12), mint, hover)
    prongs = []
    fins = []
    for side in (-1,1):
        # Open physical gap between these forward horns is visible from above.
        prong = empty("Independent forward phase horn", hover, (.60,side*.67,1.05))
        cube("Forked crescent structural prong", (.53,side*.14,0), (1.65,.37,.38), violet, prong)
        cube("Prong exposed luminous inner edge", (.55,-side*.10,.22),
             (1.31,.095,.09), mint, prong)
        cube("Forward fork crystal cap", (1.33,side*.09,.13), (.28,.40,.28), lilac, prong)
        prongs.append(prong)
        fin = empty("Articulated lateral gravitic wing", hover, (-.39,side*.93,1.18))
        cube("Swept psionic field wing", (-.24,side*.19,.08), (1.28,.52,.19), lilac, fin)
        cube("Wing field conduit", (-.27,side*.23,.23), (.98,.10,.12), cyan, fin)
        cyl("Wing gravitic emitter", (-.73,side*.32,.17), .26, .17, mint, fin, "Z")
        fins.append(fin)
        cyl("Suspended outer levitation ring", (-.60,side*.76,.42), .36, .11,
            graphite, hover, "Z")
        cyl("Lower antigravity coil", (-.60,side*.76,.32), .22, .08,
            cyan, hover, "Z")
        cube("Lower lift strut", (.52,side*.51,.55), (.70,.14,.17), graphite, hover)
    # Distinct exposed floating crystal reactor, independent of both horns.
    core = empty("Animated suspended central phase spindle", hover, (-.13,0,1.35))
    cyl("Open reactor collar", (0,0,.04), .48, .18, graphite, core, "Z")
    cyl("Concentric glowing reactor ring", (0,0,.19), .39, .09, mint, core, "Z")
    wedge("Six-faced suspended energy prism", [
        (-.25,-.20,.30),(.25,-.20,.30),(.25,.20,.30),(-.25,.20,.30),
        (0,-.16,1.12),(.12,0,1.16),(0,.16,1.12),(-.12,0,1.16)],
        [(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],
        lilac, core)
    cyl("Crystal crown focusing lens", (0,0,1.18), .20, .11, cyan, core, "Z")
    for y in (-.37,.37):
        cube("Reactor shielding blade", (-.08,y,.49), (.18,.11,.76), violet, core)
    # Attack-only projected beam and charged flare, not present in saved idle source.
    beam = cube("Attack-only extended phase lance", (1.81,0,1.19),
                (1.25,.19,.18), mint, hover)
    beam.hide_render = True
    flare = cube("Attack-only terminal crystal flare", (2.43,0,1.19),
                 (.27,.43,.39), cyan, hover)
    flare.hide_render = True
    wreck = [
        cube("Wreckage broken port horn", (.92,-1.00,1.28),
             (1.05,.35,.29), violet, root, True),
        cube("Wreckage broken starboard horn", (.65,.94,1.52),
             (1.12,.32,.31), lilac, root, True),
        cube("Wreckage snapped crystal crown", (-.18,-.45,1.93),
             (.35,.36,.61), fracture, root, True),
        cube("Wreckage torn reactor housing", (-.46,.32,1.39),
             (.81,.43,.27), graphite, root, True),
        cube("Wreckage exposed orange keel fracture", (1.02,-.37,1.12),
             (.24,.28,.77), fracture, root, True),
        cube("Wreckage collapsed port field wing", (-1.02,-1.17,1.13),
             (1.00,.31,.19), lilac, root, True),
        cube("Wreckage collapsed starboard field wing", (-1.12,1.03,1.24),
             (.93,.30,.18), violet, root, True),
    ]
    for obj, angles in zip(wreck, (
        (.21,.36,-.48),(.35,-.21,.51),(.42,.30,.25),(.20,-.35,.24),
        (.28,.41,-.26),(.28,.17,-.43),(-.22,.29,.45))):
        obj.rotation_euler = angles
    return root, hover, fins, prongs, core, beam, flare, wreck


def apply_pose(parts, state, facing):
    root, hover, fins, prongs, core, beam, flare, wreck = parts
    root.rotation_euler = (0, 0, facing * math.tau / 32)
    hover.location.z = .15 if state == "move" else -.13 if state == "destroyed" else 0
    hover.rotation_euler = (0, -.095 if state == "move" else
                            .18 if state == "destroyed" else 0, 0)
    core.location.z = .20 if state == "attack" else .08 if state == "move" else 0
    core.rotation_euler.z = .20 if state == "move" else -.35 if state == "attack" else 0
    for side, fin in zip((-1,1), fins):
        fin.rotation_euler.z = side * (.26 if state == "attack" else
                                      -.09 if state == "move" else 0)
    for side, prong in zip((-1,1), prongs):
        prong.rotation_euler.z = side * (.09 if state == "attack" else 0)
    for obj in hover.children_recursive:
        if obj.type == "MESH":
            obj.hide_render = False
    beam.hide_render = state != "attack"
    flare.hide_render = state != "attack"
    for obj in wreck:
        obj.hide_render = state != "destroyed"
    if state == "destroyed":
        # Remove signature intact equipment; broken parts are independent meshes.
        for obj in hover.children_recursive:
            if obj.type == "MESH" and any(token in obj.name.lower() for token in (
                    "structural prong", "crystal cap", "inner edge", "energy prism",
                    "crystal crown", "field wing", "wing field conduit",
                    "reactor shielding blade", "reactor ring")):
                obj.hide_render = True
    bpy.context.view_layer.update()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = scene_setup()
    parts = build()
    apply_pose(parts, "idle", 0)
    source = out / "psionic-phase-loom-hover-carrier.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000
    for state in STATES:
        for facing in range(32):
            apply_pose(parts, state, facing)
            target = out / "frames" / state / f"{facing:02d}.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED", state, "32 original facings", flush=True)
    print("PREVIEW_ONLY", source, "128 transparent RGBA frames", flush=True)


if __name__ == "__main__":
    main()
