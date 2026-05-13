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
- **Layout**: prefer a two-column shell when wide:
  - left: media (video)
  - right: stats + controls
- **Width**: avoid hard-coded `720px` as a global constraint; use a responsive container with a max width, and let the media area define its own aspect constraints.

### Component standards (minimum set)

#### `Button`

Variants and states:

- **Primary**: “Start Detection”
- **Danger**: “Stop”
- States: default, hover, active, disabled, focus-visible

Rules:

- focus-visible outline must be strong and accessible
- hover should not change font-weight (prevents layout shift)

#### `Card` / `Panel`

Used for “Statistics” surface.

- consistent padding/radius/border/shadow tokens
- supports `title`, `content`, and optional `footer`

#### `VideoFeed` container and overlays

- Media container: `surface` vs `bg` contrast, consistent border radius
- Bounding boxes:
  - use semantic token (e.g., `success`) instead of raw `lime`
  - ensure overlay contrast works in both light/dark backgrounds

### Folder + naming conventions (target)

Current app is a single-screen SPA, so keep structure simple:

- `src/design/`: tokens, theme, global styles
- `src/ui/`: reusable primitives (`Button`, `Card`, `Typography`)
- `src/features/`: feature-specific components (video/stats/controls)
- `src/app/`: app shell / layout

**Rule**: `ui/` contains no API calls; `features/` may compose UI primitives and call app services.

### Refactor checklist (what “done” means)

- No inline style objects for layout/typography in `App.tsx` (moved to styled components using tokens).
- `Controls`, `StatPanel`, `VideoFeed` consume theme tokens for spacing/color/typography.
- Component structure matches the target folders, and imports remain clean.
- Interaction states: hover/focus/disabled are consistent and accessible.

