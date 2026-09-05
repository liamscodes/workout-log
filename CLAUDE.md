# Workout Log (Gym App)

Liam's personal workout tracker: a single-file PWA plus a Netlify Function
for cross-device sync. This repo is the only source of truth. It used to live
in `workout/` of `liamscodes/liamscodes.github.io`; that folder is now just a
redirect here.

## Layout

- `index.html` is the whole app (vanilla JS, no build step). `sw.js` and
  `manifest.webmanifest` make it installable on iPhone.
- `netlify/functions/data.mjs` is the sync API at `/api/data`, backed by
  Netlify Blobs. GET reads, POST merges by entry id with tombstones. The sync
  code is the only credential: `Authorization: Bearer <code>`, or for GET only
  `?code=<code>`. Data is stored under the SHA-256 of the code.
- `README.md` has the feature list, data shape, and API details.
- `.claude/skills/workout-progress/` fetches Liam's real data from the API and
  analyzes progress. It needs `WORKOUT_SYNC_CODE` in the environment.

## Deploys

- Netlify project `liams-workout-log` (https://liams-workout-log.netlify.app)
  deploys from `main`, repo root, using `netlify.toml`. **Every push to `main`
  is a production deploy** of the app and the sync function, and Liam's phone
  runs the deployed app.
- Nothing else deploys this code. Do not sync files to or from other repos.

## Working here

- Liam works from Claude Code on the web and wants changes committed and
  pushed straight to `main`, not via pull requests, unless he says otherwise.
- Never print, log, or commit the sync code. Read `WORKOUT_SYNC_CODE` from the
  environment, or ask once and do not echo it back.
- Local dev: `npm i && node dev-server.mjs`, then open http://localhost:8888.
  It runs the real function against a local Blobs server.
- Run `node --check` on any `.mjs` you touch before pushing. There is no test
  suite, so also load `index.html` in the dev server and click through the
  screen you changed.
- Keep `index.html` a single file with no build step. Match the existing
  style: 2-space indent, plain JS, mobile-first CSS, light and dark mode.
