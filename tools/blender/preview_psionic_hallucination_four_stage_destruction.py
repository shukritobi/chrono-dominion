#!/usr/bin/env python3
"""PSI-VEH-004: four-stage original physical destruction, 32 facings.

Preview-only: loads the already validated Hallucination Drone .blend from
Actions 40583938655. Adds independent closed volumetric fractured components.
Never regenerates baseline frames, edits live atlases, or publishes manifests.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("impact", "shatter", "collapse", "aftermath")
FACINGS = 32
FLAG = "hallucination_destruction_only"
FACES = ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
         (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7))


def required(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Missing validated source component: " + name)
    return obj


def fragment(name, location, scale, material, root, reveal):
    """Asymmetric eight-vertex, six-face CLOSED fracture volume."""
    x, y, z = scale
    verts = [
        (-.56*x, -.46*y, -.47*z), (.51*x, -.44*y, -.42*z),
        (.60*x, .32*y, -.31*z), (-.34*x, .57*y, -.51*z),
        (-.43*x, -.34*y, .58*z), (.39*x, -.52*y, .41*z),
        (.46*x, .28*y, .34*z), (-.52*x, .38*y, .54*z),
    ]
    mesh = bpy.data.meshes.new(name + " original fracture volume")
    mesh.from_pydata(verts, [], FACES)
    mesh.update()
    assert len(mesh.vertices) == 8 and len(mesh.polygons) == 6
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = root
    obj.location = location
    obj.data.materials.append(material)
    obj[FLAG] = True
    obj["reveal_at"] = reveal
    obj.hide_render = True
    return obj


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    assert scene.camera and scene.render.film_transparent
    assert (scene.render.resolution_x, scene.render.resolution_y) == (160, 160)

    root = required("Psionic Hallucination Drone - original 32 facing source")
    hover = required("Floating phase lens chassis")
    core = required("Independent oscillating neural iris")
    petals = [required("Independent phase petal %02d" % i) for i in range(6)]
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    attack = [o for o in bpy.data.objects if o.name.startswith("Attack-only")]
    assert len(wreck) == 10 and len(attack) == 5
    original = [o for o in hover.children_recursive if o.type == "MESH"]
    assert len(original) >= 20
    ceramic = required("Low sixfold phase projector housing").data.materials[0]
    violet = required("Faceted folding psychic petal 00").data.materials[0]
    silver = required("Sixfold crystal crown").data.materials[0]
    fracture = bpy.data.materials.get("Hallucination reactor fracture")
    mint = bpy.data.materials.get("Hallucination charged mint lens")
    assert fracture and mint

    # Broken petals and displaced hardware have real volume and can be edited
    # individually. Fracture lights are narrow physical prisms, not bloom cards.
    specs = [
        ("D01 sheared front left petal", (1.08,-.86,.75), (.80,.42,.19), violet, 1),
        ("D02 sheared front right petal", (1.05,.83,.72), (.73,.38,.21), violet, 1),
        ("D03 broken rear petal", (-1.04,-.59,.72), (.75,.40,.19), violet, 1),
        ("D04 severed phase hinge", (-.71,.91,.66), (.40,.25,.24), silver, 1),
        ("D05 broken needle port", (1.52,-.35,.58), (.51,.16,.15), silver, 1),
        ("D06 broken needle starboard", (1.46,.37,.52), (.49,.17,.14), silver, 1),
        ("D07 split upper crystal crown", (-.28,.18,.96), (.65,.50,.27), ceramic, 2),
        ("D08 exposed neural iris prism", (.22,-.21,.83), (.39,.35,.33), mint, 2),
        ("D09 torn left intake", (-1.06,-.78,.49), (.53,.23,.21), ceramic, 2),
        ("D10 torn right intake", (-1.10,.78,.47), (.52,.25,.22), ceramic, 2),
        ("D11 narrow cross fracture", (-.24,-.35,.95), (.59,.075,.095), fracture, 0),
        ("D12 narrow diagonal fracture", (.24,.29,.94), (.56,.085,.090), fracture, 0),
        ("D13 fractured underside keel", (-.13,.02,.37), (.91,.64,.18), ceramic, 3),
        ("D14 fractured outer ring arc", (.68,-.75,.44), (.64,.25,.16), violet, 3),
    ]
    fragments = [fragment(name, pos, dims, mat, root, reveal)
                 for name, pos, dims, mat, reveal in specs]
    assert len(fragments) == 14
    origins = {o.name: tuple(o.location) for o in fragments}

    # Neutral saved source: intact original drone; 14 new volumes hidden.
    root.rotation_euler = (0, 0, 0)
    hover.location = (0, 0, 0)
    hover.rotation_euler = (0, 0, 0)
    core.location.z = 1.23
    core.rotation_euler = (0, 0, 0)
    for i, petal in enumerate(petals):
        petal.rotation_euler = (0, 0, i * math.tau / 6)
    for obj in original:
        obj.hide_render = obj in attack
    for obj in attack + wreck + fragments:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "psionic-hallucination-four-stage-destruction.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler = (0, 0, facing * math.tau / FACINGS)
            hover.location = (0, 0, (-.06, -.19, -.32, -.44)[phase_index])
            hover.rotation_euler = (
                (.05, .14, .24, .31)[phase_index],
                (-.03, .10, -.17, -.23)[phase_index],
                (.015, -.06, .13, .20)[phase_index])
            core.location.z = 1.23 + (.02, -.08, -.23, -.30)[phase_index]
            core.rotation_euler.z = (.04, .19, -.25, -.39)[phase_index]
            for i, petal in enumerate(petals):
                petal.rotation_euler.z = i * math.tau / 6 + (
                    (.04, .22, .37, .50)[phase_index] *
                    (1 if i % 2 else -1))
                petal.rotation_euler.y = (
                    (.06, .23, .39, .51)[phase_index] *
                    (1 if i % 2 else -1))
            for obj in original:
                name = obj.name.lower()
                remove = phase_index == 3
                if phase_index >= 1 and any(
                        token in name for token in (
                            "petal 00", "petal 03", "focus tip -1")):
                    remove = True
                if phase_index >= 2 and any(
                        token in name for token in (
                            "petal 01", "petal 04", "sixfold crystal crown",
                            "raised amethyst perimeter ring",
                            "split forward psychic needle -1",
                            "paired asymmetric side intake -1")):
                    remove = True
                obj.hide_render = remove or obj in attack
            for index, obj in enumerate(wreck):
                obj.hide_render = phase_index < 2 or (
                    phase_index == 2 and index not in (2, 3, 7, 8, 9))
            for index, obj in enumerate(fragments):
                obj.hide_render = phase_index < obj["reveal_at"]
                x, y, z = origins[obj.name]
                spread = (0, .06, .14, .23)[phase_index]
                obj.location = (
                    x + spread * (1 if index % 2 else -1),
                    y + spread * (1 if index % 3 else -1),
                    z - (0, .04, .12, .20)[phase_index])
                obj.rotation_euler = (
                    .10 * phase_index * (1 if index % 2 else -1),
                    .09 * phase_index * (1 if index % 3 else -1),
                    .17 * phase_index * (1 if index % 2 else -1))
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED HALLUCINATION DESTRUCTION", phase, FACINGS, flush=True)
    print("PREVIEW ONLY", source, "128 new destruction frames", flush=True)


if __name__ == "__main__":
    main()
