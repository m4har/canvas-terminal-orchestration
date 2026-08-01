# RFC — Canvas Orchestra Loop Engineer

**Status:** Final  
**Version:** 0.1  
**Date:** 2026-08-01  
**Related PRD:** [PRD.md](../prd/PRD.md)

---

## 1. Summary

Technical specification for Canvas Orchestra Loop Engineer v0.1: a Tauri desktop app with a React canvas UI, Herdr as the terminal backend, and SQLite for workflow persistence.

Canvas **supervises and routes context**; Herdr **executes agents and handles inter-agent communication**.

**Pane-first principle:** Every TerminalNode starts as a plain Herdr pane. The user freely starts any agent runtime inside it. Canvas never pre-assigns or embeds an agent.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Tauri Application                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   React Frontend                       │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │ @xyflow/    │  │ xterm.js │  │ Inspector Panel │  │  │
│  │  │ react       │  │ Terminal │  │ Git + FileTree  │  │  │
│  │  │ Canvas      │  │ View     │  │                 │  │  │
│  │  │             │  │          │  │                 │  │  │
│  │  │ Nodes:      │  └──────────┘  └─────────────────┘  │  │
│  │  │ - terminal  │                                      │  │
│  │  │ - markdown  │  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │ - square    │  │Handoff   │  │ shadcn/ui       │  │  │
│  │  │ - text      │  │Dialog    │  │ Components      │  │  │
│  │  └─────────────┘  └──────────┘  └─────────────────┘  │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │ invoke()                           │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │                   Rust Backend (Tauri)                  │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │  │
│  │  │ HerdrBridge  │  │ GitCmd   │  │ FsTree         │  │  │
│  │  │ connect_or_  │  │ status   │  │ scan           │  │  │
│  │  │ spawn        │  │ diff     │  │                │  │  │
│  │  │ pane_read    │  └──────────┘  └────────────────┘  │  │
│  │  │ agent_status │                                      │  │
│  │  │ agent_prompt │  ┌──────────────────────────────┐   │  │
│  │  └──────┬───────┘  │ SQLite (rusqlite)            │   │  │
│  │         │          │ crates/workflow              │   │  │
│  │         │          └──────────────────────────────┘   │  │
│  └─────────┼────────────────────────────────────────────┘  │
└────────────┼────────────────────────────────────────────────┘
             │ Unix socket / JSON API
    ┌────────▼────────┐
    │  Herdr Server   │  ← sidecar (spawned) or existing session (reused)
    │  PTY + Agents  │
    └─────────────────┘
