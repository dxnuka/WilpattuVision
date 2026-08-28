# WilpattuVision — Frontend

React + Vite frontend for WilpattuVision: an AI-powered wildlife identification
and information app for Wilpattu National Park, Sri Lanka. Structured against
the project's sequence diagram, ER/class diagram, use-case diagram, and page
wireframes.

## Stack

- **React 19 + Vite** — app shell and build tooling
- **Tailwind CSS v4** (`@tailwindcss/vite`) — earthy nature-themed design system
- **React Router v7** — client-side routing
- **Firebase** (Auth incl. Google OAuth, Firestore with offline persistence)
- **Cloudinary** — file storage (sighting/prediction/profile photos, species & conservation galleries) — see "Cloudinary setup" below for why this replaced Firebase Storage
- **Google Maps JavaScript API** (`@react-google-maps/api`) — primary interactive map
- **Leaflet + OpenStreetMap** — automatic offline fallback map (see "Offline support")
- **axios** — HTTP client for the FastAPI `/predict` call
- **vite-plugin-pwa** — installable PWA with offline caching
- **lucide-react** — icons

## Folder structure

```
src/
  components/
    layout/          Navbar (profile dropdown), Footer, MainLayout
    common/           PageLoader, ProtectedRoute
    identifier/       ImageUploader, PredictionResults (confidence UI, IUCN badge)
    map/               GoogleParkMap, LeafletOfflineMap, ParkMapView (swaps between them), MapLegend
    sightings/         SightingCard, SightingRow, SightingFilters
    forms/              SightingForm (GPS capture via Geolocation API)
  context/            AuthContext (email/password + Google OAuth, role, restricted flag)
  hooks/              useAuth, useGeolocation
  services/           predictService, sightingsService, noticesService, usersService
  lib/                firebase.js (SDK init), offlineMapTiles.js (tile pre-fetch for offline)
  data/               species.js (12 model classes), parkLocations.js (curated hotspots)
  pages/              Home, SpeciesEncyclopedia, SpeciesDetail, AIIdentifier, ParkMap,
                       Conservation, AddSighting, Submissions, Profile, Notices, Login, Signup
    admin/              SightingLogAdmin, SightingDetailAdmin, AdminUsers
  App.jsx             route definitions
  main.jsx            entry point (BrowserRouter + AuthProvider)
```

## Setup

```bash
npm install
cp .env.example .env   # fill in Firebase + Google Maps keys
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:8000` (see `vite.config.js`).

## Firebase setup

