"""
WilpattuVision backend — FastAPI app.

Endpoints:
    GET  /health    — liveness check, also reports model load status
    POST /predict    — accepts an image upload, returns top-3 species
                       predictions with an explicit confidence flag
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.model_service import ImageDecodeError, model_service
from app.schemas import ErrorResponse, PredictResponse, SpeciesPrediction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wilpattuvision.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_service.load()
    yield


app = FastAPI(
    title="Wilpattu Vision API",
    description="Species identification backend for Wilpattu National Park wildlife.",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok" if model_service.is_ready() else "model_not_loaded",
        "model_ready": model_service.is_ready(),
        "num_classes": len(model_service.label_map) if model_service.is_ready() else 0,
        "confidence_threshold": config.CONFIDENCE_THRESHOLD,
    }


@app.post(
    "/predict",
    response_model=PredictResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
async def predict(file: UploadFile = File(...)):
    if not model_service.is_ready():
        raise HTTPException(status_code=503, detail="Model is not loaded yet. Try again shortly.")


    if file.content_type not in config.ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type '{file.content_type}'. "
                   f"Expected one of: {sorted(config.ALLOWED_CONTENT_TYPES)}.",
        )


    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > config.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {config.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB.",
        )

    try:
        top_k = model_service.predict_top_k(file_bytes, k=config.TOP_K)
    except ImageDecodeError as e:
        # Covers non-image files and corrupted/truncated uploads (requirement #5)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Inference failed unexpectedly")
        raise HTTPException(status_code=500, detail="Internal error during inference.")


    predictions = [
        SpeciesPrediction(species=human, raw_label=raw, confidence=round(conf, 4))
        for raw, human, conf in top_k
    ]
    top = predictions[0]


    is_recognized_species = top.raw_label != config.NONE_OF_ABOVE_RAW_LABEL
    is_confident = is_recognized_species and top.confidence >= config.CONFIDENCE_THRESHOLD

    if is_confident:
        message = f"Identified as {top.species} with {top.confidence:.0%} confidence."
    elif is_recognized_species:
        message = (
            f"Not confidently identified. Closest match was {top.species} "
            f"at {top.confidence:.0%} confidence, below the "
            f"{config.CONFIDENCE_THRESHOLD:.0%} threshold. This may be an animal "
            f"outside Wilpattu's known species, a non-animal image, or a poor-quality photo."
        )
    else:
        message = (
            f"This doesn't look like one of Wilpattu's known species "
            f"({top.confidence:.0%} confidence it's something else). If you "
            f"believe this is a misidentification, try a clearer or closer photo."
        )

    return PredictResponse(
        is_recognized_species=is_recognized_species,
        is_confident=is_confident,
        message=message,
        top_prediction=top,
        top_3=predictions,
        threshold_used=config.CONFIDENCE_THRESHOLD,
    )
