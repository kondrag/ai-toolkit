"""Pure planning helpers for multi-image ("Images per Run") generation.

Kept free of torch/heavy imports so the logic is unit-testable on its own
(testing/test_images_per_run.py).
"""

from typing import List

MAX_IMAGES_PER_RUN = 16


def extract_images_per_run(sample: dict) -> int:
    """Pop 'images_per_run' from a sample dict, returning a usable count.

    Missing/invalid values fall back to 1; the result is clamped to
    [1, MAX_IMAGES_PER_RUN] so the key never reaches GenerateImageConfig
    (which would raise on an unknown kwarg).
    """
    value = sample.pop("images_per_run", None)
    try:
        count = int(value)
    except (TypeError, ValueError):
        count = 1
    return max(1, min(MAX_IMAGES_PER_RUN, count))


def plan_image_seeds(seed: int, count: int) -> List[int]:
    """Seeds for each image of a run.

    A fixed seed (>= 0) increments per image (seed, seed+1, ...) so every
    image is distinct and reproducible; -1 stays -1, letting each
    GenerateImageConfig pick its own random seed.
    """
    if seed is None or seed < 0:
        return [-1] * count
    return [seed + i for i in range(count)]
