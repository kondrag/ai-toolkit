"""Unit tests for the "Images per Run" generation plan helpers.

Covers the pure logic behind the Generate page's "Images per Run" field:
extracting/clamping the count from a sample dict and the per-image seed
progression. No torch / GPU required.

Usage:
  python testing/test_images_per_run.py
"""

import importlib.util
import os
import sys
import unittest

TOOLKIT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, TOOLKIT_ROOT)

# loaded straight from its file (not via the package) so the test runs without
# the toolkit's heavy deps; the engine itself imports this module normally
_PLAN_PATH = os.path.join(TOOLKIT_ROOT, "extensions_built_in", "inference_engine", "generation_plan.py")
_spec = importlib.util.spec_from_file_location("generation_plan", _PLAN_PATH)
generation_plan = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(generation_plan)

MAX_IMAGES_PER_RUN = generation_plan.MAX_IMAGES_PER_RUN
extract_images_per_run = generation_plan.extract_images_per_run
plan_image_seeds = generation_plan.plan_image_seeds


class ExtractImagesPerRunTest(unittest.TestCase):
    def test_missing_key_defaults_to_one(self):
        self.assertEqual(extract_images_per_run({"width": 512}), 1)

    def test_key_is_removed_from_sample(self):
        sample = {"images_per_run": 4}
        self.assertEqual(extract_images_per_run(sample), 4)
        self.assertNotIn("images_per_run", sample)

    def test_none_value_defaults_to_one(self):
        sample = {"images_per_run": None}
        self.assertEqual(extract_images_per_run(sample), 1)
        self.assertNotIn("images_per_run", sample)

    def test_float_value_is_truncated(self):
        self.assertEqual(extract_images_per_run({"images_per_run": 3.0}), 3)

    def test_garbage_value_defaults_to_one(self):
        self.assertEqual(extract_images_per_run({"images_per_run": "lots"}), 1)

    def test_zero_and_negative_clamp_to_one(self):
        self.assertEqual(extract_images_per_run({"images_per_run": 0}), 1)
        self.assertEqual(extract_images_per_run({"images_per_run": -5}), 1)

    def test_above_maximum_clamps(self):
        self.assertEqual(extract_images_per_run({"images_per_run": 999}), MAX_IMAGES_PER_RUN)


class PlanImageSeedsTest(unittest.TestCase):
    def test_fixed_seed_increments_per_image(self):
        self.assertEqual(plan_image_seeds(42, 4), [42, 43, 44, 45])

    def test_single_image_keeps_seed_unchanged(self):
        self.assertEqual(plan_image_seeds(42, 1), [42])

    def test_random_seed_stays_random_per_image(self):
        self.assertEqual(plan_image_seeds(-1, 3), [-1, -1, -1])

    def test_zero_seed_is_fixed_not_random(self):
        self.assertEqual(plan_image_seeds(0, 2), [0, 1])


if __name__ == "__main__":
    unittest.main()
