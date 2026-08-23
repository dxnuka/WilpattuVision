"""
Shared pytest fixtures for the WilpattuVision test suite.

Key idea: tests run against a tiny disposable model with the SAME
interface as the real one (300x300x3 in, 16-class softmax out), not
against wilpattu_species_model.keras itself. This means:
  - Tests run fast and don't require your real (possibly large) model
    file to be present in CI or on a teammate's machine.
  - Tests are exercising the API/preprocessing/threshold plumbing,
    NOT validating your model's actual accuracy — that's a separate
    concern (your test-set evaluation), not something a unit test
    should re-derive.
"""
import json
import sys
from io import BytesIO
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

# Make `app` importable when pytest is run from the project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


# Mirrors the real models/label_map.json exactly (16 classes, including
# the "None of the above" class) so raw_label values used in tests -- e.g.
# in TestNoneOfAboveHandling -- match what the real deployed model actually
# produces.
TEST_LABELS = {
    "0": "Asian_elephant",
    "1": "Bengal_monitor_lizard",
    "2": "Crested_serpent_eagle",
    "3": "Fishing_cat",
    "4": "Golden_jackal",
    "5": "Mugger_crocodile",
    "6": "None_of_the_above",
    "7": "Sambar_deer",
    "8": "Sloth_bear",
    "9": "Spotted_deer",
    "10": "Sri_Lankan_grey_langur",
    "11": "Sri_Lankan_jungle_fowl",
    "12": "Sri_Lankan_leopard",
    "13": "Sri_Lankan_peacock",
    "14": "Water_buffalo",
    "15": "Wild_boar",
}


@pytest.fixture(scope="session")
def test_model_dir(tmp_path_factory):
    """
    Builds a throwaway Keras model + label_map.json with the real
    model's I/O shape, in a session-scoped tmp dir so it's built once
    per test run and cleaned up automatically by pytest afterward.

    Includes an internal Rescaling(1./255) layer -- mirroring how the
    real model (EfficientNetB3) does its own internal normalization on
    raw [0, 255] input. Without this, an untrained Dense layer fed raw
    0-255 magnitudes produces extreme logits and a near one-hot softmax
    by sheer numerical accident, regardless of the actual image content
    -- which would make the confidence-threshold tests meaningless.
    """
    import tensorflow as tf

    model_dir = tmp_path_factory.mktemp("model")

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(300, 300, 3)),
        tf.keras.layers.Rescaling(1.0 / 255),
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(16, activation="softmax"),
    ])
    model_path = model_dir / "test_model.keras"
    model.save(model_path)

    label_map_path = model_dir / "label_map.json"
    with open(label_map_path, "w") as f:
        json.dump(TEST_LABELS, f)

    return model_path, label_map_path


@pytest.fixture()
def client(test_model_dir, monkeypatch):
    """
    Returns a TestClient wired to the disposable test model, with
    a fresh ModelService instance per test so state never leaks
    between tests (e.g. one test's loaded model bleeding into another).
    """
    model_path, label_map_path = test_model_dir

    monkeypatch.setenv("MODEL_PATH", str(model_path))
    monkeypatch.setenv("LABEL_MAP_PATH", str(label_map_path))

    # Reload config + model_service so the env vars above actually take
    # effect (config.py reads them at import time).
    import importlib
    from app import config as config_module
    importlib.reload(config_module)
    from app import model_service as model_service_module
    importlib.reload(model_service_module)
    from app import main as main_module
    importlib.reload(main_module)

    from fastapi.testclient import TestClient

    with TestClient(main_module.app) as c:
        yield c


def _make_image_bytes(width=450, height=600, mode="RGB", fmt="JPEG"):
    """Random noise image, encoded to bytes — stands in for a real photo upload."""
    if mode == "RGB":
        arr = (np.random.rand(height, width, 3) * 255).astype("uint8")
    else:
        # e.g. "L" (grayscale) is a single-channel mode -> 2D array, not 3D
        arr = (np.random.rand(height, width) * 255).astype("uint8")
    img = Image.fromarray(arr, mode=mode)
    buf = BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf.read()


@pytest.fixture()
def valid_jpeg_bytes():
    return _make_image_bytes(fmt="JPEG")


@pytest.fixture()
def valid_png_bytes():
    return _make_image_bytes(fmt="PNG")


@pytest.fixture()
def grayscale_jpeg_bytes():
    """Tests the RGB-conversion path in model_service._decode_image."""
    return _make_image_bytes(mode="L", fmt="JPEG")
