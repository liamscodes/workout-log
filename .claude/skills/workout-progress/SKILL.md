---
name: workout-progress
description: Fetch Liam's real workout data from the Workout Log sync API and analyze progress, PRs, volume, consistency, and goals. Use whenever Liam asks about his lifting or cardio progress, wants a summary of recent workouts, asks what to do next session, or wants to set or check strength goals.
---

# Workout progress

Liam's workout data lives server-side in Netlify Blobs behind the app's sync
API. The sync code is the only credential. Never print it, commit it, or
echo it into a log.

## Fetch the data

The API always returns the latest synced state, so there is never a need to
ask Liam to export anything. You need his sync code (the one set on his phone
in the app's History tab). If `WORKOUT_SYNC_CODE` is set in the environment
use it; otherwise ask Liam for it once and use it for the rest of the session
without repeating it back.

Either form works. The URL form exists for tools that can only fetch a plain
URL (web fetch in a chat session); use the header form when you can run
commands.

```bash
# header form
curl -sS -H "Authorization: Bearer $WORKOUT_SYNC_CODE" \
  https://liams-workout-log.netlify.app/api/data > workouts.json

# URL form (read-only)
https://liams-workout-log.netlify.app/api/data?code=<sync code>
```

A `401` means the code is missing or under six characters. An empty
`entries` array with a valid code means the code is wrong (the server keys
data by the SHA-256 of the code, so a typo looks like a fresh account).

If the network blocks `netlify.app` (some Claude Code remote environments do),
say so plainly and ask Liam to either allow that host in the environment's
network policy or share the JSON from **Export data** on the History tab; it
has the same shape.

## Data shape

```json
{
  "unit": "lb",
  "entries": [
    { "id": "…", "type": "strength", "date": "2026-09-01", "name": "Chest Press",
      "sets": [ { "w": 120, "r": 10 }, { "w": 120, "r": 8 } ],
      "pr": false, "rests": [90, 95] },
    { "id": "…", "type": "cardio", "date": "2026-09-02", "name": "Treadmill",
      "min": 25, "dist": 2.1 }
  ],
  "deleted": [ "…ids of removed entries…" ]
}
```

- `date` is ISO `YYYY-MM-DD`, local to Liam. Entries are sorted by date.
- `unit` is a label only; numbers are never converted. Report in `unit`.
- `pr` is set at save time when the entry's best estimated 1RM beat all prior
  history for that exercise. Recompute PRs yourself rather than trusting it
  if entries were edited or imported.
- `rests` (optional) is seconds of rest recorded before each set.
- `dist` is null when not logged. Unit is whatever Liam typed (miles unless
  said otherwise).
- Ignore `deleted`; it is a tombstone list for sync merging.

## Analysis conventions

Match the app so numbers agree with what Liam sees on his phone:

- Estimated 1RM uses Epley: `w * (1 + r / 30)`. Best set of a session is the
  set with the highest e1RM.
- Session volume is `sum(w * r)` over sets.
- Progressive overload target: if last session's top set was under ~8 reps,
  target the same weight for more reps; at 8 or more reps, add weight (5 lb
  upper body, 10 lb lower body / machines) and drop back to ~6 reps.
- Week boundaries are Monday to Sunday. "Days this week" counts distinct
  dates with any entry.
- Exercise names are free text. Normalize case and trailing whitespace before
  grouping, and mention any near-duplicates you notice (for example
  "Lat Pulldown" vs "Lat pull down") so Liam can clean them up.

## What to produce

For a progress check, lead with the headline (trend on the main lifts, any
PRs since last check, consistency this week vs the last four), then a short
per-exercise table: best e1RM, latest top set, change since first session.
Keep cardio to weekly minutes and any distance trend.

For goal setting, propose targets as a concrete top set (weight × reps) with a
date, derived from the current e1RM and a realistic rate of gain for a
trained beginner to intermediate (roughly 2 to 5 percent e1RM per month on
compound machines, slower on isolation work). Explain the reasoning in one
line each. Goals can be tracked with Forfeit if Liam wants stakes; the
`forfeit-goals` skill covers that.
