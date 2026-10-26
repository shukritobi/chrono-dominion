#!/usr/bin/env python3
"""Fail fast on malformed procedural Blender geometry calls.

This runs on ordinary Python before GitHub Actions installs Blender. It checks
the shared modeling primitives and faction-building helper signatures so
misgrouped coordinates cannot waste an entire remote 3D render.
"""
import argparse
import ast
from pathlib import Path

# Required parameters come first. Last number is total parameters.
PRIMITIVES = {
    "box": (("name", "loc", "size", "material", "bevel"), 4),
    "cyl": (("name", "loc", "radius", "depth", "material", "axis", "vertices"), 5),
    "sphere": (("name", "loc", "scale", "material", "segments", "rings"), 4),
    "mesh": (("name", "verts", "faces", "material"), 4),
    "prism": (("name", "x", "y", "z", "width", "height", "material", "sides"), 6),
    "spire": (("name", "x", "y", "z", "w", "height", "material", "sides"), 6),
    "torus": (("name", "location", "radius", "tube", "material", "vertical"), 4),
    "tower": (("name", "x", "y", "z", "h", "material", "width"), 5),
    "barrel": (("name", "x", "y", "z", "depth", "radius", "material"), 4)
}
NUMERIC_COORD_HELPERS = {"prism", "spire", "tower", "barrel"}


def check_source(source: str, filename: str = "<source>") -> list[str]:
    code = ast.parse(source, filename=filename)
    errors = []
    for node in ast.walk(code):
        if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Name):
            continue
        kind = node.func.id
        if kind not in PRIMITIVES:
            continue
        parameters, required = PRIMITIVES[kind]
        if any(isinstance(x, ast.Starred) for x in node.args):
            errors.append(f"{filename}:{node.lineno} {kind}: unpacked positional args are unsupported")
            continue
        keywords = [k.arg for k in node.keywords]
        if None in keywords:
            errors.append(f"{filename}:{node.lineno} {kind}: unpacked keyword args are unsupported")
            continue
        if len(node.args) > len(parameters):
            errors.append(f"{filename}:{node.lineno} {kind}: too many positional args")
            continue
        used = set(parameters[:len(node.args)])
        for key in keywords:
            if key not in parameters:
                errors.append(f"{filename}:{node.lineno} {kind}: unexpected keyword {key}")
            elif key in used:
                errors.append(f"{filename}:{node.lineno} {kind}: duplicate parameter {key}")
            used.add(key)
        missing = [name for name in parameters[:required] if name not in used]
        if missing:
            errors.append(f"{filename}:{node.lineno} {kind}: missing {', '.join(missing)}")
        if kind in NUMERIC_COORD_HELPERS:
            for offset in (1, 2, 3):
                if len(node.args) > offset and isinstance(node.args[offset], (ast.Tuple, ast.List, ast.Dict)):
                    errors.append(
                        f"{filename}:{node.lineno} {kind}: coordinate {parameters[offset]} "
                        "must be a number, not a tuple/list; unpack x,y,z separately"
                    )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", type=Path,
                        default=Path("tools/blender/building_architecture.py"))
    arguments = parser.parse_args()
    path = arguments.path
    errors = check_source(path.read_text(encoding="utf-8"), str(path))
    if errors:
        print("\n".join(errors))
        return 1
    print(f"Validated procedural geometry helper signatures in {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
