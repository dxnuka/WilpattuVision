# WilpattuVision

WilpattuVision is a full-stack web application for wildlife identification, sighting documentation, and conservation awareness centered on **Wilpattu National Park, Sri Lanka**. It combines a machine-learning-powered species identifier with a community-driven wildlife sightings platform.

🔗 **Live app:** https://wilpattuvisionfrontend.vercel.app
🔗 **Backend API docs:** https://wilpattuvision-production.up.railway.app/docs

---

## Features

- 🔍 **AI species identification** — upload a photo and get a species prediction from a fine-tuned EfficientNetB3 model, trained on 16 species native to the park (e.g. Sri Lankan leopard, Asian elephant, sloth bear, mugger crocodile).
- 📴 **Offline identification** — a quantized TensorFlow.js version of the model runs fully on-device via the installable Progressive Web App, for use in areas with little or no network coverage.
- 🐾 **Community sightings** — logged-in users can submit sightings with photos, location, and species tags; submissions are reviewed by admins before appearing on the public feed and map.
- 🗺️ **Interactive park map** — verified sightings and park hotspots plotted via Google Maps.
- 📰 **Conservation content** — admin-published articles, gallery, and notices.
- 🔐 **Role-based access** — Firebase Authentication with an admin role for content moderation and user management.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router |
| Backend | FastAPI, TensorFlow / Keras |
| ML | EfficientNetB3 (server-side), TensorFlow.js graph model (offline, uint8-quantized) |
| Data & Auth | Firebase (Firestore, Authentication) |
| Hosting | Vercel (frontend), Railway (backend, Docker) |
| Maps / Media | Google Maps API, Cloudinary |

## Repository structure

```
WilpattuVision/
├── Backend/          FastAPI ML backend — see Backend/README.md
├── Frontend/          React (Vite) web app
├── .github/workflows/ Scheduled backend keep-warm ping
└── README.md          This file
```

## Getting started

### Backend

See [`Backend/README.md`](./Backend/README.md) for setup, environment variables, and deployment details.

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env   # fill in Firebase, Maps, Cloudinary, and API base URL
npm run dev
```

Required environment variables (see `.env.example`):

- `VITE_API_BASE_URL` — backend API URL
- `VITE_FIREBASE_*` — Firebase project config
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`

## Deployment

- **Frontend** is deployed to [Vercel](https://vercel.com) via the Vercel CLI. Environment variables are configured in the Vercel dashboard rather than committed to source.
- **Backend** is deployed to [Railway](https://railway.app) as a Docker container, auto-deploying from this repository's `main` branch.
- **Firestore Security Rules** (`firestore.rules` ) govern data access and must be published via the Firebase Console after any changes.
- A scheduled **GitHub Actions** workflow (`.github/workflows/keep-warm.yml`) pings the backend's `/health` endpoint periodically.

