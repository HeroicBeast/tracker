# College Attendance Tracker

A single-user attendance tracker, built as an installable PWA for GitHub Pages. Static frontend only — no backend, no accounts, no sync. Every subject, timetable slot, attendance record, and audit-log entry lives in your browser's IndexedDB, on-device.

## Tech stack

- **React 19 + TypeScript + Vite 8**
- **Tailwind CSS v4** (CSS-first `@theme` config, no `tailwind.config.js`)
- **Dexie.js** over IndexedDB, with `dexie-react-hooks`' `useLiveQuery` for reactive reads — any component reading from the DB re-renders automatically when any other component writes to it, so there's no manual state syncing anywhere in the app
- **Recharts** for the attendance trend chart (lazy-loaded, see below)
- **lucide-react** for icons
- **vite-plugin-pwa** for the manifest + Workbox service worker
- Self-hosted variable fonts (`@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`) — no external font CDN, so the app doesn't depend on network access to render correctly offline

No router: navigation is plain React state (`src/types.ts` → `View`), not URL-based. On GitHub Pages, a client-side router needs a 404.html rewrite trick to survive a hard refresh on a sub-route; a state-based single-page app sidesteps that entirely, which matters more here than usual since this is meant to be opened offline as an installed PWA.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # type-checks (tsc --noEmit), then builds to dist/
npm run preview   # serve the production build locally
```

## Deploying to GitHub Pages

1. Push this project to a new GitHub repository.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically.

`vite.config.ts` uses `base: './'` (relative paths), so the build works whether it ends up at `https://<user>.github.io/` or `https://<user>.github.io/<repo-name>/` — you don't need to edit anything to match your repo name.

## How data persistence works

Everything — subjects, timetable, attendance records, audit log — is stored in **IndexedDB via Dexie**, scoped to the browser/device you're using. There is no server and nothing is ever sent over the network by the app itself.

Consequences worth knowing:
- **No sync.** Your phone and your laptop will have two independent copies. This was requested intentionally, not a limitation I missed.
- **Clearing site data wipes everything**, audit log included — the audit log lives in the *same* IndexedDB store, so it protects you from in-app mistakes (an accidental edit or delete) but **not** from a cleared cache or reset browser. That's a real gap between what the audit log can do and what "safety net for the cache-only approach" implies, so I added a JSON export/import under the **More** tab as the actual mitigation. It's not in the original spec — flagging it as an addition, not an assumption. Delete it from `MorePage.tsx` if you don't want it.
- Fresh semester = delete last semester's subjects, add new ones. No archiving was requested, so there isn't a separate "reset" feature — deleting is the reset.

## Feature walkthrough

- **Today** — today's scheduled classes (from the timetable), one tap to mark present/absent. If a subject has more than one session on the same day, they're grouped into a single card here (see "Assumptions" below) rather than shown as duplicates.
- **Dashboard** — a card per subject: attendance ring, present/total, leave budget, and a live "safe to bunk" figure. Tap a card for the full subject view (history chart, every entry, edit/delete). Subjects are added/deleted from here.
- **Mark** — two independent flows in one place:
  - *Single entry*: any subject, any date (past, today, or future-dated correction).
  - *Bulk add*: **Dated range** (pick a start/end date and which weekdays count as class days — e.g. only Mon/Wed/Fri — then mark that whole batch present or absent in one go) or **Undated count** (just a present/absent count with no class date, timestamped only by when you added it).
- **Timetable** — your weekly template. It only feeds the Today tab's shortcut list; it never auto-marks attendance. The grid's visible hours auto-fit to your earliest/latest class ± 1 hour of padding. Renders as a proportional calendar grid on tablet/desktop and a per-day list on phone, since a 7-column grid doesn't fit comfortably on a phone screen.
- **Audit log** (under **More**) — every add/edit/delete, reverse-chronological, old → new value where relevant. Can't be turned off.
- **More** — audit log, JSON export/import, and a short explainer of the storage model.

Every attendance entry, dated or undated, is editable and deletable from the subject's detail page. Deleting a subject requires a confirmation dialog (it cascades to its attendance records and timetable slots, and that deletion is logged before it happens). Deleting a single attendance entry or timetable slot is instant with an "Undo" action in the toast, rather than a confirmation dialog — the audit log is behind both either way.

## The math

For a subject with `T` classes held so far, `P` present, `A` absent (`T = P + A`):

- **Leave budget so far**: `floor(0.20 × T)` — the number of absences you're allowed to have accumulated by now and still be at ≥ 80%.
- **Safe to bunk** (forward-looking): the largest `N` such that `P / (T + N) ≥ 0.8` if you missed the next `N` classes in a row — `floor((5P − 4T) / 4)`, floored at 0.
- **Classes to recover**: if you're currently below 80%, the smallest `N` such that `(P + N) / (T + N) ≥ 0.8` if you attended the next `N` in a row — `4T − 5P`.

All three recalculate on every render from the live record count — nothing is cached or hardcoded, per the spec.

## Assumptions made (flagged, not hidden)

A few points in the brief didn't pin down an exact mechanic. Rather than stop and ask, I made a call on each and I'm noting them here so you can change any of them easily:

1. **"Borderline near 80%"** — implemented as 80.0–84.9% = yellow, ≥ 85% = green, < 80% = red. Adjust `BORDERLINE_BAND` in `src/lib/attendanceMath.ts`.
2. **Bulk dated add mechanic** — "a date range or set of dates" is implemented as a start/end date plus a weekday filter (so you can backfill "every Mon/Wed/Fri in March" in one action). All matching dates in one bulk action get the same status; mix presents and absents by running it twice.
3. **Same subject twice in one day** — the Today tab groups by subject, not by timetable slot, so two sessions of the same subject on the same day show as one card listing both times, with a single mark action. If you genuinely need two separate attendance records for one subject on one date, use Mark → Single entry twice, or Bulk add — those don't dedupe.
4. **Icons** — programmatically generated (`scripts/gen_icons.py`, needs Pillow) rather than supplied artwork, using the same ring motif as the in-app design. Regenerate or swap in your own at `public/icons/`.

## Known limitations

- Single device at a time, by design (no sync).
- The calendar heatmap only plots *dated* entries — undated bulk entries have no date to place on it (they still count fully toward every percentage and appear in the trend chart and record list).
- No automated tests. Given the scope, I verified this with a strict TypeScript pass and a full production build rather than a test suite — worth adding if this grows.
