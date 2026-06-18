## IBM-inspired UI guide (for Cursor/Claude)

This document defines the **CrowdNav Frontend** UI rules and refactor targets, inspired by IBM-like enterprise UI patterns and the reference `DESIGN.md` at `https://getdesign.md/ibm/design-md`.

### Goals

- **No new UI library**: keep `styled-components` and implement a lightweight in-repo design system.
- **Token-first styling**: no hardcoded hex/px in feature components (except media sizing constraints where required).
- **High-clarity layout**: predictable spacing, typographic hierarchy, strong contrast, and clear system states.

### Visual foundations

#### Color (tokens)

Use a structured blue palette with neutral grays and semantic colors.

- **Brand / Primary**
  - `primary/60`: core interactive blue (buttons, links, focus accents)
  - `primary/70`: hover/active
- **Neutrals**
  - `bg`: app background
  - `surface`: cards/panels
  - `border/subtle`: separators
  - `text/primary`, `text/secondary`, `text/inverse`
- **Semantic**
  - `danger/*`: destructive actions (Stop)
  - `success/*`: positive state
  - `warning/*`: attention state
  - `info/*`: informational highlights

**Rule**: components must consume tokens (via theme) instead of literal hex codes.

#### Typography

Keep a small, consistent scale.

- **Display/Title**: app name / page title
- **Section heading**: “Statistics” block title
- **Body**: labels and values
- **Caption/Meta**: secondary hints

**Rule**: headings should not jump from `h2` to `h1` within a single view; keep hierarchy consistent.

#### Spacing & layout

- **Spacing scale**: base-4 or base-8 (e.g., 4/8/12/16/24/32).
- **Layout**: immersive fullscreen dashboard shell:
  - background: full-viewport live video (`widgets/video-stage`)
  - right: fixed glass stats sidebar (320px)
  - bottom: floating glass control bar
  - top: fixed glass header with status pill
- Sidebar collapses below 1024px; core monitoring remains via video + bottom controls.

### Feature-Sliced Design (FSD)

The frontend follows [Feature-Sliced Design](https://feature-sliced.design/) with strict import boundaries:

| Layer | Path | Responsibility |
|-------|------|----------------|
| `app` | `src/app/` | Providers (`ThemeProvider`, `GlobalStyle`) |
| `pages` | `src/pages/` | Route-level composition (`dashboard`, `analytics`, `live-map`, `archive`, `settings`) |
| `widgets` | `src/widgets/` | Composite layout blocks (shell, nav, sidebar, page widgets) |
| `features` | `src/features/` | User interactions (`crowd-detection`, `risk-alerts`, `alert-history`) |
| `entities` | `src/entities/` | Domain models/UI (`detection`, `crowd-stats`) |
| `shared` | `src/shared/` | API client, theme tokens, UI kit, utilities |

**Import rules:** each layer may only import from layers below it (e.g. `widgets` → `features` → `entities` → `shared`). Slices expose a public API via `index.ts`; avoid deep cross-slice imports.

**Path alias:** `@/` maps to `src/` (configured in `tsconfig.json` and `vite.config.ts`).

### Folder + naming conventions (current)

- `src/shared/config/theme/`: tokens, theme, global styles
- `src/shared/ui/`: reusable primitives (`Button`, `Card`, `GlassPanel`, `Icon`, …)
- `src/features/`: hooks and feature logic (no layout shells)
- `src/widgets/`: dashboard layout composition
- `src/pages/dashboard/`: wires features into widgets
- `src/pages/analytics/`, `src/pages/live-map/`, `src/pages/archive/`, `src/pages/settings/`: secondary routes via `react-router-dom`
- `src/app/providers/AppRouter.tsx`: route table
- `src/app/`: application entry providers

**Rule**: `shared/ui` contains no API calls; `features` may call `shared/api`; `pages` orchestrates features + widgets.

### Refactor checklist (what “done” means)

- FSD folder structure with `@/` path alias and slice `index.ts` barrels.
- Glassmorphism × Y2K dark dashboard layout (see `docs/DESIGN_RULES.md`).
- `VideoStage` bbox overlays use `entities/detection` risk tokens (no hardcoded hex).
- Placeholder controls (Record, Export, Generate Report) are disabled with `title="Coming soon"`.
- Five routes: `/`, `/analytics`, `/live-map`, `/archive`, `/settings` via `AppRouter`.
- Mobile `BottomNav` exposes all five routes (Home, Stats, Map, Logs, Sensors → `/settings`).
- Interaction states: hover/focus/disabled are consistent and accessible.

### Component standards (minimum set)

#### `Button`

Variants and states:

- **Primary**: “Start Monitoring”
- **Danger**: “Stop Monitoring” / Stop icon
- States: default, hover, active, disabled, focus-visible

Rules:

- focus-visible outline must be strong and accessible
- hover should not change font-weight (prevents layout shift)

#### `Card` / `Panel`

Used for “Statistics” surface.

- consistent padding/radius/border/shadow tokens
- supports `title`, `content`, and optional `footer`

#### `VideoStage` container and overlays

- Media container: full-viewport `VideoStage` with scanline/grid texture overlays
- Layout safe zones: `layout.headerHeight`, `layout.sidebarWidth`, `layout.videoSafeInsetBottom`
- Bounding boxes via `entities/detection/PersonBBox`:
  - use `theme.color.risk.*` tokens
  - ensure overlay contrast works over live video (`glass.scrim` on chips)

### Design enrichment loop (agent)

Run one queue slice per tick (Glass×Y2K polish only — see `docs/DESIGN_RULES.md`):

```powershell
.\application\scripts\loop-design-enrich.ps1 -Once
```

Cursor: `/loop 10m Run design enrichment per .cursor/rules/design-enrichment-loop.mdc and loop-design-enrich.ps1 sentinel`

