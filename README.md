# Mini AI Companion — Habit Tracker (Part 1: Frontend)

A React + Vite + Tailwind frontend for the habit tracker, styled to match the
provided Stitch design ("Mini AI Companion"). This is **frontend-only**: all
data is served from a local mock layer. No calls are made to the FastAPI
backend or any ESP32 device yet — that is Part 2.

## 1. Running it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`). You'll land
on `/login` — click **Sign In to Dashboard** (any email/password works, it's
simulated) or **Create Account** to enter the app.

Build for production:

```bash
npm run build
npm run preview
```

## 2. Project structure

```
habit-tracker/
├── index.html
├── tailwind.config.js        # design tokens copied from the Stitch DESIGN.md
├── postcss.config.js
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx               # app entry, wraps providers
    ├── App.jsx                # all routes + auth guard
    ├── index.css              # Tailwind layers, Material Symbols, safe-area CSS
    ├── context/
    │   ├── AuthContext.jsx    # simulated login/register/logout
    │   └── HabitsContext.jsx  # wraps mock data CRUD, exposes live habit state
    ├── data/
    │   └── mockData.js        # ⭐ single mock data layer — swap for API calls in Part 2
    ├── components/
    │   ├── ui/                # Button, Card/Chip/ProgressBar, Form fields, Modal, Icon, States
    │   ├── layout/             # Header, Sidebar (desktop), BottomNav (mobile), AppShell
    │   ├── HabitCard.jsx       # HabitListCard (My Habits) + DashboardHabitRow (Dashboard)
    │   ├── HabitForm.jsx       # shared by Add Habit and Edit Habit
    │   ├── StatCard.jsx
    │   ├── ChartCard.jsx       # Recharts-based weekly rhythm / trend charts
    │   ├── RecommendationCard.jsx
    │   ├── CalendarGrid.jsx
    │   ├── RadialProgress.jsx
    │   └── PageHeader.jsx
    └── pages/
        ├── Login.jsx / Register.jsx
        ├── Dashboard.jsx
        ├── MyHabits.jsx
        ├── AddHabit.jsx / EditHabit.jsx
        ├── CalendarPage.jsx
        ├── Statistics.jsx
        ├── Recommendations.jsx
        ├── AiReport.jsx
        └── Profile.jsx
```

## 3. Routes / screens implemented

| Route | Screen |
|---|---|
| `/login` | Login |
| `/register` | Register |
| `/dashboard` | Dashboard |
| `/habits` | My Habits (list, search, filter, sort) |
| `/habits/new` | Add Habit |
| `/habits/:id/edit` | Edit Habit (reuses the Add Habit form) |
| `/calendar` | Calendar / completion heatmap |
| `/statistics` | Statistics & analytics |
| `/recommendations` | AI Recommendations |
| `/report` | AI Report (weekly/monthly summary, insights, suggestions) |
| `/profile` | Profile / Settings |

`/` redirects to `/dashboard` if authenticated, `/login` otherwise. Unknown
routes redirect the same way, so there are no dead ends.

Authenticated routes are wrapped by `ProtectedLayout` in `App.jsx`, which
renders the shared `AppShell` (header + bottom nav on mobile, header +
sidebar on desktop ≥768px) around every screen.

## 4. Dependencies installed

- `react`, `react-dom`, `react-router-dom`
- `recharts` — weekly rhythm bar chart on Dashboard/Statistics
- `lucide-react` — included per the brief's component list; the build itself
  primarily uses Material Symbols (loaded via Google Fonts) to match the
  Stitch icon set exactly, so you can freely swap in `lucide-react` icons
  anywhere you'd prefer a different icon style.
- Dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`

No backend, database, or auth libraries are included — auth is simulated
entirely in `AuthContext.jsx`.

## 5. Design system notes

Colors, type scale, spacing, radii, and shadows in `tailwind.config.js` are
taken directly from the Stitch export's `DESIGN.md` (Plus Jakarta Sans for
headlines/stats, Inter for body text, Electric Indigo `#4F46E5` primary,
Emerald Mint `#10B981` for streaks/success, Soft Lavender secondary, Warm
Amber for alerts). The bottom nav, header, and card treatments mirror the
Stitch `code.html` exports for `main_dashboard`, `login_sign_up`,
`habits_creation`, `calendar_history`, `statistics_analytics`, and
`ai_recommendations`.

The `ai_companion_assistant` screen (chat-style AI coach) was used as a style
reference for `AiReport.jsx`, since the brief's "AI Report" screen doesn't
have a 1:1 Stitch source — it borrows the insight-card and gradient-banner
language from the recommendations/statistics screens instead.

Not covered by the provided Stitch export (built as clean extensions of the
same design system): Register, Add/Edit Habit forms, Profile/Settings, and
the desktop sidebar.

## 6. Known UI gaps / things to double check

- Desktop layout (sidebar, wider content grid) is a reasonable extension of
  the mobile-first Stitch screens, not a source screen — worth a design
  pass if desktop is a priority.
- Calendar month data is procedurally generated per month rather than
  reflecting a "real" multi-month history — fine for Part 1, but swap for
  real data once the calendar API is wired up.
- No animation/celebration state for hitting a new personal-best streak yet
  (mentioned in the Dashboard banner copy) — was out of scope for Part 1's
  static UI pass.
- Forms use inline validation only (required fields, basic format checks);
  no duplicate-name or cross-field checks that would need backend data.

## 7. Part 2 — connecting the backend

Everything is intentionally funneled through two files so Part 2 is a
contained change:

1. **`src/data/mockData.js`** — replace each function's body (`getHabits`,
   `createHabit`, `updateHabit`, `toggleHabitComplete`, `respondToRecommendation`,
   etc.) with `fetch`/`axios` calls to the matching FastAPI endpoint. Keep the
   same function signatures and return shapes so nothing above this layer
   needs to change.
2. **`src/context/AuthContext.jsx`** — replace `login`/`register` with real
   calls to the `/auth` endpoints, store the returned JWT (e.g. in memory +
   a secure httpOnly cookie strategy — avoid `localStorage` for tokens), and
   attach it to requests made from `mockData.js`.

Also for Part 2:
- Add loading and error states to `HabitsContext` methods (currently
  synchronous) once they become `async`.
- Wire the Calendar's month navigation to fetch real month data instead of
  the procedural generator.
- Connect ESP32 device status/actions wherever `/profile`'s "Connections"
  section currently shows "Not connected · Part 2".
- Add real form persistence for Profile account changes.