1. Create a Firebase project → Web app → copy the config into `.env`.
2. **Authentication** → enable Email/Password **and** Google sign-in methods.
3. **Firestore** — suggested collections:
   - `users/{uid}` — `{ email, displayName, role: "visitor"|"admin", restricted: boolean, createdAt }`
   - `sightings/{id}` — see the shape documented in `src/services/sightingsService.js`
     (field names — `u_id`, `sp_id`, `latitude`, `longitude`, `image`,
     `verificationStatus`, `verifiedAdminId`, `rejectionReason` — mirror the
     ER diagram's Sighting entity)
   - `notices/{id}` — `{ title, body, authorAdminId, createdAt }`
4. **File storage is Cloudinary, not Firebase Storage** — see "Cloudinary setup" below. (Firebase Storage now requires the Blaze billing plan even for free-tier usage as of Feb 2026; Cloudinary's free plan needs no card at all.)
5. Grant admin access by manually setting `role: "admin"` on a user's
   `users/{uid}` doc in the console — there's no self-service admin signup.
6. Restrict an account (per the use-case diagram's "Restrict accounts") by
   setting `restricted: true` on their `users/{uid}` doc, or use the
   in-app **Admin → Manage users** page.

Starting security rules (tighten before production):

```
match /users/{uid} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == uid
               || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
match /sightings/{id} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.resource.data.u_id == request.auth.uid;
  allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
match /notices/{id} {
  allow read: if request.auth != null;
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## Cloudinary setup

File storage (sighting photos, profile pictures, identification images,
species/conservation galleries) runs on Cloudinary, not Firebase Storage —
Firebase Storage started requiring the Blaze (pay-as-you-go) billing plan
for *any* usage, including free-tier, as of February 2026. Cloudinary's
free plan needs no card and comfortably covers a project this size
(25 credits/month, where 1 credit ≈ 1GB storage or bandwidth).

1. Sign up at [cloudinary.com](https://cloudinary.com) — Google/GitHub/email, free plan, no card.
2. Your **Cloud Name** is shown on the dashboard immediately after signup.
3. Create an **unsigned upload preset** (required so the browser can upload
   without exposing your API secret): Settings → Upload → "Add upload
   preset" → set **Signing Mode to "Unsigned"** → save, note its name.
4. Set both in `.env`:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```

Uploads happen via `src/lib/cloudinary.js` — a plain `fetch()` POST, no SDK
needed. Every service that stores a photo (`sightingsService`,
`predictionsService`, `usersService`, `galleryService`) uploads to
Cloudinary and stores just the resulting URL string in Firestore, exactly
as it did with Firebase Storage before — Firestore's document shapes are
unchanged.

**Species/conservation photo galleries** work differently than before:
since Cloudinary's free tier can't safely list a folder's contents from
browser code (that requires a signed Admin API call), image URLs are now
tracked in a `galleryImages` Firestore collection instead of relying on
Storage folder listing. Practically, this means: sign in as an admin, go to
a species or Conservation page, and use the **"+ Add photo"** tile that
appears in the gallery — no more manually uploading into a Storage console
and hoping the path convention matches.

**Note on deletion**: removing a profile picture or gallery image only
clears the reference (Firestore field / doc) — it does not delete the
underlying Cloudinary asset, since that requires a signed request your
frontend can't safely make with just the upload preset. Harmless at this
scale (unused assets just sit in your Cloudinary Media Library); add a
small backend endpoint later if real deletion becomes worth building.

## Google Maps setup

1. Google Cloud Console → enable the **Maps JavaScript API** for your project.
2. Create an API key, restrict it (HTTP referrer) to your dev/prod domains.
3. Set `VITE_GOOGLE_MAPS_API_KEY` in `.env`.

Without a key, the Park Map shows an explanatory placeholder instead of
failing silently.

## Connecting the FastAPI backend

`src/services/predictService.js` posts a `multipart/form-data` request with a
`file` field to `POST {VITE_API_BASE_URL}/predict`, matching the sequence
diagram's `alt [confidence >= 60%] / [confidence < 60%]` branch:

```json
// success (a real species, confidently identified)
{
  "is_recognized_species": true,
  "is_confident": true,
  "message": "Identified as Asian elephant with 99% confidence.",
  "top_prediction": { "species": "Asian elephant", "raw_label": "Asian_elephant", "confidence": 0.9932 },
  "top_3": [
    { "species": "Asian elephant", "raw_label": "Asian_elephant", "confidence": 0.9932 },
    { "species": "Water buffalo",  "raw_label": "Water_buffalo",  "confidence": 0.0017 },
    { "species": "Wild boar",      "raw_label": "Wild_boar",      "confidence": 0.0014 }
  ],
  "threshold_used": 0.7
}

// a real species, but below the confidence threshold
{ "is_recognized_species": true, "is_confident": false, "message": "Not confidently identified. Closest match was..." }

// the model's own "None of the above" class — not a known species at all
{ "is_recognized_species": false, "is_confident": false, "message": "This doesn't look like one of Wilpattu's known species..." }
```

The model has **16 classes**: 15 real species plus a `None_of_the_above`
rejection class, which is excluded from `src/data/species.js` (it's not a
species — see that file's header comment for the full label map and the
reasoning). `predictService.js` checks `is_recognized_species` *before*
`is_confident` and throws a distinct `NotRecognizedError` vs
`LowConfidenceError` accordingly — `AIIdentifier.jsx` renders each as a
visually different state rather than lumping them into one generic
failure. `raw_label` must match `rawLabel` in `species.js` exactly; update
that file if you retrain with a different label set.

## Offline support — why there are two maps

The requirement "previously cached map tiles remain accessible offline"
**cannot be satisfied with Google Maps tiles** — Google's Maps Platform
Terms of Service explicitly prohibit storing tile/imagery responses for
offline use. OpenStreetMap tiles, by contrast, are ODbL-licensed and
explicitly *permit* offline caching (with attribution, which the app
includes).

So the app runs a hybrid strategy, handled by `components/map/ParkMapView.jsx`:

- **Online** → `GoogleParkMap.jsx` (Google Maps JS API), matching the
  architecture diagram. Includes Google's built-in map type control
  (top-right dropdown) to switch to satellite/hybrid/terrain view.
- **Offline** (`navigator.onLine` false, or an `offline` event fires) →
  automatically swaps to `LeafletOfflineMap.jsx`, rendering OSM tiles served
  from the service worker's cache. Only the standard street-map style is
  available offline — free satellite tile providers don't offer the same
  offline-caching permissions OSM's ODbL license does.

For tiles to actually be in that cache before the user goes offline,
`ParkMapView` **automatically pre-fetches the park's tile set in the
background** the first time the map is viewed online (throttled to once
per 24h — see `lib/offlineMapTiles.js`), so offline mode has something
cached by default without the user needing to know to do anything. A
**"Save map for offline"** button next to the map also lets you trigger
this manually/immediately at any time.

Species/sighting *data* (not tiles) stays available offline separately, via
Firestore's `persistentLocalCache` (enabled in `lib/firebase.js`) — so the
Recent Sightings list and Species Encyclopedia keep working offline
regardless of which map is showing.

The user's live GPS position (`useGeolocation`) is shown on **both** maps —
GPS hardware on most devices works without a data connection, so this isn't
tied to online/offline state.

## Confidence threshold & withheld results

Per the sequence diagram, low-confidence predictions are never shown as a
guess. `AIIdentifier.jsx` renders three distinct states instead of one
generic failure: a successful identification, "not confidently identified"
(`LowConfidenceError` — it's probably one of the 15 species, just not sure
which), and "not one of Wilpattu's known species" (`NotRecognizedError` —
the model's own `None_of_the_above` class fired). See the API contract
above for exactly how these map to the backend's response fields.

## Firestore query design — avoiding composite indexes

Every list query in this app (`sightingsService`, `noticesService`,
`galleryService`) deliberately does **not** combine a `where()` filter with
`orderBy()` on a different field, even though that's a very natural way to
write "get X for this user, newest first." That combination requires a
Firestore composite index — normally not a big deal (Firestore's error
message includes a direct console link to create it), but easy to miss
during development, and every *new* filtered+sorted query needs its own
new index. The "could not load ... precondition" errors early in this
project's life were exactly this.

Instead, these queries fetch with a single equality filter only (which
Firestore auto-indexes, zero setup) and sort client-side in JS. At this
project's scale (a park's worth of sightings/notices/gallery images, not
millions of rows) the extra client-side sort is free in practice, and it
means adding a new filtered query never requires an index-creation step.
If you outgrow this (very large collections, need to sort THEN paginate
server-side with `startAfter`), that's the point to revisit and add the
proper composite indexes back in.

## A couple of spec ambiguities, resolved as follows

- The requirements list "a photograph" once and "photographs" (plural) once
  for sighting submission — resolved in favor of the plural reading:
  sightings support **up to 5 photos** (`MultiImageUploader.jsx`, stored as
  an `images: string[]` array), which differs from the ER diagram's
  single `image` field on the Sighting entity.
- "Notify users" / "View notices" (use-case diagram) was originally a
  single broadcast collection; now supports both broadcast (`recipientUid:
  'all'`) and per-user targeted notices, plus read-tracking — see
  `noticesService.js`.

## Still to build

- Wire the Home/Map "View on Map" buttons to actually open the relevant
  marker's InfoWindow (currently pans/zooms only).
- Code-splitting — the production bundle is ~1.3MB gzip due to
  Firebase + Google Maps + Leaflet all loading upfront; consider
  `React.lazy` for `ParkMap` and `AIIdentifier` if load time matters for
  your evaluation.
