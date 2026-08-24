"""
Tests for the WilpattuVision FastAPI backend.

Organized to mirror the original requirements:
    1. POST /predict accepts an image upload
    2. Preprocessing + inference runs correctly
    3. Returns top-3 predictions with confidence scores
    4. Low-confidence top prediction is flagged, not asserted as fact
    5. Errors (non-image, corrupted, empty, oversized) are handled gracefully
    6. (deployment — not unit-testable, covered by README + manual smoke test)
    7. "None of the above" top predictions are flagged distinctly from a
       low-confidence real-species guess (is_recognized_species)

Run with:  pytest tests/ -v
"""
import io

from app import config


# ---------------------------------------------------------------------------
# 0. Health / startup
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_returns_ok_when_model_loaded(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["model_ready"] is True
        assert body["num_classes"] == 16

    def test_health_reports_current_threshold(self, client):
        resp = client.get("/health")
        assert resp.json()["confidence_threshold"] == config.CONFIDENCE_THRESHOLD


# ---------------------------------------------------------------------------
# 1 & 2. Accepts upload, preprocesses, runs inference
# ---------------------------------------------------------------------------

class TestPredictBasicFlow:
    def test_accepts_jpeg_upload(self, client, valid_jpeg_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        assert resp.status_code == 200

    def test_accepts_png_upload(self, client, valid_png_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("animal.png", io.BytesIO(valid_png_bytes), "image/png")},
        )
        assert resp.status_code == 200

    def test_handles_non_rgb_input_via_conversion(self, client, grayscale_jpeg_bytes):
        """
        Grayscale images must not crash inference — model_service converts
        to RGB before the model sees them. This is the kind of input a
        camera-trap photo or an old phone photo could plausibly produce.
        """
        resp = client.post(
            "/predict",
            files={"file": ("gray.jpg", io.BytesIO(grayscale_jpeg_bytes), "image/jpeg")},
        )
        assert resp.status_code == 200

    def test_arbitrary_input_size_is_resized_correctly(self, client):
        """
        Requirement #2: preprocessing must resize to 300x300 regardless
        of the uploaded image's original dimensions. We don't inspect the
        resize directly (that's an implementation detail) — instead we
        confirm a non-300x300 image still produces a valid response,
        which would fail loudly if resize were broken or skipped.
        """
        from tests.conftest import _make_image_bytes
        odd_size_bytes = _make_image_bytes(width=1024, height=77, fmt="JPEG")
        resp = client.post(
            "/predict",
            files={"file": ("odd.jpg", io.BytesIO(odd_size_bytes), "image/jpeg")},
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# 3. Top-3 predictions with confidence scores
# ---------------------------------------------------------------------------

class TestTopKResponse:
    def test_returns_exactly_three_predictions(self, client, valid_jpeg_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        body = resp.json()
        assert len(body["top_3"]) == 3

    def test_predictions_sorted_descending_by_confidence(self, client, valid_jpeg_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        confidences = [p["confidence"] for p in resp.json()["top_3"]]
        assert confidences == sorted(confidences, reverse=True)

    def test_top_prediction_matches_first_of_top_3(self, client, valid_jpeg_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        body = resp.json()
        assert body["top_prediction"] == body["top_3"][0]

    def test_confidences_are_valid_probabilities(self, client, valid_jpeg_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        for p in resp.json()["top_3"]:
            assert 0.0 <= p["confidence"] <= 1.0

    def test_species_names_are_human_readable(self, client, valid_jpeg_bytes):
        """species should have underscores replaced with spaces; raw_label keeps them."""
        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        for p in resp.json()["top_3"]:
            assert "_" not in p["species"]
            assert p["raw_label"].replace("_", " ") == p["species"] or "-" in p["raw_label"]


# ---------------------------------------------------------------------------
# 4. Confidence threshold behavior — the core uncertainty-communication requirement
# ---------------------------------------------------------------------------

class TestConfidenceThreshold:
    def test_low_confidence_sets_is_confident_false(self, client, valid_jpeg_bytes):
        """
        The untrained test-fixture model produces near-uniform, low-confidence
        softmax output (~1/16 per class) on random noise input, which is
        below any reasonable threshold. This is exactly the scenario
        requirement #4 cares about: the model still forces *a* prediction,
        but the API must say so isn't confident rather than asserting it.
        """
        resp = client.post(
            "/predict",
            files={"file": ("noise.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        body = resp.json()
        assert body["top_prediction"]["confidence"] < config.CONFIDENCE_THRESHOLD
        assert body["is_confident"] is False

    def test_low_confidence_message_does_not_assert_identification(self, client, valid_jpeg_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("noise.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        message = resp.json()["message"].lower()
        assert "not confidently identified" in message

    def test_threshold_used_is_echoed_in_response(self, client, valid_jpeg_bytes):
        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        assert resp.json()["threshold_used"] == config.CONFIDENCE_THRESHOLD

    def test_confident_message_format_when_above_threshold(self, client, monkeypatch, valid_jpeg_bytes):
        """
        Monkeypatches predict_top_k to return a real species with high
        confidence -- deterministic, and avoids relying on the untrained
        fixture model's random argmax possibly landing on the "None of
        the above" class by chance (1/16 classes), which would make
        is_confident False regardless of threshold under the branching
        in main.py (see TestNoneOfAboveHandling).
        """
        from app import model_service as model_service_module

        fake_top_k = [
            ("Sri_Lankan_leopard", "Sri Lankan leopard", 0.91),
            ("Fishing_cat", "Fishing cat", 0.05),
            ("Golden_jackal", "Golden jackal", 0.02),
        ]
        monkeypatch.setattr(
            model_service_module.model_service, "predict_top_k", lambda *a, **k: fake_top_k
        )
        monkeypatch.setattr(config, "CONFIDENCE_THRESHOLD", 0.0)

        resp = client.post(
            "/predict",
            files={"file": ("animal.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        body = resp.json()
        assert body["is_confident"] is True
        assert body["is_recognized_species"] is True
        assert "identified as" in body["message"].lower()


# ---------------------------------------------------------------------------
# 7. "None of the above" handling -- distinct from a low-confidence guess
# ---------------------------------------------------------------------------

class TestNoneOfAboveHandling:
    """
    'None of the above' is a real 16th class (see conftest.TEST_LABELS),
    but the untrained fixture model's predictions aren't controllable
    enough to reliably land on one specific class -- so these tests
    monkeypatch predict_top_k directly to exercise main.py's response
    branching in isolation, the same way TestConfidenceThreshold already
    treats "does inference produce a low-confidence result" as separately
    tested plumbing.
    """

    def test_none_of_above_top_prediction_is_not_recognized(self, client, monkeypatch, valid_jpeg_bytes):
        from app import model_service as model_service_module

        fake_top_k = [
            ("None_of_the_above", "None of the above", 0.71),
            ("Sri_Lankan_leopard", "Sri Lankan leopard", 0.14),
            ("Golden_jackal", "Golden jackal", 0.09),
        ]
        monkeypatch.setattr(
            model_service_module.model_service, "predict_top_k", lambda *a, **k: fake_top_k
        )

        resp = client.post(
            "/predict",
            files={"file": ("outsider.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        body = resp.json()
        assert body["is_recognized_species"] is False
        assert body["is_confident"] is False
        assert "known species" in body["message"].lower()
        assert body["top_prediction"]["species"] == "None of the above"

    def test_recognized_species_below_threshold_differs_from_none_of_above(
        self, client, monkeypatch, valid_jpeg_bytes
    ):
        """
        A real species guessed with low confidence is a DIFFERENT outcome
        from the model actively predicting 'None of the above' -- the
        response must distinguish them (is_recognized_species True vs
        False), not collapse both into the same is_confident=False message.
        """
        from app import model_service as model_service_module

        fake_top_k = [
            ("Fishing_cat", "Fishing cat", 0.55),
            ("Golden_jackal", "Golden jackal", 0.20),
            ("None_of_the_above", "None of the above", 0.10),
        ]
        monkeypatch.setattr(
            model_service_module.model_service, "predict_top_k", lambda *a, **k: fake_top_k
        )

        resp = client.post(
            "/predict",
            files={"file": ("blurry.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        body = resp.json()
        assert body["is_recognized_species"] is True
        assert body["is_confident"] is False
        assert "not confidently identified" in body["message"].lower()

    def test_none_of_above_above_threshold_is_not_marked_confident(
        self, client, monkeypatch, valid_jpeg_bytes
    ):
        """
        is_confident means 'confident about a specific species'. A
        high-confidence 'None of the above' call is still is_confident=False
        -- there's no species identification to be confident about, however
        sure the model is that it's an outsider.
        """
        from app import model_service as model_service_module

        fake_top_k = [
            ("None_of_the_above", "None of the above", 0.95),
            ("Wild_boar", "Wild boar", 0.03),
            ("Water_buffalo", "Water buffalo", 0.01),
        ]
        monkeypatch.setattr(
            model_service_module.model_service, "predict_top_k", lambda *a, **k: fake_top_k
        )

        resp = client.post(
            "/predict",
            files={"file": ("outsider.jpg", io.BytesIO(valid_jpeg_bytes), "image/jpeg")},
        )
        body = resp.json()
        assert body["is_recognized_species"] is False
        assert body["is_confident"] is False


# ---------------------------------------------------------------------------
# 5. Graceful error handling
# ---------------------------------------------------------------------------

class TestErrorHandling:
    def test_rejects_non_image_content_type(self, client):
        resp = client.post(
            "/predict",
            files={"file": ("notes.txt", io.BytesIO(b"just some text"), "text/plain")},
        )
        assert resp.status_code == 400
        assert "content type" in resp.json()["detail"].lower()

    def test_rejects_empty_file(self, client):
        resp = client.post(
            "/predict",
            files={"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")},
        )
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()

    def test_rejects_corrupted_image_bytes(self, client):
        """
        Bytes that claim to be a JPEG (correct content-type header) but
        aren't valid image data — simulates a corrupted/truncated upload,
        which content-type checking alone can't catch.
        """
        garbage = b"\xff\xd8\xff\xe0" + b"not actually a complete jpeg"
        resp = client.post(
            "/predict",
            files={"file": ("corrupt.jpg", io.BytesIO(garbage), "image/jpeg")},
        )
        assert resp.status_code == 400

    def test_rejects_oversized_file(self, client, monkeypatch):
        monkeypatch.setattr(config, "MAX_UPLOAD_SIZE_BYTES", 100)  # 100 bytes, trivially small
        from tests.conftest import _make_image_bytes
        big_image = _make_image_bytes(width=200, height=200, fmt="PNG")
        resp = client.post(
            "/predict",
            files={"file": ("big.png", io.BytesIO(big_image), "image/png")},
        )
        assert resp.status_code == 400
        assert "too large" in resp.json()["detail"].lower()

    def test_missing_file_field_returns_422(self, client):
        resp = client.post("/predict")
        assert resp.status_code == 422

    def test_error_responses_never_include_stack_traces(self, client):
        """
        Sanity check that internal error details aren't leaked to the
        client — important since this API will be public-facing on Render.
        """
        garbage = b"\xff\xd8\xff\xe0" + b"not actually a complete jpeg"
        resp = client.post(
            "/predict",
            files={"file": ("corrupt.jpg", io.BytesIO(garbage), "image/jpeg")},
        )
        detail = resp.json()["detail"]
        assert "Traceback" not in detail
        assert "File \"" not in detail
