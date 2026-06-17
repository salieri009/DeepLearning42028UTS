---
last_updated: 2026-06-17
status: draft
related:
  - application/frontend/src/shared/config/theme/tokens.ts
  - application/frontend/src/shared/config/theme/theme.ts
  - application/frontend/src/shared/ui/Button/Button.tsx
  - application/frontend/src/widgets/video-stage/ui/VideoStage.tsx
  - application/frontend/src/widgets/stats-sidebar/ui/StatsSidebar.tsx
---

# UX/UI Design Rules — Glassmorphism × Y2K

## 1. Design Language

CrowdNav's UI fuses two looks into one coherent system:

- **Glassmorphism** — frosted, translucent surfaces that float over the live video. Each glass surface
  is **translucent fill + background blur + a 1px translucent light border + soft shadow**, optionally
  with a faint top highlight to fake a glass edge.
- **Early-2000s (Y2K) / Aqua** — glossy "lickable" pill controls, chrome/aqua gradient accents, beveled
  highlights, and a subtle scanline/grid texture. Used sparingly on primary actions and headers so the
  interface reads *retro-futuristic*, not cluttered.

**Golden rule:** state the *rule*, not the vibe. Every visual choice maps to a token. Example glass surface:

```
background: rgba(255, 255, 255, 0.10);
backdrop-filter: blur(12px) saturate(120%);
border: 1px solid rgba(255, 255, 255, 0.18);
box-shadow: 0 4px 12px rgba(0,0,0,0.14);   /* theme.shadow.md */
border-radius: 12px;                        /* theme.radius.lg / new xl=20px */
```

These rules document the **existing** token system (`tokens.ts` / `theme.ts`) and define the
**additions** needed to implement the glass + Y2K language. Tokens are the contract — components must
bind to `theme.*`, never to raw hex/px (see §5 known gap).

## 2. Foundations (Tokens)

### 2.1 Color — existing (`tokens.ts`)

| Group | Tokens | Notes |
|-------|--------|-------|
| primary | `60 #0F62FE` · `70 #0043CE` · `80 #002D9C` | IBM Carbon blue; primary actions, focus. |
| neutral | `0 #FFFFFF` … `100 #0F0F0F` | Surfaces, text, borders. |
| danger | `60 #DA1E28` · `70 #A2191F` | DANGER state, destructive buttons. |
| success | `60 #24A148` · `70 #198038` | SAFE state, overlay border. |
| info | `60 #0F62FE` · `70 #0043CE` | Informational. |
| focus | `#0F62FE` | Focus ring (also `GlobalStyle.ts`). |

### 2.2 Color — additions for glass + Y2K (to add to `tokens.ts`)

| Token | Value | Use |
|-------|-------|-----|
| `color.glass.fill` | `rgba(255,255,255,0.10)` | Glass surface tint (on dark/video bg). |
| `color.glass.fillStrong` | `rgba(255,255,255,0.16)` | Hover / elevated glass. |
| `color.glass.border` | `rgba(255,255,255,0.18)` | 1px glass edge. |
| `color.glass.highlight` | `rgba(255,255,255,0.45)` | Top bevel highlight (1px inset). |
| `color.glass.scrim` | `rgba(15,15,15,0.55)` | **Mandatory** solid-ish scrim behind text over video (see §6). |
| `color.accent.warning` | `#F1C21B` | WARNING state (Carbon yellow-30) — replaces ad-hoc `#ffea00`. |
| `gradient.aqua` | `linear-gradient(180deg,#5BC0FF 0%,#0F62FE 100%)` | Y2K glossy primary fill. |
| `gradient.chrome` | `linear-gradient(180deg,#FFF 0%,#D7DEE8 48%,#AEB9C7 52%,#E8EDF3 100%)` | Y2K chrome bevel for headers. |
| `gradient.glassSheen` | `linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0) 45%)` | Top sheen overlay on glass/buttons. |

### 2.3 Spacing / Radius / Shadow / Type — existing + additions

- **Spacing** (`spacing.0–7`): `0,4,8,12,16,24,32,40px`. No change.
- **Radius**: existing `sm 4 · md 8 · lg 12`; **add `xl 20px`** for glass cards/pills.
- **Shadow**: existing `sm 0 1px 2px /.12` · `md 0 4px 12px /.14`; **add `glow 0 0 0 1px rgba(255,255,255,0.12), 0 8px 30px rgba(0,0,0,0.28)`** for floating glass.
- **Typography** (`typography.*`): family sans `system-ui …` / mono; size `1–6 = 12,14,16,20,24,32px`;
  weight `regular 400 · medium 500 · semibold 600`; lineHeight `tight 1.2 · normal 1.45`. No change.
- **Layout** (`theme.layout`): `maxWidth 1120px`, `mediaMaxWidth 760px`. No change.

## 3. Component Rules

Each component: bind to tokens; define default/hover/focus/disabled; respect glass + Y2K rules.

### 3.1 Button (`shared/ui/Button/Button.tsx`)

