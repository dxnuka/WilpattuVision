"""
Central configuration for WilpattuVision backend.

Values can be overridden via environment variables at deploy time
"""
import os


MODEL_PATH = os.getenv("MODEL_PATH", "models/wilpattu_species_model.keras")
LABEL_MAP_PATH = os.getenv("LABEL_MAP_PATH", "models/label_map.json")


IMAGE_SIZE = (300, 300)
NUM_CLASSES = 16  
NONE_OF_ABOVE_RAW_LABEL = "None_of_the_above"



CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.70"))


TOP_K = 3


MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024)))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
