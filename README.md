# Ride Lab

Community platform for 3D-printable electric scooter parts — models, print profiles and guides.

Static single-page site served by a zero-dependency Node server, ready to deploy on Railway.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole site — markup, styles and script inlined, no build step |
| `server.js` | Static file server, no npm dependencies |
| `package.json` | `npm start` → `node server.js` |
| `railway.json` | Railway build/deploy config, health check on `/healthz` |

## Run locally

```bash
npm start
# http://localhost:3000
```

Node 18 or newer. Nothing to install — there are no dependencies.

## Deploy on Railway

1. Push this folder to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** → pick this repo.
3. Nixpacks detects `package.json` and runs `npm start`. No variables needed — Railway supplies `PORT`.
4. **Settings → Networking → Generate Domain** for a public URL.

## Design notes

Dark ground with a single amber accent (`#F4C430`). Barlow Condensed italic for display, IBM Plex Sans for body, IBM Plex Mono for specs and labels, Caveat for the hero annotation. The hero landscape and every part illustration are inline SVG, so the page ships as one file with no image requests.

Model cards carry the fields that make a printable part actually usable: material, layer height, infill, print time, and the scooter the part was measured against.
