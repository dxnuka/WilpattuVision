# WilpattuVision Backend

FastAPI backend for the WilpattuVision species identifier (Wilpattu National Park, Sri Lanka). Loads a trained Keras model and serves species predictions over a REST API.

## Project layout

```
Backend/
├── app/
│   ├── main.py            FastAPI app, routes, startup/shutdown lifespan
│   ├── config.py          Central configuration (model path, thresholds, etc.)
│   ├── model_service.py   Loads the Keras model and runs inference
│   └── schemas.py         Pydantic request/response models
├── models/
│   ├── wilpattu_species_model.keras   Trained model (EfficientNetB3-based)
│   └── label_map.json                 Class index → species name mapping
├── tests/                  Pytest test suite
├── Dockerfile
├── requirements.txt
└── firestore.rules         Firestore security rules for the project's Firebase data
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/docs` | Interactive Swagger UI |
| POST | `/predict` | Upload an image (multipart), get species predictions |

## Model

- **Architecture:** EfficientNetB3 backbone, fine-tuned for 16 species found in Wilpattu National Park.
- **Input:** 300×300 RGB images.
- **Output:** Top-3 predicted species with confidence scores. Predictions below `CONFIDENCE_THRESHOLD` (default `0.70`) are flagged as low-confidence; a 17th "None of the above" class handles non-matching images.

## Running locally

```bash
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to try the API interactively.

## Configuration

Environment variables (see `app/config.py` for defaults):

| Variable | Default | Description |
|---|---|---|
| `MODEL_PATH` | `models/wilpattu_species_model.keras` | Path to the Keras model file |
| `LABEL_MAP_PATH` | `models/label_map.json` | Path to the class label map |
| `CONFIDENCE_THRESHOLD` | `0.70` | Minimum confidence to treat a prediction as reliable |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` (10MB) | Max accepted upload size |

## Deployment (Railway)

This backend is deployed as a Docker container on [Railway](https://railway.app):

1. Railway is connected to this GitHub repository and auto-deploys on every push to `main`.
2. **Root Directory** is set to `Backend` in Railway's service settings, since this backend lives in a subfolder alongside the frontend.
3. Railway injects a dynamic `$PORT`, which the Dockerfile's `CMD` reads at runtime — no fixed port is hardcoded.
4. The trained model (~47MB) is committed as a regular Git blob (not Git LFS), since Railway's build environment does not resolve LFS pointers.
5. A public domain is generated under Railway's **Settings → Networking**, and a scheduled GitHub Actions workflow (`.github/workflows/keep-warm.yml` at the repo root) pings `/health` periodically to help keep the service responsive.

### Building the Docker image manually

```bash
docker build -t wilpattuvision-backend .
docker run -p 8000:8000 -e PORT=8000 wilpattuvision-backend
```

## Tests

```bash
pytest
```
