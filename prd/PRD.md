# PRD — Canvas Orchestra Loop Engineer

**Status:** Final  
**Version:** 0.1  
**Date:** 2026-08-01

---

## 1. Problem Statement

Existing agent orchestration tools (Orca, desktop ADEs, terminal multiplexers) solve execution well but fail at **visual progress visibility**. When running multiple agents across tasks or projects, it is hard to:

- See all agent states at a glance
- Understand which agent is working on what
- Organize agents by project or area
- Hand off context between agents without losing flow

Users need a **visual canvas** where agents, specs, and project boundaries are laid out spatially — not buried in tabs or terminal panes.

---

## 2. Solution Overview

**Canvas Orchestra Loop Engineer** is a desktop app (Tauri) that provides a visual workflow canvas for orchestrating AI coding agents via [Herdr](https://herdr.dev/).

Core value proposition:

> Design your agent layout on a canvas. See every agent's status live. Hand off work between agents with one click. Group by project using visual frames.

---

## 3. Target User

Solo developer or small team who:

- Already uses CLI agents (Claude Code, Codex, OpenCode, etc.)
- Runs multiple agents in parallel on different tasks or projects
- Wants visual supervision without giving up real terminal sessions
- Finds existing orchestration UIs opaque about agent progress

---

## 4. Goals

| Goal | Metric |
|------|--------|
| See all agent status on one screen | All TerminalNodes show live Herdr state without switching panes |
| Organize agents by project | User can draw Square frames and Text headers per project area |
| Hand off context between agents | Manual handoff with compose dialog works end-to-end |
| Inspect agent workspace | Click TerminalNode → Inspector shows cwd, file tree, git status |
| Zero-config Herdr connection | App launches and connects to Herdr automatically |

---

## 5. Non-Goals (v0.1)

- Auto-trigger edges (deferred to v0.2)
- Run template / Run instances / run history (deferred to v0.2)
- Multiple saved workflows (single auto-saved workflow in v0.1)
- Remote Herdr over SSH
- Workflow import/export
- Built-in agent execution (agents run via Herdr, not embedded)
- Replacing Orca, Cursor, or Herdr TUI

---

## 6. Node Types

### 6.1 TerminalNode

A **Herdr pane** (PTY session) on the canvas. Starts as a **plain shell** — the user freely chooses which agent runtime to start inside it via Herdr (`pi`, `opencode`, `claude`, `codex`, etc.). Canvas does not pre-assign or embed an agent.

**Pane-first model:**

```
Add TerminalNode  →  herdr pane create (shell)
User in pane      →  herdr agent start <name> --kind <runtime>  (optional, any time)
Inter-agent comm  →  Herdr (agent prompt, pane send) — not via canvas directly
Canvas role       →  visual supervision + context routing (handoff edges)
```

**Displays:**
- Pane label (user-defined, e.g. "FE Dev", "BE Dev")
- Live status badge: `idle` | `working` | `blocked` | `done`
  - `idle` when pane is plain shell with no active agent
  - `working` / `blocked` / `done` when Herdr reports agent state
- Terminal output preview (last N lines) or full xterm.js view on expand
- Optional cosmetic badge: detected agent kind icon (shown after user starts an agent, not required at create time)

**Interactions:**
- Click → open Inspector panel (git + file tree for pane cwd)
- Double-click or expand → full terminal view (xterm.js) — user can type freely
- Context menu: Force Done, Send prompt, Open in Herdr
- Draggable, resizable on canvas

**Herdr binding:**
- Each TerminalNode maps to one **pane ID** (not agent ID)
- Output streamed via `herdr pane read`
- Agent status polled via `herdr agent status` when an agent is bound to the pane
- User may run multiple agents across different panes; Herdr handles agent-to-agent communication

### 6.2 MarkdownNode

A spec or instruction document on the canvas.

**Displays:**
- Inline markdown editor (CodeMirror 6)
- Rendered preview toggle

**Interactions:**
- Edit content directly on canvas
- Draggable, resizable
- On handoff to TerminalNode: full markdown content sent as prompt

**Config:**
- `title` — node label
- `content` — markdown body (persisted in SQLite)

### 6.3 Square (Line Frame)

A stroke-only rectangular frame for visual project grouping.

**Behavior:**
- Interior is fully transparent
- Interior is click-through (`pointer-events: none`) — clicks reach nodes below
- Only the border stroke is interactive for drag and resize
- Moving the Square does **not** move nodes inside it
- Renders behind work nodes (lower z-index)

**Config:**
- `width`, `height`
- `strokeColor` (default: muted border)
- `strokeWidth` (default: 2px)
- `strokeStyle`: `solid` | `dashed`

### 6.4 Text

A standalone label node for headers and annotations.

**Behavior:**
- Draggable, not click-through
- No connections (edges not supported on Text nodes)

**Config:**
- `label` — text content
- `fontSize` — configurable: 12, 14, 18, 24, 32, 48 px
- `fontWeight`: `normal` | `bold`

---

## 7. Inspector Panel

Opened when a TerminalNode is selected. Not a canvas node.

**Sections:**

| Section | Source |
|---------|--------|
| Working directory | Herdr pane/workspace `cwd` metadata |
| Folder tree | Tauri `fs_tree(cwd)` — lazy-loaded |
| Git status | Tauri `git_status(cwd)` — branch, staged/unstaged count |
| Git diff summary | Optional: `git diff --stat` on demand |

**Behavior:**
- Read-only in v0.1
- Refreshes on TerminalNode selection and on manual refresh button
- Collapsible sections

---

## 8. Edges & Communication

### 8.1 Handoff (v0.1 — manual only)

User draws an edge from source node to target TerminalNode, then clicks **Handoff** on the edge or target node.

**Flow:**
1. Handoff dialog opens with pre-filled payload:
   - From MarkdownNode → TerminalNode: full markdown content
   - From TerminalNode → TerminalNode: last 50 lines of output + upstream markdown ref (if any)
2. User edits the prompt
3. User clicks Send → `herdr agent prompt` or `herdr pane send` on target pane

### 8.2 Trigger (v0.2 — auto)

Deferred. Will fire automatically when upstream TerminalNode reaches Herdr `done` state.

**Default payload (v0.2):**
- Markdown ref from upstream MarkdownNode (if connected)
- Status `done`
- Last 50 lines of terminal output

### 8.3 Force Done

Available on any TerminalNode via context menu.

Sets node status to `done` locally, enabling manual progression when:
- Herdr agent is stuck in `working`
- Pane is a plain shell without semantic agent state
- User wants to proceed without waiting

---

## 9. Canvas Layout & Positioning

Users can freely position all nodes on an infinite canvas:

- Pan and zoom (xyflow built-in)
- Drag any node to rearrange
- Draw Square frames around project areas
- Place Text headers above or beside Square frames
- Snap-to-grid optional (v0.2)

**Typical layout per project:**

```
Text: "Auth Refactor" (24px, bold)

┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                     │
│   [PRD Spec]  ──handoff──▶  [Pane A]│
│   (markdown)                shell→opencode
│                              │      │
│                         ┌────┘      └────┐
│                         ▼                 ▼
│                    [Pane B: pi]    [Pane C: opencode]
│                                     │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

- **Pane A** receives spec via canvas handoff; user starts OpenCode inside it
- **Pane B / C** are parallel branches; user starts agents via Herdr or receives handoff prompts from canvas
- Inter-agent communication happens in Herdr; canvas shows status and routes context

Multiple project areas can coexist on one canvas.

---

## 10. Herdr Integration

**Strategy:** `connect_or_spawn`

1. On app launch, HerdrBridge attempts to connect to an existing Herdr socket
2. If no session found, spawn `herdr server` as Tauri sidecar
3. On app quit, gracefully disconnect (do not kill reused external Herdr sessions)

**Capabilities used in v0.1:**

| Herdr API | Use |
|-----------|-----|
| `workspace create --cwd` | Set working directory for new agent panes |
| `pane read` | Stream terminal output to xterm.js |
| `agent status` | Poll TerminalNode state badge |
| `agent prompt` / `pane send` | Send handoff payload |
| `pane list` | Discover existing panes on reconnect |

---

## 11. Persistence (v0.1)

Single workflow, auto-saved to SQLite on every change.

**Persisted:**
- All node positions, sizes, types, and config (including Square stroke, Text fontSize)
- All edge definitions (type, source, target, payload config)
- MarkdownNode content
- TerminalNode ↔ Herdr pane ID bindings

**Not persisted:**
- Terminal output transcripts (Herdr is source of truth)
- Run history (v0.2)
- Git status cache (fetched live on Inspector open)

---

## 12. User Stories

### US-01: See all agents at a glance
> As a developer running 3 agents, I want to see all their statuses on one canvas so I know who is working, blocked, or done without switching terminals.

**Acceptance criteria:**
- Each TerminalNode shows live status badge updated within 2s of Herdr state change
- Status colors: working=blue, blocked=yellow, done=green, idle=gray

### US-02: Group agents by project
> As a developer working on two projects simultaneously, I want to draw frames and labels on the canvas so I can visually separate project areas.

**Acceptance criteria:**
- User can add Square (line frame) and resize it by dragging corners
- User can add Text node and set font size via node config panel
- Clicking inside a Square selects nodes below, not the Square itself
- Dragging Square border moves only the frame

### US-03: Hand off spec to agent
> As a developer, I want to connect a MarkdownNode to a TerminalNode and hand off the spec content so the agent receives my instructions.

**Acceptance criteria:**
- User draws edge MarkdownNode → TerminalNode
- Clicking Handoff opens compose dialog pre-filled with markdown content
- Sending dispatches prompt to target Herdr pane
- Target TerminalNode status updates to `working`

### US-04: Inspect agent workspace
> As a developer, I want to click a TerminalNode and see its working directory, file tree, and git status like in Orca.

**Acceptance criteria:**
- Inspector opens on TerminalNode click
- Shows cwd from Herdr pane metadata
- Folder tree loads for that cwd
- Git status shows branch name and changed file count

### US-05: Position nodes freely
> As a developer, I want to drag Markdown and Terminal nodes anywhere on the canvas to organize my workflow layout per project.

**Acceptance criteria:**
- All node types are freely draggable
- Node positions persist across app restarts
- Canvas supports pan and zoom

### US-06: Force agent done
> As a developer, I want to manually mark an agent as done when it is stuck so I can proceed with the workflow.

**Acceptance criteria:**
- Context menu on TerminalNode has "Force Done"
- Status badge updates to `done` immediately
- No prompt sent to Herdr pane

---

## 13. MVP v0.1 Scope Summary

| In v0.1 | Out (v0.2+) |
|---------|-------------|
| Canvas editor with pan/zoom | Auto trigger edges |
| TerminalNode (Herdr live) | Run template / instances |
| MarkdownNode | Run history timeline |
| Square (line frame) | Multiple saved workflows |
| Text (configurable font size) | Workflow import/export |
| Inspector (git + file tree) | Remote Herdr SSH |
| Manual handoff + compose dialog | Snap-to-grid |
| Force Done | Attach nodes to frame on drag |
| HerdrBridge connect_or_spawn | |
| Single workflow auto-save (SQLite) | |

---

## 14. Success Criteria for v0.1

- [ ] App launches and connects to Herdr without manual setup
- [ ] User can place TerminalNode, MarkdownNode, Square, and Text on canvas
- [ ] TerminalNode shows live Herdr agent status
- [ ] Inspector shows cwd, folder tree, and git status on TerminalNode click
- [ ] Handoff from MarkdownNode to TerminalNode sends prompt via Herdr
- [ ] Square frame is click-through inside, draggable by border only
- [ ] Text node font size is configurable
- [ ] Canvas state persists across app restart

---

## 15. Design System

### 15.1 Design Direction

**Minimalist modern** developer tool with **dark mode support**. Monochrome palette — hierarchy through weight, opacity, and border, not color. Canvas-first layout with minimal chrome.

| Dial | Value | Rationale |
|------|-------|-----------|
| DESIGN_VARIANCE | 6 | Canvas provides visual complexity; chrome stays clean |
| MOTION_INTENSITY | 4 | Subtle CSS transitions; one infinite spin for `working` status |
| VISUAL_DENSITY | 4 | Airy spacing; gallery-like breathing room around nodes |

**Anti-patterns (banned):** purple/blue AI gradient aesthetic, Inter font, emoji in UI, colored accent buttons, card shadows on every element, `h-screen` (use `min-h-[100dvh]`), neon glows, pure `#000000`.

### 15.2 Theme

**Strategy:** System preference with manual override.

| Behavior | Detail |
|----------|--------|
| Launch | Read `prefers-color-scheme`, apply matching theme |
| Override | User toggles via toolbar; choice persisted in SQLite/localStorage |
| Implementation | shadcn `ThemeProvider` pattern (class-based `.dark`) |
| Canvas | Uses theme-adaptive CSS custom properties |

**Color palette:** Monochrome zinc scale. No accent color.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `zinc-50` | `zinc-950` | App background |
| `--foreground` | `zinc-900` | `zinc-50` | Primary text |
| `--muted` | `zinc-100` | `zinc-800` | Node fill, secondary surfaces |
| `--muted-foreground` | `zinc-500` | `zinc-400` | Secondary text, icons |
| `--border` | `zinc-200` | `zinc-800` | Dividers, subtle borders |
| `--canvas-bg` | `zinc-50` | `zinc-950` | Canvas background |
| `--canvas-dot` | `zinc-300` | `zinc-700` | Dot grid (opacity 0.5) |
| `--node-fill` | `zinc-100` | `zinc-800` | Node background |
| `--node-hover` | `zinc-200` | `zinc-750` | Node hover state |
| `--edge-stroke` | `zinc-400` | `zinc-500` | Edge lines |
| `--ring` | `zinc-400` | `zinc-500` | Selected node focus ring |

No chroma anywhere in chrome UI. Status uses icons only.

### 15.3 Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| App title | Geist Sans | 500 | `text-sm` |
| Node label | Geist Sans | 500 | `text-sm` |
| Body / UI | Geist Sans | 400 | `text-sm` |
| Text node | Geist Sans | 600 | 12–48px (configurable) |
| Terminal output | Geist Mono | 400 | `text-xs` |
| Inspector path | Geist Mono | 400 | `text-xs` |
| Git branch | Geist Mono | 400 | `text-xs` |
| Toolbar | Geist Sans | 400 | `text-sm` |

### 15.4 Layout

Classic IDE split. Canvas is the primary surface.

```
┌──────────────────────────────────────────────────────┐
│ Toolbar (h-10, border-b)                             │
│ [+ Terminal] [+ Markdown] [+ Square] [+ Text]       │
│                              [Fit] [Theme] [Handoff] │
├────────────────────────────────────┬─────────────────┤
│                                    │                 │
│   Canvas (flex-1, dot grid)        │  Inspector      │
│                                    │  (w-80)         │
│   [nodes, edges, squares, text]    │  collapsible    │
│                                    │                 │
└────────────────────────────────────┴─────────────────┘
```

| Region | Size | Behavior |
|--------|------|----------|
| Toolbar | `h-10` (40px) | Fixed top, `border-b` |
| Canvas | `flex-1` | Pan/zoom via xyflow |
| Inspector | `w-80` (320px) | Slide-in from right on TerminalNode select; hidden otherwise |

**Toolbar items:**

| Button | Icon (Phosphor) | Action |
|--------|-----------------|--------|
| + Terminal | `Terminal` | Add TerminalNode |
| + Markdown | `FileText` | Add MarkdownNode |
| + Square | `Square` | Add Square frame |
| + Text | `TextT` | Add Text label |
| Fit | `ArrowsOut` | `fitView()` |
| Theme | `Sun` / `Moon` | Toggle light/dark/system |
| Handoff | `ArrowRight` | Enter handoff mode |

### 15.5 Agent Status (Icon-Only)

No colored dots. Differentiation via Phosphor icon shape + motion.

| Status | Icon | Style |
|--------|------|-------|
| `idle` | `Minus` | Static, `text-zinc-400` |
| `working` | `CircleNotch` | Spin animation, `text-zinc-300` |
| `blocked` | `Pause` | Static, `text-zinc-400` |
| `done` | `Check` | Static, `text-zinc-300` |

Icon stroke width: `1.5` globally.

### 15.6 Canvas & Nodes

**Canvas background:** Dot grid, 20px spacing. Dots: `var(--canvas-dot)` at 50% opacity. Background: `var(--canvas-bg)`.

**Node visual style:** Borderless. Differentiated from canvas by background shade only.

| Node Type | Fill | Hover | Selected |
|-----------|------|-------|----------|
| TerminalNode | `--node-fill` | `--node-hover` | `ring-1 ring-[--ring]` |
| MarkdownNode | `--node-fill` | `--node-hover` | `ring-1 ring-[--ring]` |
| Text | transparent | — | `ring-1 ring-[--ring]` |
| Square | transparent (stroke only) | — | stroke brightens |

**Square:** Stroke only, `fill: none`. Interior `pointer-events: none` (click-through). Border drag only via SVG `pointer-events: stroke`. `z-index: -1` (behind work nodes).

**Edges:** Stroke `var(--edge-stroke)`, 1.5px. Arrow at target. Selected: brighter stroke.

### 15.7 Inspector Panel

```
┌─ Inspector ──────────────────┐
│  ~/Projects/auth-refactor    │  cwd (Geist Mono, xs)
│──────────────────────────────│
│  > src/                      │  file tree (collapsible)
│    > components/             │
│      auth-form.tsx           │
│    > lib/                    │
│      session.ts              │
│──────────────────────────────│
│  main · 3 changed · 1 staged │  git status (mono, xs)
└──────────────────────────────┘
```

No cards or boxed sections — separated by `border-t` dividers only.

### 15.8 Motion

CSS transitions only in v0.1. No Framer Motion.

| Interaction | Property | Duration | Easing |
|-------------|----------|----------|--------|
| Node hover | `background-color` | 150ms | `ease` |
| Node select | `box-shadow` (ring) | 100ms | `ease` |
| Inspector open | `transform: translateX` | 200ms | `ease-out` |
| Inspector close | `transform: translateX` | 150ms | `ease-in` |
| Handoff dialog | `opacity` + `scale` | 200ms | `ease-out` |
| Button press | `transform: scale(0.98)` | 100ms | `ease` |
| Status working | `rotate` (CircleNotch) | 1s | `linear infinite` |
| Theme toggle | none | 0ms | instant |

### 15.9 shadcn/ui Customization

| Token | Value |
|-------|-------|
| `--radius` | `0.5rem` (8px) |
| Button default | `variant="ghost"` for toolbar |
| Button primary | `bg-zinc-900 text-zinc-50` (light) / inverse (dark) |
| Dialog | `bg-background border border-border` — no shadow |
| Input | `border-border bg-muted` |

### 15.10 Component Inventory (v0.1)

| Component | shadcn base | Custom |
|-----------|-------------|--------|
| Toolbar | `Button` (ghost) | Custom layout |
| InspectorPanel | `Collapsible`, `Separator` | FileTree, GitStatus |
| HandoffDialog | `Dialog`, `Input` | Compose textarea |
| TerminalNode | — | Custom xyflow node |
| MarkdownNode | — | CodeMirror embed |
| SquareNode | — | SVG stroke frame |
| TextNode | — | Inline editable label |
| ThemeToggle | `Button` (ghost) | Sun/Moon icon swap |
| StatusIcon | — | Phosphor icon mapper |

### 15.11 Responsive Behavior

Desktop-first (Tauri app). Minimum window: `1024×640`.

| Breakpoint | Behavior |
|------------|----------|
| `< 1024px` | Inspector overlays canvas (slide-over) instead of side-by-side |
| `≥ 1024px` | Classic IDE split (toolbar + canvas + inspector) |

No mobile layout in v0.1.

### 15.12 Design Decisions Log

| # | Decision | Choice |
|---|----------|--------|
| 1 | Theme strategy | System preference + override |
| 2 | Color palette | Monochrome zinc, no accent |
| 3 | Status visualization | Icon + motion only (Phosphor) |
| 4 | Typography | Geist Sans + Geist Mono |
| 5 | Canvas style | Dot grid + borderless nodes |
| 6 | Layout | Classic IDE split (toolbar / canvas / inspector) |
| 7 | Motion | Subtle CSS transitions (MOTION: 4) |

---

## 16. Open Questions (post-v0.1)

- Should Square frames be assignable to nodes for group-move in v0.2?
- Should Inspector support inline diff view?
- Should canvas support multiple workflows with tabs?
- Integration with Herdr plugins (e.g. herdr-file-viewer)?
