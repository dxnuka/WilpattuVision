"""
Pydantic models defining the /predict response contract.

Design note: `is_confident` and `message` are always present, not just
bolted on when confidence is low. This forces every API consumer
(your frontend, a future mobile app, graders inspecting the API) to
see the confidence status explicitly rather than assuming the
top prediction is ground truth.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class SpeciesPrediction(BaseModel):
    species: str = Field(..., description="Predicted species, human-readable")
    raw_label: str = Field(..., description="Original underscore_separated class name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Softmax probability")


class PredictResponse(BaseModel):
    is_recognized_species: bool = Field(
        ...,
        description="False when the top prediction is the model's 'None of "
                    "the above' class -- i.e. the model itself doesn't think "
                    "this is any of Wilpattu's 15 known species, regardless "
                    "of its confidence level in that call. Check this BEFORE "
                    "is_confident to tell 'not a known species' apart from "
                    "'probably a known species, just not sure which one'.",
    )
    is_confident: bool = Field(
        ...,
        description="True only when is_recognized_species is True AND the "
                    "top prediction's confidence is at or above the "
                    "configured threshold. The model ALWAYS outputs some "
                    "class (closed-set classifier), so these two flags "
                    "together are the only signal that a result may be "
                    "unreliable -- e.g. an out-of-distribution animal, a "
                    "non-animal image, or a poor-quality photo.",
    )
    message: str = Field(
        ..., description="Human-readable summary, safe to show directly to end users."
    )
    top_prediction: SpeciesPrediction
    top_3: List[SpeciesPrediction] = Field(..., min_length=1, max_length=3)
    threshold_used: float = Field(..., description="Confidence threshold applied for this response")


class ErrorResponse(BaseModel):
    detail: str