```

### Responsibility Split

| Action | Who owns it |
|--------|-------------|
| Create pane (shell) | Canvas → `herdr pane create` |
| Start agent in pane | **User via Herdr** (`herdr agent start --kind pi`) |
| Agent talks to agent | **Herdr** (`herdr agent prompt`) |
| Send spec to pane | Canvas handoff → `herdr pane send` or `herdr agent prompt` |
| Show live status | Canvas polls `herdr agent status` / `herdr pane read` |
| Persist workflow layout | Canvas SQLite |

---

## 3. Tech Stack

### 3.1 Shell & Backend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| App shell | **Tauri 2** | Lightweight native desktop, Rust backend for system commands |
| Language (backend) | **Rust** | Tauri native, safe subprocess management for Herdr |
| Database | **SQLite** via **`rusqlite`** in `crates/workflow` | Local-first, testable without Tauri |
| Herdr integration | **Herdr CLI + socket API** | Real PTY, agent state, JSON API |

### 3.2 Frontend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| UI framework | **React 19** | Ecosystem, xyflow compatibility |
| Component library | **shadcn/ui** + **Tailwind CSS** | Consistent design system |
| Canvas | **@xyflow/react** (v12+) | Mature node-edge editor, custom nodes, pan/zoom |
| Terminal render | **xterm.js** + **@xterm/addon-fit** | Industry standard PTY renderer |
| Markdown editor | **CodeMirror 6** | Lightweight, embeddable in canvas nodes |
| Markdown preview | **react-markdown** + **remark-gfm** | Render preview toggle |
| State management | **Zustand** | Simple store for canvas state |
| Tauri bridge | **@tauri-apps/api** | invoke commands, events |

### 3.3 Deferred (v0.2+)

| Component | Choice | Use |
|-----------|--------|-----|
| Auto-layout | **elkjs** | Auto-arrange nodes when graph grows |
| Run engine | Custom Rust scheduler | Trigger edge execution, Run instances |
| E2E | **Playwright** via Tauri WebDriver | Full handoff flow |

---

## 4. Project Structure

```
canvas-orchestra-loop-engineer/
├── CONTEXT.md
├── prd/PRD.md
├── rfc/RFC.md
├── crates/
│   └── workflow/                  # rusqlite repo (cargo test)
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           └── repo.rs
├── src/                           # React frontend (Vitest)
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                  # design tokens
│   ├── lib/
│   │   ├── nodes.ts
│   │   ├── types.ts
│   │   └── handoff.ts
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasToolbar.tsx
│   │   │   ├── HandoffDialog.tsx
│   │   │   └── nodes/
│   │   │       ├── TextNode.tsx
│   │   │       ├── SquareNode.tsx
│   │   │       ├── TerminalNode.tsx
│   │   │       └── MarkdownNode.tsx
│   │   ├── inspector/
│   │   │   └── InspectorPanel.tsx
│   │   └── theme/
│   │       └── ThemeProvider.tsx
│   ├── hooks/
│   │   ├── useCanvasPersistence.ts
│   │   └── usePaneStatus.ts
│   └── stores/
│       └── canvasStore.ts
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── herdr.rs
│   │   │   ├── git.rs
│   │   │   ├── fs.rs
│   │   │   └── workflow.rs
│   │   └── herdr/
│   │       ├── bridge.rs
│   │       ├── pane.rs
│   │       └── agent.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── package.json
└── Cargo.toml                     # workspace root
```

---

## 5. Orchestration & Loop Engineering

### 5.1 Reference Workflow

```
[MarkdownNode: plan.md]
        │
        │ handoff (v0.1 manual / v0.2 trigger)
        ▼
[TerminalNode: Pane A]          ← plain shell → user starts opencode
        │
        │ fan-out (2 parallel edges)
   ┌────┴────┐
   ▼         ▼
[Pane B]  [Pane C]              ← shell → user starts pi / opencode
   │         │
   └────┬────┘
        │ join (v0.3)
        ▼
[MarkdownNode: updated plan]    ← loop back (v0.3)
        │
        └──── loop ────▶ Pane A
```

| Version | Orchestration capability |
|---------|-------------------------|
| **v0.1** | Manual handoff, pane-first terminals, live status, fan-out layout (manual dispatch each branch) |
| **v0.2** | Auto trigger on `done`, Run + RunEvent timeline, run engine scheduler |
| **v0.3** | Join barrier, manual loop (markdown update → re-handoff), workflow templates |

### 5.2 Edge Types

**Handoff (v0.1 — manual):** User-initiated. Opens compose dialog with prefilled payload.

| Source | Target | Prefill |
|--------|--------|---------|
| MarkdownNode | TerminalNode (pane) | Full markdown content |
| TerminalNode | TerminalNode (pane) | Last 50 lines + upstream markdown ref |
| Text | — | No edges (annotation only) |
| Square | — | No edges (visual only) |

**Delivery:** `herdr pane send <paneId> "<text>"` if plain shell, or `herdr agent prompt <agentName> "<text>"` if agent active.

**Trigger (v0.2 — automatic):** Fires when upstream TerminalNode reaches Herdr `done` (or Force Done). Fan-out: one upstream `done` triggers multiple downstream panes in parallel.

**Join (v0.3 — barrier):** Downstream fires only when **all** upstream branches are `done`.

**Loop (v0.3 — iteration):** Agent output → update MarkdownNode → re-handoff → repeat. v0.3 scope: manual loop only.

### 5.3 TerminalNode Lifecycle

```
Add Terminal → herdr pane create → herdrPaneId stored
       ▼
  idle (plain shell, user types freely in xterm)
       │ user: herdr agent start --kind <runtime>
       ▼
  working (Herdr agent state polled, 2s interval)
       │ agent completes OR user Force Done
       ▼
  done (triggers downstream edges in v0.2)