Existing variants `primary | danger | ghost`, sizes `sm | md | lg`. **Add a `glass` variant** and a Y2K
gloss treatment for `primary`.

| Variant | Default | Hover | Notes |
|---------|---------|-------|-------|
| `primary` | `gradient.aqua` fill, `textInverse`, `gradient.glassSheen` overlay, radius `xl` (pill) | shift gradient lighter | Y2K glossy pill; keep 1px `primary` border. |
| `danger` | `color.danger` fill | `dangerHover` | Unchanged semantics. |
| `ghost` | transparent, `borderSubtle` | `surfaceSubtle` bg | Unchanged. |
| `glass` *(new)* | `glass.fill` + `blur(12px)` + `glass.border` + `shadow.glow` | `glass.fillStrong` | For controls layered over video. |

- **Focus:** inherit global `:focus-visible` ring (`2px solid focus`, offset 2px). Do **not** remove outline.
- **Disabled:** `opacity 0.6`, `cursor not-allowed` (existing rule). No gloss animation when disabled.
- **Motion:** `transition: background/border/color 120ms ease` (existing). Gloss sweep only on hover.

### 3.2 Card (`ui/Card.tsx`)

Currently opaque (`surface` + `borderSubtle` + `shadow.sm`). **Glass mode** = `glass.fill` +
`blur(12px)` + `glass.border` + `shadow.glow` + radius `xl`; add a 1px top `glass.highlight` inset
(via `box-shadow: inset 0 1px 0 …`). `CardHeader` may use `gradient.chrome` for the Y2K bevel.
Keep opaque variant for content **not** over video (e.g. side panels on solid bg) to preserve contrast.

### 3.3 Typography (`ui/Typography.tsx`)

`SectionTitle`, `Label`, `Text`. Headings semibold + `lineHeight.tight` (global rule). On glass, text
must sit on `glass.scrim` or use `textInverse` with sufficient contrast (§6).

### 3.4 Stats sidebar (`widgets/stats-sidebar/ui/StatsSidebar.tsx`)

Glass sidebar with live stat cards: people count, crowd density, max proximity risk, session latency,
recommendation. Values color-coded by risk state using §4 semantics.

### 3.5 Video overlay (`widgets/video-stage/ui/VideoStage.tsx`)

Bounding boxes: `2px solid {riskColor}` + a small label chip (`{RISK} {conf}%`) with state-colored
background and black text. Label chip should adopt the §4 token colors (currently hardcoded — §5 gap).

## 4. Risk-State Color Semantics (single source of truth)

| State | Token | Hex | Meaning |
|-------|-------|-----|---------|
| `SAFE` | `color.success[60]` | `#24A148` | Proceed. |
| `WARNING` | `color.accent.warning` | `#F1C21B` | Caution. |
| `DANGER` | `color.danger[60]` | `#DA1E28` | Stop. |

Recommendation mapping (mirror inference): SAFE→`PROCEED`, WARNING→`CAUTION`, DANGER→`STOP`
(`main.py:_recommendation`). **Never** introduce a fourth risk color or a separate palette for these.

## 5. Known Gap — `VideoFeed.tsx` hardcoded colors

`VideoFeed.tsx` defines its own map, bypassing tokens:

```ts
const RISK_COLOR = { SAFE: "#00e676", WARNING: "#ffea00", DANGER: "#ff1744" };
```

**Rule (NFR-7):** migrate `RISK_COLOR` to read from `theme` (§4 tokens) so risk colors have one
definition. Track as a follow-up; do not add new hardcoded colors elsewhere.

## 6. Accessibility & Motion

- **Focus ring (mandatory):** keep the global `:focus-visible { outline: 2px solid focus; offset 2px }`
  (`GlobalStyle.ts`). Glass surfaces must not clip or hide it.
- **Contrast over video:** glass is translucent → text/icons over the live feed **must** sit on
  `glass.scrim` (or an opaque chip). Target WCAG AA (4.5:1) for body text even at worst-case bright video.
- **Non-color cue (NFR-10):** every risk box carries a text label; never rely on hue alone.
- **Reduced motion:** wrap Y2K gloss/sheen animations in `@media (prefers-reduced-motion: reduce)` →
  disable transitions/animations, keep static gloss.
- **Hit targets:** interactive controls ≥ 40px in the smallest dimension (use `spacing[7]`).

## 7. Implementation Checklist (for the AI doing the work)

1. Add §2.2/§2.3 tokens to `application/frontend/src/design/tokens.ts`; surface them in `theme.ts`.
2. Update `styled.d.ts` types so `theme.color.glass.*`, `gradient.*`, `radius.xl`, `shadow.glow` typecheck.
3. Add `glass` variant + gloss to `ui/Button.tsx`; add glass mode prop to `ui/Card.tsx`.
4. Replace `VideoFeed.tsx` `RISK_COLOR` literals with `theme` lookups (§5).
5. Apply `glass.scrim` behind all text rendered over `VideoFeed` (§6).
6. Verify `:focus-visible`, contrast, and `prefers-reduced-motion` rules hold.
