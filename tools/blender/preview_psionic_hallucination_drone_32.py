#!/usr/bin/env python3
"""PSI-VEH-004 original Psionic Hallucination Drone, 32 facings, preview only.

A hovering six-petal phase projector with a separate neural core, moving
iris fins, physical attack geometry and independently editable wreckage.
Produces 128 isolated 160px RGBA PNGs and a saved editable Blender source.
No production atlas, runtime asset or game manifest is written.
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


def tapered(name, start, end, width, material, parent):
    """Independent volumetric tapered beam, not a flat sprite plane."""
    from mathutils import Vector
    a, b = Vector(start), Vector(end)
    v = b - a
    obj = cube(name, tuple((a + b) / 2), (width, v.length, width * .70),
               material, parent)
    obj.rotation_euler = v.to_track_quat("Y", "Z").to_euler()
    return obj


def build():
    obsidian = mat("Hallucination smoked violet ceramic", (.115, .060, .205, 1), .52)
    violet = mat("Hallucination amethyst outer petals", (.39, .19, .65, 1), .42)
    silver = mat("Hallucination satin lavender alloy", (.58, .51, .72, 1), .64)
    dark = mat("Hallucination shadow phase joints", (.025, .035, .075, 1), .18)
    mint = mat("Hallucination charged mint lens", (.17, .98, .73, 1), .12, 2.1)
    cyan = mat("Hallucination spectral corona", (.23, .75, 1, 1), .05, 2.5)
    fracture = mat("Hallucination reactor fracture", (.97, .38, .79, 1), .08, 2.1)

    root = empty("Psionic Hallucination Drone - original 32 facing source")
    hover = empty("Floating phase lens chassis", root)
    core = empty("Independent oscillating neural iris", hover, (.08, 0, 1.23))
    cyl("Low sixfold phase projector housing", (0, 0, 1.08), .87, .28,
        obsidian, hover, "Z")
    cyl("Raised amethyst perimeter ring", (0, 0, 1.24), .70, .13,
        violet, hover, "Z")
    cyl("Recessed central shadow aperture", (0, 0, 1.32), .51, .055,
        dark, hover, "Z")
    cyl("Floating neural core crystal", (0, 0, .23), .30, .44,
        mint, core, "Z")
    cyl("Sixfold crystal crown", (0, 0, .48), .38, .09,
        silver, core, "Z")
    for side in (-1, 1):
        tapered("Split forward psychic needle %s" % side,
                (.35, side * .22, 1.16), (1.42, side * .40, 1.05),
                .15, silver, hover)
        cube("Forward focus tip %s" % side,
             (1.43, side * .40, 1.05), (.25, .15, .14), mint, hover)
        cube("Paired asymmetric side intake %s" % side,
             (-.45, side * .77, 1.07), (.54, .18, .26), obsidian, hover)
    fins = []
    for index in range(6):
        theta = index * math.tau / 6
        rig = empty("Independent phase petal %02d" % index, hover,
                    (.61 * math.cos(theta), .61 * math.sin(theta), 1.17))
        rig.rotation_euler.z = theta
        wedge("Faceted folding psychic petal %02d" % index, [
            (-.14, -.24, -.12), (.81, -.16, -.09),
            (.89, .14, -.08), (-.14, .24, -.12),
            (-.04, -.13, .12), (.63, -.10, .22),
            (.67, .10, .21), (-.04, .13, .12)],
            [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)],
            violet, rig)
        cube("Petal illuminated fracture vein %02d" % index,
             (.43, 0, .16), (.46, .055, .075), mint, rig)
        cube("Petal inner hydraulic spine %02d" % index,
             (.12, 0, -.12), (.35, .14, .13), silver, rig)
        fins.append(rig)

    # Physical attack-only emitter geometry; no post-render overlays.
    attack = []
    for index in range(3):
        angle = index * math.tau / 3
        obj = cyl("Attack-only rotating focus torus surrogate %02d" % index,
                  (1.30 + index * .18, 0, 1.30),
                  .20 + index * .075, .045, cyan, hover, "X")
        obj.rotation_euler.x = angle
        obj.hide_render = True
        attack.append(obj)
    for side in (-1, 1):
        obj = tapered("Attack-only separated spectral filament %s" % side,
                      (1.34, side * .18, 1.21),
                      (1.95, side * .31, 1.30), .10, mint, hover)
        obj.hide_render = True
        attack.append(obj)

    wreck = [
        cube("Wreckage fractured left iris petal", (-.62, -.86, .52),
             (.93, .44, .22), violet, root, True),
        cube("Wreckage fractured right iris petal", (.71, .83, .48),
             (.85, .42, .23), violet, root, True),
        cube("Wreckage collapsed hexagonal housing", (-.15, .10, .63),
             (1.17, 1.01, .28), obsidian, root, True),
        cube("Wreckage exposed neural lens", (.35, -.29, .79),
             (.49, .46, .32), fracture, root, True),
        cube("Wreckage sheared psychic needle", (1.04, -.69, .46),
             (.89, .16, .14), silver, root, True),
        cube("Wreckage second sheared psychic needle", (1.00, .56, .42),
             (.75, .16, .14), silver, root, True),
        cube("Wreckage split projector arm", (-1.01, -.20, .43),
             (.64, .25, .19), violet, root, True),
        cube("Wreckage shattered lens facet", (-.43, .66, .68),
             (.34, .30, .26), mint, root, True),
        cube("Wreckage diagonal pink reactor fissure", (-.27, -.40, .89),
             (.67, .07, .08), fracture, root, True),
        cube("Wreckage second pink reactor fissure", (.26, .38, .86),
             (.49, .08, .09), fracture, root, True),
    ]
    for index, obj in enumerate(wreck):
        obj.rotation_euler = (.08 * (index % 4), .14 * ((index % 3) - 1),
                              .27 * ((index % 5) - 2))
    return root, hover, core, fins, attack, wreck


def pose(parts, state, facing):
    root, hover, core, fins, attack, wreck = parts
    root.rotation_euler = (0, 0, facing * math.tau / FACINGS)
    hover.location = (0, 0, .16 if state == "move" else .07 if state == "attack" else
                      -.33 if state == "destroyed" else 0)
    hover.rotation_euler = (.045 if state == "move" else 0,
                            -.12 if state == "attack" else 0,
                            .075 if state == "move" else 0)
    core.location.z = 1.23 + (.12 if state == "move" else .16 if state == "attack" else 0)
    core.rotation_euler.z = .23 if state == "move" else -.18 if state == "attack" else 0
    for index, rig in enumerate(fins):
        rig.rotation_euler.z = index * math.tau / 6 + (
            .13 * (1 if index % 2 else -1) if state == "move" else
            .22 if state == "attack" else 0)
        rig.rotation_euler.y = (.18 if index % 2 else -.14) if state == "move" else (
            -.28 if state == "attack" else 0)
    for obj in hover.children_recursive:
        if obj.type == "MESH":
            obj.hide_render = False
    for obj in attack:
        obj.hide_render = state != "attack"
    for obj in wreck:
        obj.hide_render = state != "destroyed"
    if state == "destroyed":
        for obj in hover.children_recursive:
            if obj.type == "MESH":
                obj.hide_render = True
    bpy.context.view_layer.update()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = scene_setup()
    parts = build()
    pose(parts, "idle", 0)
    source = out / "psionic-hallucination-drone.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000
    for state in STATES:
        for facing in range(FACINGS):
            pose(parts, state, facing)
            target = out / "frames" / state / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED", state, FACINGS, "facings", flush=True)
    print("PREVIEW_ONLY", source, "128 original RGBA frames", flush=True)


if __name__ == "__main__":
    main()
