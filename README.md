# Workout Log

A simple, fast workout tracker for strength training and cardio. One HTML
page plus one serverless function — with optional cloud sync so data lasts
for years and follows you across devices.

## Features

- **Quick logging** — strength (exercise, sets of weight × reps) and cardio
  (activity, minutes, optional distance). Exercise names autocomplete from
  your history.
- **Progressive overload** — when you type an exercise, the app shows what you
  did last time and a concrete target to beat (more reps until ~8, then add
  weight). One tap copies your last workout into the form. New estimated-1RM
  bests are flagged as PRs.
- **Metrics** — per-exercise estimated 1RM trend chart (Epley formula), best
  1RM, latest top set, session volume, and change since your first session;
  weekly cardio minutes chart; days-this-week / week-streak / total-days tiles.
- **History** — all workouts grouped by day, with delete.
- **Cloud sync** — set a sync code (History tab) and your data is stored
  server-side in Netlify Blobs. The same code on any device shows the same
  workouts. Without a code the app works fully offline with localStorage.
- **Backup** — export/import your data as JSON.
- **Mobile-first** — big touch targets, bottom tab bar, light & dark mode.

## How sync works

- The app POSTs its full local state to `/api/data` with the sync code as a
  bearer token; the function stores each user's data in a Netlify Blobs store
  keyed by the SHA-256 of the code.
- The server merges by entry ID with deletion tombstones, so two devices can
  log independently and never clobber each other; the merged result is
  returned and replaces local state.
- Sync runs after every change (debounced), on app open, when the tab becomes
  visible, and when the browser comes back online. If the server is
  unreachable, changes stay local and sync on the next opportunity.
- The sync code is the only credential — treat it like a password.

## Files

- `index.html` — the whole app (also served by GitHub Pages at /workout/)
- `netlify/functions/data.mjs` — the sync API (Netlify Function + Blobs)
- `netlify.toml`, `package.json` — Netlify project config
- `dev-server.mjs` — local dev harness: serves the app and runs the real
  function against a local Blobs server (`npm i && node dev-server.mjs`,
  then open http://localhost:8888)

## Deploying

The Netlify site deploys from a folder laid out as `public/index.html` +
`netlify/functions/` + `netlify.toml`. The `__NETLIFY_SITE__` placeholder in
`index.html` must be replaced with the deployed hostname so copies hosted
elsewhere (like GitHub Pages) can reach the API cross-origin.

## Notes

- The lb/kg toggle changes labels only; existing numbers are not converted.
- Estimated 1RM uses the Epley formula: `weight × (1 + reps / 30)`.
