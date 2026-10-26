#!/usr/bin/env python3
"""Blender Asset Studio acceptance tests using synthetic transparent PNG renders."""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

FILE = Path(__file__).resolve().parents[1] / "tools" / "blender" / "asset_studio.py"
spec = importlib.util.spec_from_file_location("studio", FILE)
studio = importlib.util.module_from_spec(spec)
sys.modules["studio"] = studio
spec.loader.exec_module(studio)


class StudioTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.stage = self.root / "studio"
        self.game = self.root / "game"
        atlas = self.stage / "packed" / "coalition-generator.png"
        atlas.parent.mkdir(parents=True)
        img = Image.new("RGBA", (160, 800))
        paint = ImageDraw.Draw(img)
        for row in range(5):
            paint.rectangle((34, row * 160 + 32, 124, row * 160 + 136),
                            fill=(48, 168, 226, 255))
        img.save(atlas)
        source = self.stage / "sources" / "coalition-generator.blend"
        source.parent.mkdir(parents=True)
        source.write_bytes(b"BLENDER" + b"model-source" * 120)
        self.staged_manifest = {
            "format": "chrono-blender-v1",
            "frameSize": 160,
            "entries": {
                "coalition": {
                    "generator": {
                        "file": "coalition-generator.png",
                        "directions": 1,
                        "states": {"idle": 2, "construct": 2, "damaged": 1},
                        "pivot": [80, 141],
                        "canvasSize": [160, 800]
                    }
                },
                "federation": {},
                "psionic": {}
            }
        }
        (self.stage / "packed" / "manifest.json").write_text(
            json.dumps(self.staged_manifest))
        (self.game / "art" / "baked-v1").mkdir(parents=True)
        production = {
            "format": "chrono-blender-v1",
            "frameSize": 160,
            "entries": {
                "coalition": {"soldier": {"file": "coalition-soldier.png"}},
                "federation": {"hq": {"file": "federation-hq.png"}},
                "psionic": {"radar": {"file": "psionic-radar.png"}}
            }
        }
        self.original_manifest = production
        self.production_manifest = self.game / "art" / "baked-v1" / "manifest.json"
        self.production_manifest.write_text(json.dumps(production))

    def test_single_asset_inspection_and_preview(self):
        manifest, item, image, atlas, blend = studio.inspect(
            self.stage, "coalition", "generator")
        self.assertEqual(image.size, (160, 800))
        self.assertEqual(item["directions"], 1)
        self.assertTrue(blend.exists())
        previous = self.production_manifest.read_bytes()
        output = studio.preview(self.stage, "coalition", "generator")
        self.assertGreater(output.stat().st_size, 500)
        self.assertEqual(previous, self.production_manifest.read_bytes(),
                         "Preview must never modify production manifest")
        self.assertFalse((self.game / "art" / "sources").exists(),
                         "Preview must not copy production models")

    def test_publishing_requires_explicit_confirmation(self):
        with self.assertRaises(PermissionError):
            studio.publish(self.stage, self.game, "coalition", "generator", "")
        with self.assertRaises(PermissionError):
            studio.publish(self.stage, self.game, "coalition", "generator", "publish")
        self.assertEqual(json.loads(self.production_manifest.read_text()),
                         self.original_manifest)

    def test_publish_selected_entry_and_preserve_unrelated_assets(self):
        count = studio.publish(self.stage, self.game, "coalition", "generator", "PUBLISH")
        self.assertEqual(count, 2)
        output = json.loads(self.production_manifest.read_text())
        self.assertIn("soldier", output["entries"]["coalition"])
        self.assertIn("generator", output["entries"]["coalition"])
        self.assertEqual(output["entries"]["federation"], self.original_manifest["entries"]["federation"])
        self.assertEqual(output["entries"]["psionic"], self.original_manifest["entries"]["psionic"])
        self.assertTrue((self.game / "art" / "sources" / "blender" /
                         "coalition-generator.blend").exists())
        self.assertTrue((self.game / "art" / "baked-v1" /
                         "coalition-generator.png").exists())

    def test_missing_or_transparent_animation_frame_is_rejected(self):
        atlas = self.stage / "packed" / "coalition-generator.png"
        with Image.open(atlas) as src:
            im = src.copy()
        ImageDraw.Draw(im).rectangle((0, 480, 159, 639), fill=(0, 0, 0, 0))
        im.save(atlas)
        with self.assertRaisesRegex(ValueError, "Empty animation frame"):
            studio.inspect(self.stage, "coalition", "generator")

    def test_wrong_asset_or_extra_manifest_entry_is_rejected(self):
        self.staged_manifest["entries"]["federation"]["hq"] = {
            "file": "federation-hq.png"
        }
        (self.stage / "packed" / "manifest.json").write_text(
            json.dumps(self.staged_manifest))
        with self.assertRaisesRegex(ValueError, "only the selected"):
            studio.inspect(self.stage, "coalition", "generator")


if __name__ == "__main__":
    unittest.main()
