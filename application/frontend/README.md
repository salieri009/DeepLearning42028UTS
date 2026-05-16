# CrowdNav Frontend

React + Vite browser client for the CrowdNav crowd-detection system.

UI/design refactor guide: [`DESIGN.md`](./DESIGN.md)

## Requirements

- Node.js 20+
- The [CrowdNav Java API](../backend/README.md) running on `http://localhost:8080`

## Setup

```bash
cd application/frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` by default.

## How it works

1. Click **Start Detection** — the browser requests webcam access.
2. The app captures a JPEG frame every 500 ms and POSTs it to `POST http://localhost:8080/api/v1/analyze-frame` as `{ "frame_base64": "..." }`.
3. The backend response is rendered live:
   - **People** — number of detected persons
   - **Crowd Density** — `crowd_density` field (`low` / `medium` / `high`)
   - **Max Proximity Risk** — `max_proximity_risk` field
   - **Recommendation** — plain-text guidance from `recommendation` field
   - **Bounding boxes** — lime-green overlays positioned using the normalised YOLO `bbox` (`x_center`, `y_center`, `width`, `height`) returned for each person
4. Click **Stop** to halt capture and release the camera.

## Backend API contract

`POST /api/v1/analyze-frame` — accepts `application/json` with optional `frame_base64` or `multipart/form-data` with optional `image` part. Returns:

```json
{
  "persons": [
    { "class": "person", "confidence": 0.95, "bbox": { "x_center": 0.5, "y_center": 0.5, "width": 0.1, "height": 0.2 } }
  ],
  "crowd_density": "low",
  "max_proximity_risk": "none",
  "recommendation": "Area is safe. No action required."
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
