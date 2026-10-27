#!/usr/bin/env python3
"""FED-VEH-004 original four-stage physical destruction, 32 directions.

Reopens the validated Hunter Spider source from Actions #40556753530.
Adds independently editable sheared legs, ejected armor and fracture prisms.
Renders ONLY the new 128 destruction frames; the original atlas is immutable.
This is preview-only artwork, never production texture replacement.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy

PHASES = ("impact", "shear", "rupture", "settle")
FACINGS = 32


def required(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise RuntimeError("Missing archived editable mesh: " + name)
    return obj


def shard(name, position, dimensions, material, reveal_at):
    """A genuinely volumetric asymmetric six-face broken armor prism."""
    sx, sy, sz = dimensions
    verts = [
        (-.55*sx, -.48*sy, -.43*sz), (.46*sx, -.43*sy, -.40*sz),
        (.58*sx, .41*sy, -.35*sz), (-.31*sx, .53*sy, -.49*sz),
        (-.36*sx, -.35*sy, .51*sz), (.33*sx, -.51*sy, .43*sz),
        (.49*sx, .23*sy, .38*sz), (-.48*sx, .34*sy, .56*sz),
    ]
    faces = [
        (0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
        (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
    ]
    mesh = bpy.data.meshes.new(name + " physical mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = position
    obj.data.materials.append(material)
    obj["spider_destruction_only"] = True
    obj["reveal_at"] = reveal_at
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
    root = required("Federation Hunter Spider Drone - original 32 facing source")
    body = required("Low armored eight-legged hunting core")
    stinger = required("Independent dorsal penetration lance")
    shock = required("Attack-only crimson impact shard")
    halo = required("Attack-only induction halo")
    rigs = sorted(
        [o for o in bpy.data.objects
         if o.type == "EMPTY" and o.name.startswith("Independent spider leg ")],
        key=lambda o: o.name)
    wreck = [o for o in bpy.data.objects if o.get("wreckage_only")]
    assert len(rigs) == 8 and len(wreck) == 10, (len(rigs), len(wreck))
    metal = required("Original sloping hunter carapace").data.materials[0]
    steel = required("Stinger sharpened titanium needle").data.materials[0]
    hot = bpy.data.materials.get("Spider hot fracture highlight")
    amber = bpy.data.materials.get("Spider optical sensor amber")
    assert hot and amber

    # Every fragment is independently editable 3D volume, not a sprite overlay.
    # Positions stay inside the archived 160px framing envelope.
    specs = [
        ("D01 left foreleg snapped upper", (.79,-1.07,.67), (.81,.16,.17), steel, 1),
        ("D02 right foreleg snapped upper", (1.02,1.01,.59), (.73,.16,.16), steel, 1),
        ("D03 port knee piston wreck", (-.38,-1.24,.48), (.62,.12,.14), steel, 1),
        ("D04 starboard knee piston wreck", (-.74,1.20,.44), (.68,.12,.15), steel, 1),
        ("D05 ejected visor wedge", (1.16,-.45,.98), (.49,.43,.19), metal, 1),
        ("D06 shattered top carapace left", (-.48,-.62,1.10), (.76,.48,.24), metal, 2),
        ("D07 shattered top carapace right", (.16,.55,.91), (.69,.44,.22), metal, 2),
        ("D08 torn rear armor slab", (-1.00,.22,.75), (.60,.47,.17), metal, 2),
        ("D09 exposed diagonal reactor seam", (-.24,-.38,1.08), (.65,.09,.11), hot, 0),
        ("D10 exposed cross reactor seam", (.23,.34,1.04), (.55,.08,.12), hot, 0),
        ("D11 ejected optical crystal", (.91,.69,.74), (.27,.27,.31), amber, 2),
        ("D12 collapsed undercarriage plate", (.08,-.19,.47), (.90,.72,.16), metal, 3),
        ("D13 fractured port mandible", (1.18,-.70,.48), (.63,.15,.14), metal, 3),
        ("D14 fractured starboard mandible", (.97,.82,.42), (.58,.16,.14), metal, 3),
    ]
    fragments = [
        shard(name, pos, dim, material, reveal)
        for name, pos, dim, material, reveal in specs
    ]
    assert len(fragments) == 14
    initial = {obj.name: tuple(obj.location) for obj in fragments}

    # Saved source opens in intact, inspectable condition.
    root.rotation_euler = (0, 0, 0)
    body.location = (0, 0, 0)
    body.rotation_euler = (0, 0, 0)
    stinger.rotation_euler = (0, 0, 0)
    shock.hide_render = True
    halo.hide_render = True
    for obj in fragments + wreck:
        obj.hide_render = True
    bpy.context.view_layer.update()
    source = out / "federation-hunter-spider-four-stage-destruction.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    assert source.stat().st_size > 2000

    body_meshes = [o for o in body.children_recursive if o.type == "MESH"]
    for phase_index, phase in enumerate(PHASES):
        for facing in range(FACINGS):
            root.rotation_euler = (0, 0, facing * math.tau / FACINGS)
            body.location = (0, 0, (-.045, -.19, -.32, -.44)[phase_index])
            body.rotation_euler = (
                (.07, .17, .24, .32)[phase_index],
                (-.06, .13, .25, .15)[phase_index],
                (.015, -.06, .11, .18)[phase_index],
            )
            stinger.rotation_euler.y = (.12, .31, .54, .69)[phase_index]
            stinger.location.x = .16
            for rig in rigs:
                index = int(rig.name.rsplit(" ", 1)[1])
                side = -1 if "port" in rig.name else 1
                rig.location = (
                    (-.89, -.35, .20, .75)[index] +
                    (.06 if phase_index == 0 else .16 if phase_index == 1 else -.12),
                    side * .47,
                    .95 - (.04, .12, .23, .31)[phase_index],
                )
                rig.rotation_euler = (
                    side * (.04, .13, .21, .28)[phase_index],
                    (.03, -.11, .18, .25)[phase_index],
                    side * (.02, -.15, .29, .43)[phase_index],
                )
            for obj in body_meshes:
                name = obj.name.lower()
                hide = False
                if phase_index >= 1 and any(
                        token in name for token in ("leg 03", "leg 07")):
                    hide = True
                if phase_index >= 2 and any(
                        token in name for token in (
                            "leg 02", "leg 06", "hunter carapace",
                            "armoured segmented abdomen", "dorsal battery",
                            "tracking eye", "optical side slit")):
                    hide = True
                if phase_index == 3 and any(
                        token in name for token in (
                            "leg ", "stinger", "mandible", "hip socket",
                            "charged injector", "sliding carbon rail")):
                    hide = True
                obj.hide_render = hide
            shock.hide_render = True
            halo.hide_render = True
            for index, obj in enumerate(wreck):
                obj.hide_render = (
                    phase_index < 2 or
                    (phase_index == 2 and index not in (0, 1, 2, 7, 8, 9)))
            for index, obj in enumerate(fragments):
                obj.hide_render = phase_index < int(obj["reveal_at"])
                x, y, z = initial[obj.name]
                spread = (0, .05, .17, .27)[phase_index]
                obj.location = (
                    x + spread * (1 if index % 2 else -1),
                    y + spread * (1 if index % 3 else -1),
                    z - (.0, .035, .12, .21)[phase_index],
                )
                obj.rotation_euler = (
                    .13 * phase_index * (1 if index % 2 else -1),
                    .10 * phase_index * (1 if index % 3 else -1),
                    .18 * phase_index * (1 if index % 2 else -1),
                )
            bpy.context.view_layer.update()
            target = out / "frames" / phase / ("%02d.png" % facing)
            target.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(target)
            bpy.ops.render.render(write_still=True)
        print("RENDERED SPIDER PHYSICAL DESTRUCTION", phase, FACINGS, flush=True)
    print("PREVIEW_ONLY", source, "128 NEW DESTRUCTION FRAMES", flush=True)


if __name__ == "__main__":
    main()