```

### 5.4 Status Model

| Badge | Condition |
|-------|-----------|
| `idle` | Pane exists, no active Herdr agent |
| `working` | Herdr agent state = `working` |
| `blocked` | Herdr agent state = `blocked` |
| `done` | Herdr agent state = `done` OR user Force Done |

`agentKind` and `agentName` are **cosmetic/detected** — populated when Herdr reports an agent bound to the pane.

---

## 6. HerdrBridge Design

### 6.0 Herdr Socket Spike (required before Phase 2)

Before implementing `HerdrBridge`, run a 30-min spike and document:

| Item | Action |
|------|--------|
| Socket path | `herdr status --json` on macOS/Linux |
| Request format | Read Herdr socket API docs |
| Fixture file | `crates/workflow/tests/fixtures/herdr_pane_list.json` |
| TDD approach | Parse fixture in Rust test before calling real binary |

### 6.1 Connection Lifecycle

```rust
pub struct HerdrBridge {
    socket_path: PathBuf,
    child: Option<Child>,  // Some if we spawned it
}

impl HerdrBridge {
  /// Try connect to existing Herdr socket.
  /// If not found, spawn `herdr server` as sidecar.
  pub async fn connect_or_spawn() -> Result<Self, HerdrError> { ... }

  /// Only kill Herdr if we spawned it.
  pub fn shutdown(self) { ... }
}
```

### 6.2 Tauri Commands

```rust
#[tauri::command]
async fn herdr_connect(state: State<'_, HerdrState>) -> Result<HerdrStatus, String>;

#[tauri::command]
async fn herdr_pane_read(pane_id: String, lines: Option<u32>) -> Result<String, String>;

#[tauri::command]
async fn herdr_agent_status(pane_id: String) -> Result<AgentStatus, String>;

#[tauri::command]
async fn herdr_agent_prompt(pane_id: String, text: String) -> Result<(), String>;

#[tauri::command]
async fn herdr_pane_create(cwd: String, label: String) -> Result<PaneInfo, String>;

#[tauri::command]
async fn herdr_pane_list() -> Result<Vec<PaneInfo>, String>;

#[tauri::command]
async fn git_status(cwd: String) -> Result<GitStatus, String>;

#[tauri::command]
async fn fs_tree(cwd: String, depth: Option<u32>) -> Result<Vec<FsEntry>, String>;

#[tauri::command]
async fn save_canvas(nodes: Vec<NodeDto>, edges: Vec<EdgeDto>) -> Result<(), String>;

#[tauri::command]
async fn load_canvas() -> Result<CanvasDto, String>;
```

### 6.3 Status Polling

Frontend polls `herdr_agent_status` every 2 seconds for active TerminalNodes.

### 6.4 Output Streaming

**Decision:** Poll `pane read` in v0.1 with 500ms interval when terminal view is expanded. Upgrade to socket subscribe in v0.2.

---

## 7. Custom Node Implementations

### 7.1 SquareNode (Line Frame)

Key requirement: interior click-through, border-only drag.

- SVG `rect` with `pointer-events: stroke` — drag initiates only on border hit
- Interior: `pointer-events: none` — clicks pass through to nodes below
- xyflow config: `zIndex: -1`, not a parent group

### 7.2 TextNode

Configurable `fontSize` (12–48) and `fontWeight` (normal/bold). Inline editable on double-click.

### 7.3 TerminalNode

Pane-first: binds to a Herdr **pane**, not a pre-assigned agent runtime.

**Create flow:**
1. User clicks "Add Terminal" → `herdr pane create --cwd <picker>` → TerminalNode with `herdrPaneId`
2. Pane starts as plain shell (`status: idle`)
3. User types in xterm or runs `herdr agent start` in Herdr
4. Canvas polls `herdr agent status` only when pane has an active agent

### 7.4 MarkdownNode

Embedded CodeMirror with markdown language support. Resizable. Toggle preview via `react-markdown`.

---

## 8. Database Schema

Implemented in `crates/workflow/src/repo.rs` (rusqlite). Tauri commands wrap this crate.

```sql
CREATE TABLE nodes (
  id            TEXT PRIMARY KEY,
  workflow_id   TEXT NOT NULL,
  type          TEXT NOT NULL,  -- 'terminal' | 'markdown' | 'square' | 'text'
  position_x    REAL NOT NULL,
  position_y    REAL NOT NULL,
  width         REAL,
  height        REAL,
  data_json     TEXT NOT NULL
);

CREATE TABLE edges (
  id              TEXT PRIMARY KEY,
  workflow_id     TEXT NOT NULL,
  source_node_id  TEXT NOT NULL,
  target_node_id  TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'handoff',
  payload_json    TEXT
);
```

**`data_json` per type:**

```typescript
// terminal — pane-first; agentKind cosmetic after user starts agent
{ label: string; herdrPaneId: string; cwd: string; agentKind?: string; agentName?: string }

// markdown
{ title: string; content: string }

// square
{ strokeColor?: string; strokeWidth?: number; strokeStyle?: 'solid' | 'dashed' }

// text
{ label: string; fontSize: number; fontWeight?: 'normal' | 'bold' }
```

**v0.2 additions:**

```sql
CREATE TABLE runs (
  id            TEXT PRIMARY KEY,
  workflow_id   TEXT NOT NULL,
  status        TEXT NOT NULL,
  started_at    TEXT NOT NULL,
  completed_at  TEXT
);

CREATE TABLE run_events (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL,
  node_id     TEXT,
  event_type  TEXT NOT NULL,
  timestamp   TEXT NOT NULL,
  metadata_json TEXT
);
```

---

## 9. Handoff Flow

```
User clicks "Handoff" on edge or target node
        │
        ▼
HandoffDialog opens (prefill based on edge source type)
        │
        ▼
User edits prompt
        │
        ▼
invoke('herdr_agent_prompt', { paneId, text })
        │
        ▼
TerminalNode status → working (on next poll)
```

---

## 10. Canvas Toolbar

| Action | Behavior |
|--------|----------|
| Add Terminal | Creates TerminalNode + `herdr pane create` (plain shell, cwd picker) |
| Add Markdown | Creates empty MarkdownNode |
| Add Square | Creates SquareNode (400×300 default) at viewport center |
| Add Text | Creates TextNode ("Label", 18px) at viewport center |
| Handoff mode | Click source → click target → creates handoff edge |
| Fit view | xyflow `fitView()` |

---

## 11. Dependencies

### package.json (frontend)

```json
{
  "dependencies": {
    "@xyflow/react": "^12.0.0",
    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0",
    "@uiw/react-codemirror": "^4.23.0",
    "@codemirror/lang-markdown": "^6.3.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "@tauri-apps/api": "^2.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@fontsource/geist-sans": "^5.2.5",
    "@fontsource/geist-mono": "^5.2.5",
    "@phosphor-icons/react": "^2.1.7",
    "zod": "^3.23.0"
  }
}
```

### Cargo.toml (backend)

```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.32", features = ["bundled"] }
uuid = { version = "1", features = ["v4"] }
```

---

## 12. Test-Driven Development Strategy

### 12.1 Decision

All production code is written using **strict TDD** (Red → Green → Refactor). No production code without a failing test first.

### 12.2 Test Stack

| Layer | Tool | What it tests |
|-------|------|---------------|
| Frontend domain | **Vitest** | Node factories, edge payload builders, store logic |
| Frontend UI | **Vitest** + **@testing-library/react** | TextNode, SquareNode, Canvas, HandoffDialog |
| Rust domain | **cargo test** | Workflow repository, git parser, HerdrBridge |
| Integration | Vitest (Tauri invoke mocks) + cargo test (temp SQLite) | Tauri command wrappers |
| E2E (v0.2) | **Playwright** via Tauri WebDriver | Full handoff flow |

### 12.3 TDD Cycle

```
1. RED    — Write one failing test describing desired behavior
2. VERIFY — Run test, confirm it fails for the right reason
3. GREEN  — Write minimal code to pass
4. VERIFY — Run full suite, all green
5. REFACTOR — Clean up, stay green
6. REPEAT — Next behavior
```

### 12.4 Rules

1. **One behavior per test** — no `test('does X and Y')`
2. **Real code** — mock Herdr socket only at integration boundary
3. **Delete code written before tests** — restart with TDD
4. **Bug fixes** — failing test reproducing the bug first, then fix
5. **Config/scaffold** — test infrastructure setup is exempt

### 12.5 Test Order

Pure logic before UI, UI before Tauri glue.

**Done (baseline):**

| # | File | Behavior |
|---|------|----------|
| 1–3 | `nodes.test.ts` | factories + toFlowNode z-index |
| 4–5 | `workflow/lib.rs` | SQLite save/load |
| 6–7 | `TextNode.test.tsx`, `SquareNode.test.tsx` | render + click-through |
| 8a–8d | `Canvas.test.tsx`, `canvasStore.test.ts` | dot grid, node types, add nodes |

**Phase 1 — Tauri + Persistence:**

| # | File | Behavior |
|---|------|----------|
| 9 | `useCanvasPersistence.test.ts` | Debounced save after node change |
| 10 | `crates/workflow` via Tauri | `save_canvas` / `load_canvas` roundtrip |

**Phase 2 — HerdrBridge + TerminalNode:**

| # | File | Behavior |
|---|------|----------|
| 11–12 | Herdr fixtures | Parse pane list + agent status JSON |
| 13–18 | `nodes.test.ts`, `TerminalNode.test.tsx`, `canvasStore.test.ts`, `Canvas.test.tsx` | TerminalNode pane-first |

**Phase 3 — MarkdownNode + Handoff:**

| # | File | Behavior |
|---|------|----------|
| 19–24 | `handoff.test.ts`, `MarkdownNode.test.tsx`, `HandoffDialog.test.tsx`, `canvasStore.test.ts` | handoff payload + dialog |

**Phase 4 — Inspector:**

| # | File | Behavior |
|---|------|----------|
| 25–27 | git/fs Rust tests, `InspectorPanel.test.tsx` | cwd, git, tree on select |

**Phase 5 — Polish:**

| # | File | Behavior |
|---|------|----------|
| 28–29 | `TerminalNode.test.tsx`, `TextNode.test.tsx` | Force Done, fontSize config |

### 12.6 Commands

```bash
npm test                              # Frontend — run all
npm run test:watch                    # Frontend — watch
npm test src/components/canvas/Canvas.test.tsx  # Single file
cargo test -p workflow                # Rust workflow crate
npm test && cargo test -p workflow    # All
```

### 12.7 What NOT to Test

- shadcn/ui primitives (test our usage, not Button itself)
- @xyflow/react internals (test our node wrappers)
- Herdr binary behavior (test bridge parsing with fixtures)

---

## 13. Development Plan

### 13.1 Goal

Deliver **v0.1 MVP**: pane-first TerminalNodes, MarkdownNodes, manual handoff, live Herdr status — all via strict TDD.

**Exit criteria:** User can lay out `Markdown → Pane → parallel Panes`, hand off spec manually, see live status, persist across restart.

### 13.2 Current Baseline

| Item | Tests |
|------|-------|
| Node factories | 5 passed |
| TextNode + SquareNode | 3 passed |
| Canvas shell + toolbar + theme | 3 passed |
| canvasStore | 4 passed |
| Workflow SQLite repo | 2 passed (cargo) |

**Total:** `npm test` → 15 passed · `cargo test -p workflow` → 2 passed

### 13.3 Phase Overview

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 5
 Tauri       HerdrBridge   Work Nodes   Inspector     Polish
 persist     pane-first    markdown     git+tree      force done
             terminal      handoff      xterm         edges UI
```

Each phase ends with **all tests green** before starting the next.

### Phase 1 — Tauri + Persistence (~2–3 days)

**Goal:** Desktop app, canvas auto-saves to SQLite via Tauri commands.

| # | RED test | GREEN implementation |
|---|----------|---------------------|
| 1.1 | `workflow.ts`: `isTauriRuntime` returns false in jsdom | Verify |
| 1.2 | `dtoToFlowNodes` maps terminal type | Extend for terminal z-index |
| 1.3 | `useCanvasPersistence.test.ts`: debounced save | Hook with fake timers |
| 1.4 | Tauri `save_canvas` / `load_canvas` roundtrip | Wire `crates/workflow` |
| 1.5 | Manual: drag node, restart, position restored | — |

**Done when:** `npm run tauri:dev` launches, canvas persists, all tests green.

### Phase 2 — HerdrBridge + TerminalNode (~3–4 days)

**Goal:** Pane-first TerminalNode with live output preview and status badge.

| # | RED test | GREEN implementation |
|---|----------|---------------------|
| 2.1–2.2 | Herdr fixture parsing | `HerdrBridge::parse_pane_list`, `AgentStatus` |
| 2.3 | `createTerminalNodeData` defaults | Factory |
| 2.4–2.6 | `TerminalNode.test.tsx` | idle badge, working icon, output preview |
| 2.7–2.8 | `canvasStore`, `Canvas.test.tsx` | addTerminalNode, register node type |
| 2.9 | `herdr_pane_create` Tauri command | `commands/herdr.rs` |
| 2.10 | Manual: Add Terminal → plain shell in xterm | — |

**Done when:** Add Terminal creates Herdr pane, shows idle badge + preview, status updates with real Herdr.

### Phase 3 — MarkdownNode + Handoff (~3–4 days)

**Goal:** End-to-end manual handoff: Markdown → Pane.

| # | RED test | GREEN implementation |
|---|----------|---------------------|
| 3.1–3.2 | `createMarkdownNodeData`, `MarkdownNode.test.tsx` | Factory + CodeMirror embed |
| 3.3–3.4 | `handoff.test.ts` | `buildHandoffPayload` markdown→terminal, terminal→terminal |
| 3.5–3.6 | `HandoffDialog.test.tsx` | Prefilled payload + send |
| 3.7–3.8 | `canvasStore`, `Canvas.test.tsx` | addEdge, register markdown type |
| 3.9 | Manual: draw edge, handoff sends prompt | — |

**Done when:** MarkdownNode editable, handoff to Terminal works, fan-out manual handoff works.

### Phase 4 — Inspector (~2–3 days)

**Goal:** Click TerminalNode → see cwd, file tree, git status.

| # | RED test | GREEN implementation |
|---|----------|---------------------|
| 4.1–4.2 | git/fs Rust tests | `git_status`, `fs_tree` commands |
| 4.3–4.5 | `InspectorPanel.test.tsx` | cwd, git, tree on select |
| 4.6 | `TerminalNode.test.tsx`: expand opens xterm | xterm.js + pane read poll |
| 4.7 | Manual: click terminal → inspector populates | — |

**Done when:** Inspector shows cwd, tree (depth 3), git branch + change count, xterm expand works.

### Phase 5 — Polish + MVP Sign-off (~2 days)

| # | RED test | GREEN implementation |
|---|----------|---------------------|
| 5.1 | Force Done sets local status | Context menu action |
| 5.2 | fontSize config panel | Node config panel |
| 5.3 | Square resize updates dimensions | NodeResizeControl |
| 5.4 | Herdr not installed → install guide | Error banner |
| 5.5 | E2E manual script + screenshots | `/screenshot` folder |

### 13.4 Test Count Targets

| Milestone | Vitest | Cargo | Total |
|-----------|--------|-------|-------|
| Baseline (now) | 15 | 2 | 17 |
| Phase 1 done | ~18 | 4 | ~22 |
| Phase 2 done | ~30 | 8 | ~38 |
| Phase 3 done | ~42 | 8 | ~50 |
| Phase 4 done | ~50 | 12 | ~62 |
| Phase 5 / MVP | ~55 | 12 | ~67 |

### 13.5 First Sprint (Start Here)

**Sprint 1 = Phase 1 + Phase 2.1–2.4**

Day 1: Herdr fixture spike, `createTerminalNodeData`, Tauri save/load wire-up  
Day 2: `TerminalNode.test.tsx` idle badge, `TerminalNode.tsx` + `StatusIcon`, register in Canvas  
Day 3: `herdr_pane_create`, `addTerminalNode` in store + toolbar, manual test

---

## 14. Workshop Guide (1 Jam)

### 14.1 Workshop Goal

Dalam **60 menit**, peserta punya **canvas interaktif di browser** yang bisa:

- Pan/zoom dot-grid canvas
- Tambah **Text** dan **Square** node dari toolbar
- Drag node bebas di canvas
- Square frame click-through (garis saja, interior transparan)
- Dark/light mode (system preference)
- Semua test hijau (`npm test && cargo test -p workflow`)

**Bukan target workshop:** Tauri desktop, Herdr, TerminalNode, Inspector, persistence UI, handoff.

### 14.2 Scope Matrix

| Feature | Pre-baked | Workshop (live) | Homework |
|---------|-----------|-----------------|----------|
| Domain factories | Done | Review | — |
| TextNode + SquareNode | Done | Review | Resize square |
| Workflow SQLite repo | Done | Review | Wire ke Tauri |
| Vitest + cargo test | Done | Run | — |
| Vite app + Tailwind | — | **Build** | — |
| xyflow Canvas | — | **Build (TDD)** | — |
| Toolbar + theme | — | **Build** | — |
| Tauri shell | — | — | Post-workshop |
| HerdrBridge | — | — | Phase 2 |

### 14.3 Agenda

| Blok | Menit | Aktivitas |
|------|-------|-----------|
| 0 — Setup | 0:00–0:05 | Intro, clone, `npm test` (8 passed) |
| 1 — App Shell | 0:05–0:15 | Vite, Tailwind, design tokens, ThemeProvider |
| 2 — Canvas TDD | 0:15–0:35 | **INTI:** Canvas.test.tsx RED→GREEN, nodeTypes, store |
| 3 — Toolbar | 0:35–0:50 | CanvasToolbar, add node, drag, z-index |
| 4 — Demo | 0:50–1:00 | Layout project, all tests green, roadmap Q&A |

### 14.4 Workshop Success Criteria

- [ ] `npm test` — min. 12 tests passed
- [ ] `npm run dev` — canvas tampil di browser
- [ ] Bisa add Text + Square dari toolbar
- [ ] Bisa drag node
- [ ] Dark mode toggle works
- [ ] Square interior click-through

### 14.5 Homework (Post-Workshop)

1. Tauri wrap — merge `src/` existing
2. Wire `crates/workflow` — Tauri `save_canvas` / `load_canvas`
3. MarkdownNode — CodeMirror embed (TDD)
4. HerdrBridge spike — fixture JSON
5. TerminalNode — status icons Phosphor

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Herdr not installed | App cannot connect | Check on launch, show install guide |
| Herdr socket API changes | HerdrBridge breaks | Pin to documented API, fixture tests on CI |
| Square click-through breaks on some platforms | Cannot click nodes inside frame | Test SVG `pointer-events: stroke` on all platforms |
| xterm.js poll latency feels sluggish | Poor terminal UX | 500ms poll when expanded; socket subscribe v0.2 |
| SQLite write on every drag | Performance on large canvases | Debounce save 500ms after position change |
| Herdr pane ID stale after restart | Broken TerminalNode bindings | Show "disconnected" badge; offer re-bind UI |
| Herdr not installed on dev machine | Phase 2 blocked | Spike + fixture tests before live integration |
| Tauri compile slow | Slow iteration | Phase 1 only — don't block on full rebuild every test |
| CodeMirror heavy in canvas | Slow tests | Mock editor in unit tests; real editor in manual test |

---

## 16. Decisions Log

| Decision | Choice | Alternatives Considered |
|----------|--------|------------------------|
| App shell | Tauri 2 | Electron (too heavy) |
| Canvas library | @xyflow/react | tldraw, React Flow v11 |
| Terminal backend | Herdr | Embedded PTY, Orca CLI (macOS-only) |
| Square grouping | Line frame, click-through, independent | Parent-child group (rejected) |
| Herdr connection | connect_or_spawn | Always spawn (rejected) |
| Output streaming v0.1 | Poll pane_read | Socket subscribe (deferred v0.2) |
| DB | rusqlite (`crates/workflow`) | drizzle-orm, JSON file |
| Markdown editor | CodeMirror 6 | Milkdown, textarea |
| Design system | Monochrome zinc + Geist | Purple accent, Inter font |
| Theme | System preference + override | Dark-only, light-only |
| Motion v0.1 | CSS transitions only | Framer Motion (deferred v0.2) |
| TDD | Strict Red→Green→Refactor | Test-after (rejected) |

---

## 17. References

- [PRD.md](../prd/PRD.md) — Product requirements and design system
- [CONTEXT.md](../CONTEXT.md) — Domain glossary
- [agents.md](../agents.md) — Agent operating rules
- [Orca ADE](https://www.onorca.dev/) — inspiration for Inspector
- [Herdr](https://herdr.dev/) — terminal backend
- [Herdr CLI docs](https://herdr.dev/docs/cli/pane)
- [@xyflow/react docs](https://reactflow.dev/)
- [Tauri 2 docs](https://v2.tauri.app/)
