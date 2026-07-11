# Workout Log

A simple, fast workout tracker for strength training and cardio. Single HTML
file, no dependencies, no account — your data stays on your device
(browser localStorage).

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
- **Backup** — export/import your data as JSON.
- **Mobile-first** — big touch targets, bottom tab bar, light & dark mode.

## Use it

Open `index.html` in any browser. To use it on your phone, host it anywhere
static (the easiest is GitHub Pages: repo Settings → Pages → deploy from the
`main` branch), then open the URL on your phone and "Add to Home Screen".

Data is stored per-browser, per-device. Use **Export data** (History tab) to
back up or move between devices.

## Notes

- The lb/kg toggle changes labels only; existing numbers are not converted.
- Estimated 1RM uses the Epley formula: `weight × (1 + reps / 30)`.
