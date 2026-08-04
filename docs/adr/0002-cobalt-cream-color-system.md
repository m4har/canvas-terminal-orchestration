# ADR 0002: Cobalt + Cream Color System

**Status:** Accepted  
**Date:** 2026-08-04

## Context

PRD section 15 locked a monochrome zinc palette with no accent color and icon-only status badges. The landing page diverged with emerald accents on a dark-only theme. The product owner requested a full-color rebrand: bright, colorful, with landing and desktop app aligned on shared tokens.

## Decision

Adopt a **Cobalt + Cream** color system via [`shared/design-tokens.css`](../../shared/design-tokens.css):

- Light-first cream neutrals with cobalt accent
- Semantic status colors: working (cobalt), done (green), blocked (amber), idle (muted)
- Dark mode via `.dark` class, same token names
- Landing and app both import the shared file

Phased rollout: landing first, then desktop app.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Monochrome light only | User explicitly chose full color |
| Dual identity (colorful landing, grey app) | Brand inconsistency between marketing and product |
| Multi-hue rainbow palette | Too noisy for a devtool; cobalt anchors the brand |
| Keep PRD monochrome | Conflicts with stated product direction |

## Consequences

**Positive:**
- Single source of truth for colors across landing and app
- Status semantics visible at a glance without colored dots (icon + color)
- Light default feels approachable for marketing; dark mode preserved for dev preference

**Negative:**
- PRD section 15.2 color rules are superseded by this ADR
- Both surfaces must stay in sync when tokens change
- Landing-specific glass/mesh utilities remain separate from shared tokens

## Implementation

- Phase 1: `landing/` imports shared tokens, theme toggle, component refresh
- Phase 2: `src/index.css` imports shared tokens; StatusIcon and nodes use `--status-*` vars
- PRD section 15.2 updated in Phase 2
