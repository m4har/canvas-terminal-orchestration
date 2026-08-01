# ADR 0001: Separate Landing Static Site

**Status:** Accepted  
**Date:** 2026-08-01

## Context

Canvas Orchestra is a Tauri desktop app for visual agent orchestration. The product is not a website — it runs locally with Herdr integration and SQLite persistence. We need a public-facing landing page to introduce the product and link to the GitHub repository, deployable to Railway.

## Decision

Create a **separate `landing/` folder** with its own `package.json`, Vite build, and Railway config. The landing page is a static site served via `serve`, independent of the Tauri desktop app bundle.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Same Vite app with routing (`/` landing, `/app` canvas) | Couples marketing code with desktop app; increases Tauri bundle complexity |
| Pure static HTML/CSS | Harder to maintain animated mock UI; React + Tailwind matches main app conventions |
| Embed ReactFlow demo | Heavy bundle; requires Herdr/xterm deps that don't work in static hosting |

## Consequences

**Positive:**
- Desktop app build stays clean — no marketing code in `src/`
- Landing deploys independently to Railway without Tauri/Rust toolchain
- Design tokens copied from main app for visual consistency
- Animated CSS mock is lightweight and works without backend

**Negative:**
- Design tokens duplicated in `landing/src/index.css` — must be kept in sync manually
- Two `package.json` files to maintain

## Deployment

Railway serves `landing/dist/` via Nixpacks. Root directory set to `landing` in Railway dashboard.
