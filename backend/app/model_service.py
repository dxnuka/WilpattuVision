"""
Model loading, preprocessing, and inference logic for WilpattuVision.

"""
import json
import logging
from io import BytesIO
from pathlib import Path
from typing import List, Tuple

import numpy as np
from PIL import Image, UnidentifiedImageError

from app import config

logger = logging.getLogger("wilpattuvision.model_service")


class ImageDecodeError(Exception):
    """Raised when the uploaded bytes can't be decoded as a usable image."""


class ModelService:
    """
    Wraps the Keras model + label map and exposes a single
    predict_top_k() method. Instantiated once at app startup
    and reused across requests.
    """

    def __init__(self, model_path: str, label_map_path: str):
        self._model_path = model_path
        self._label_map_path = label_map_path
        self.model = None
        self.label_map: dict[str, str] = {}

    def load(self) -> None:
        """
        Loads the Keras model and label map into memory.
        Import of tensorflow is deferred to here (rather than top-of-file)
        so that the rest of the app — and tools like pytest collecting
        tests — don't pay TensorFlow's heavy import cost unless a
        prediction is actually about to happen.
        """
        import tensorflow as tf  

        model_path = Path(self._model_path)
        label_map_path = Path(self._label_map_path)

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path.resolve()}")
        if not label_map_path.exists():
            raise FileNotFoundError(f"Label map not found at {label_map_path.resolve()}")

        logger.info(f"Loading model from {model_path} ...")
        self.model = tf.keras.models.load_model(model_path)

        with open(label_map_path, "r") as f:
            self.label_map = json.load(f)

        if len(self.label_map) != config.NUM_CLASSES:
            logger.warning(
                f"label_map.json has {len(self.label_map)} entries, "
                f"expected {config.NUM_CLASSES}. Check config.NUM_CLASSES."
            )

        logger.info(f"Model loaded. {len(self.label_map)} classes available.")

    def is_ready(self) -> bool:
        return self.model is not None

    @staticmethod
    def _humanize(raw_label: str) -> str:
        """'Sri_Lankan_leopard' -> 'Sri Lankan leopard'"""
        return raw_label.replace("_", " ")

    def _decode_image(self, file_bytes: bytes) -> Image.Image:
        try:
            img = Image.open(BytesIO(file_bytes))
            img.load()  
        except UnidentifiedImageError as e:
            raise ImageDecodeError("File is not a recognizable image format.") from e
        except Exception as e:
            # Covers truncated files, zero-byte files, and other PIL decode failures
            raise ImageDecodeError(f"Could not decode image: {e}") from e

        if img.mode != "RGB":
            img = img.convert("RGB")
        return img

    def _preprocess(self, img: Image.Image) -> np.ndarray:
        """
        Mirrors the exact preprocessing used in training/inference
        (tf.keras.utils.load_img + img_to_array), so the served model
        sees pixels in the same distribution it was trained on:

        """
        img = img.resize(config.IMAGE_SIZE, resample=Image.NEAREST)
        arr = np.asarray(img, dtype=np.float32) 
        arr = np.expand_dims(arr, axis=0) 
        return arr

    def predict_top_k(
        self, file_bytes: bytes, k: int = config.TOP_K
    ) -> List[Tuple[str, str, float]]:
        """
        Returns a list of (raw_label, human_label, confidence) tuples,
        sorted descending by confidence, length k.
        Raises ImageDecodeError if the bytes aren't a usable image.
        """
        if not self.is_ready():
            raise RuntimeError("Model is not loaded yet.")

        img = self._decode_image(file_bytes)
        batch = self._preprocess(img)

        preds = self.model.predict(batch, verbose=0)[0]  # shape: (NUM_CLASSES,)

        top_indices = np.argsort(preds)[::-1][:k]
        results = []
        for idx in top_indices:
            raw_label = self.label_map.get(str(idx), f"class_{idx}")
            results.append((raw_label, self._humanize(raw_label), float(preds[idx])))
        return results


model_service = ModelService(config.MODEL_PATH, config.LABEL_MAP_PATH)
