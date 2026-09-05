# Workout Log

A simple, fast workout tracker for strength training and cardio. One HTML
page plus one serverless function — with optional cloud sync so data lasts
for years and follows you across devices.

## Features

- **Quick logging** — strength (exercise, sets of weight × reps) and cardio
  (activity, time as min:sec, optional distance). Exercise names autocomplete
  from your history.
- **Bodyweight and assisted work** — each exercise is logged as *Weighted*,
  *Bodyweight* (reps, plus any added weight) or *Assisted* (the weight on the
  assist stack). The mode is remembered from your history, or guessed from the
  name for a new exercise. Set your bodyweight once (shown on the Log tab for
  those modes) and bodyweight and assisted sets get est. 1RM, volume and PRs
  like everything else; without it they are tracked by reps.
- **Cardio units that fit the machine** — distance can be miles, km, metres,
  steps or floors, remembered per activity (stair climbers default to steps,
  rowers to metres).
- **Progressive overload** — when you type an exercise, the app shows what you
  did last time and a concrete target to beat (more reps until ~8, then add
  weight, or take weight off the assist stack). Sets start blank with last
  time's numbers as placeholders; one tap fills in last time's sets. New
  estimated-1RM (or rep) bests are flagged as PRs.
- **Rest timer** — starts when you tick a set; keeps the screen awake while it
  runs and ends with a loud three-chirp alarm (mutable with the bell button).
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
- Read-only access to the latest synced data is also available with the code
  in the URL: `GET /api/data?code=<sync code>`. This lets tools that can only
  fetch a plain URL (an AI assistant, a browser tab) read the data without an
  Authorization header. Writes still require the bearer token.

## Files

- `index.html` — the whole app
- `netlify/functions/data.mjs` — the sync API (Netlify Function + Blobs)
- `netlify.toml`, `package.json` — Netlify project config
- `dev-server.mjs` — local dev harness: serves the app and runs the real
  function against a local Blobs server (`npm i && node dev-server.mjs`,
  then open http://localhost:8888)

## Deploying

Netlify deploys this repo from `main` (project `liams-workout-log`,
https://liams-workout-log.netlify.app). `netlify.toml` copies the static files
into `public/` and deploys `netlify/functions/`. Every push to `main` is a
production deploy.

## Notes

- The lb/kg toggle changes labels only; existing numbers are not converted.
- Estimated 1RM uses the Epley formula: `weight × (1 + reps / 30)`. For
  bodyweight and assisted entries the weight used is `bodyweight + w`.

## Data shape

Strength entries are `{ type: "strength", date, name, sets: [{ w, r }], pr,
mode, rests? }`. `mode` is `"weighted"`, `"bw"` for bodyweight (`w` is the
added weight, usually 0) or `"assist"` for assisted machines (`w` is
negative: `-60` means 60 on the assist stack). Entries logged before `mode`
existed have none; they are read as assisted when the name contains "assist",
as bodyweight when every set was logged at 1 or less (the old workaround), and
as weighted otherwise.

Cardio entries are `{ type: "cardio", date, name, min, dist, du? }`. `min` is
decimal minutes (25.5 is 25:30). `du` is the distance unit: `mi`, `km`, `m`,
`steps` or `floors`; when absent the app's unit applies, except older stair
climber entries with a large distance, which are read as steps.

The top level also carries `unit` and an optional `bodyweight`.

## Claude skill

`.claude/skills/workout-progress/` teaches Claude Code how to fetch data from
the sync API and analyze it. Set `WORKOUT_SYNC_CODE` in the environment (never
commit it) and ask about your progress or goals in any session that has this
repo open.
