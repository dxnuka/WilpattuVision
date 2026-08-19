"""
Central configuration for WilpattuVision backend.

Values can be overridden via environment variables at deploy time
(e.g. on Render's dashboard) without touching code — useful since
the confidence threshold is still being empirically tuned.
"""
import os


MODEL_PATH = os.getenv("MODEL_PATH", "models/wilpattu_species_model.keras")
LABEL_MAP_PATH = os.getenv("LABEL_MAP_PATH", "models/label_map.json")


IMAGE_SIZE = (300, 300)
NUM_CLASSES = 16  # 15 species + the "None of the above" class

# The raw (underscore-format) label used for the "None of the above" class
# in label_map.json -- checked explicitly in main.py to branch the response
# logic, since that case needs different handling from a normal low-confidence
# species guess (see main.py's predict() for the reasoning).
NONE_OF_ABOVE_RAW_LABEL = "None_of_the_above"


# CONFIDENCE_THRESHOLD -- reasoned default, not an empirically swept optimum.
#
# Chosen from the test-set classification report (16-class EfficientNetB3,
# 90.45% overall accuracy):
#   - Several genuine species sit in the 0.79-0.87 PRECISION range (Fishing
#     cat 0.792, Crested serpent eagle 0.848, Water buffalo 0.837, Sri Lankan
#     leopard 0.868, Wild boar 0.872) -- setting the threshold much above
#     0.80 risks routinely flagging correct calls on those species as "not
#     confident", which hurts the very users who uploaded a perfectly good
#     photo of a hard-to-distinguish species.
#   - "None of the above" has by far the worst RECALL of any class (0.630,
#     next-worst is 0.814) -- meaning ~37% of true outsider photos get
#     confidently misclassified as a real species rather than caught by the
#     None-of-above class itself. The threshold is the only backstop for
#     that remaining ~37%, so it can't be set too low either.
# 0.70 is a middle-ground pick balancing those two pulls. It is NOT derived
# from a precision-recall/risk-coverage sweep against actual per-example
# confidence scores (that data isn't exported from the notebook yet) -- if
# you want a rigorously-justified number for your report, that's a
# worthwhile follow-up.
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.70"))


TOP_K = 3


MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024)))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
