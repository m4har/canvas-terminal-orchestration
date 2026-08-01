# Agents — Canvas Orchestra Loop Engineer

**Version:** 0.1  
**Last updated:** 2026-08-01  
**Status:** Active

This document defines the architecture, behavior, and operating rules for all AI agents in this project — both **runtime agents** orchestrated on the canvas via Herdr and **development agents** (Cursor, Claude Code, Codex, etc.) that implement and maintain this codebase.

---

## 1. Executive Summary

Canvas Orchestra Loop Engineer is a visual orchestration layer for AI coding agents. It does not embed or replace agent runtimes. Instead, it:

- Binds **TerminalNodes** on a canvas to live Herdr panes running CLI agents (Claude Code, Codex, OpenCode, and others).
- Stores **MarkdownNodes** as specs and context to be handed off downstream.
- Routes work between agents via **Handoff** edges (manual, v0.1) and **Trigger** edges (automatic on `done`, v0.2).
- Surfaces agent state (`idle`, `working`, `blocked`, `done`) and workspace context (cwd, file tree, git status) without switching terminals.

**Purpose of AI agents in this codebase:**

| Agent class | Role | Runtime |
|-------------|------|---------|
| **Orchestrated agents** | Execute coding tasks in real PTY sessions, bound to canvas TerminalNodes | Herdr (`herdr agent start`, `herdr agent prompt`) |
| **Development agents** | Implement features, fix bugs, write tests for this repository | Cursor IDE, Claude Code, Codex, or any Herdr-supported runtime |
| **Coordinator (human or agent)** | Layout workflows on canvas, compose handoff prompts, override stuck states | Canvas Orchestra UI |

Agents are the execution engine. Canvas Orchestra is the supervision and routing layer. Herdr is the source of truth for terminal output and agent lifecycle state.

**Non-goals (v0.1):**

- Built-in agent execution inside the Tauri app
- Replacing Orca, Cursor, or the Herdr TUI
- Remote Herdr over SSH
- Auto-trigger edges or run history (deferred to v0.2)

---

## 2. System Prompt & Persona

### 2.1 Core Persona

All agents operating in or on this project must adopt the following persona:

- **Authoritative and precise.** Use domain terms from `CONTEXT.md` exactly. Do not invent synonyms (`TerminalNode`, not "agent card"; `Handoff`, not "transfer").
- **Lazy senior engineer.** Prefer the smallest correct change. Reuse existing helpers and patterns before writing new code. Delete over add.
- **Test-first.** No production code without a failing test first (RFC §12). One behavior per test.
- **Local-first.** SQLite persistence, Herdr socket connection, no cloud dependencies for core flows.
- **Canvas-aware.** Respect spatial layout semantics: Square frames are visual-only (click-through interior, independent node positioning).

### 2.2 Hard Constraints

Agents **must**:

- [ ] Read `CONTEXT.md` before using domain terminology
- [ ] Follow locked architecture decisions in RFC (Tauri 2, `@xyflow/react`, `rusqlite`, Herdr `connect_or_spawn`)
- [ ] Use Geist Sans / Geist Mono typography and monochrome zinc palette (PRD §15)
- [ ] Represent agent status with Phosphor icons only — no colored status dots
- [ ] Debounce canvas persistence at 500ms (`useCanvasPersistence`)
- [ ] Poll Herdr agent status at 2s intervals when TerminalNodes are active (RFC §6.3)
- [ ] Treat Herdr as source of truth for terminal transcripts — do not persist output in SQLite

Agents **must not**:

- [ ] Introduce `drizzle-orm`, Electron, Framer Motion, or Inter font
- [ ] Use purple/blue AI gradient aesthetics, emoji in UI, or `h-screen`
- [ ] Make Square nodes parent containers — moving a Square does not move child nodes
- [ ] Kill an externally started Herdr session on app quit (only kill sidecar-spawned sessions)
- [ ] Skip TDD for production code (config/scaffold setup is exempt)
- [ ] Commit changes unless explicitly requested by the user

### 2.3 Tone & Communication

| Context | Tone |
|---------|------|
| Handoff prompts to runtime agents | Direct, task-oriented, include cwd and acceptance criteria |
| Code changes in this repo | Concise diffs, cite existing patterns, no over-engineering |
| User-facing UI copy | Minimal chrome, developer-tool register, no marketing language |
| Error states | Actionable (e.g. Herdr not installed → install guide with `curl -fsSL https://herdr.dev/install.sh \| sh`) |

### 2.4 Agent Status Semantics

Runtime agents report state via Herdr. Canvas Orchestra maps these to TerminalNode badges:

| Herdr state | UI icon (Phosphor) | Meaning |
|-------------|-------------------|---------|
| `idle` | `Minus` | Ready, no active task |
| `working` | `CircleNotch` (spin) | Processing a prompt |
| `blocked` | `Pause` | Waiting for user input or approval |
| `done` | `Check` | Task completed |

**Force Done** is a user override that marks a TerminalNode `done` locally without sending a prompt — used when Herdr state is stuck or the pane is a plain shell.

---

## 3. Available Tools & Capabilities

### 3.1 Runtime Agents (via Herdr)

Herdr provides the tool surface for orchestrated agents. Supported runtimes:

| Kind | CLI runtime | Typical use |
|------|-------------|-------------|
| `claude` | Claude Code | Feature implementation, refactoring |
| `codex` | Codex | Code generation, test writing |
| `opencode` | OpenCode | Full-stack tasks |
| `hermes` | Hermes Agent | Review, planning |
| `pi` | Pi | Lightweight tasks |
| `omp` | Oh-My-Posit | Shell-adjacent workflows |

**Herdr commands used by Canvas Orchestra (v0.1):**

```bash
herdr workspace create --cwd <path> --label <name>   # New agent pane with cwd
herdr pane list                                       # Discover panes on reconnect
herdr pane read <pane_id> [--lines N]                 # Terminal output (polled 500ms when expanded)
herdr agent status <name>                             # Poll TerminalNode badge (2s interval)
herdr agent prompt <name> "<text>"                    # Send handoff payload
herdr pane send <pane_id> "<text>"                    # Alternative prompt delivery
```

**Tauri bridge commands** (Rust → React via `invoke`):

| Command | Purpose |
|---------|---------|
| `herdr_connect` | `connect_or_spawn` lifecycle |
| `herdr_pane_list` | List available panes |
| `herdr_pane_read` | Read pane output |
| `herdr_agent_status` | Poll agent state |
| `herdr_agent_prompt` | Send prompt to agent |
| `herdr_pane_create` | Create pane with cwd |
| `git_status` | Inspector git section |
| `fs_tree` | Inspector file tree (max depth 3) |
| `load_canvas` / `save_canvas` | SQLite workflow persistence |

> **Implementation note:** HerdrBridge Tauri commands are defined in RFC §6.2 and scheduled for Phase 2. Current repo wires `load_canvas` / `save_canvas` only.

### 3.2 Development Agents (Cursor / IDE)

Development agents working on this repository have access to:

| Capability | Scope | Commands / tools |
|------------|-------|------------------|
| **File system** | Read/write workspace files | Editor, `Read`, `Write`, `StrReplace` |
| **Terminal execution** | Shell commands in project root | `npm test`, `cargo test -p workflow`, `npm run dev`, `npm run tauri:dev` |
| **Search** | Codebase navigation | `Grep`, `Glob`, semantic search |
| **Git** | Status, diff, branch ops | `git status`, `git diff`, `gh` for PRs |
| **Browser** | UI verification (when dev server running) | MCP browser tools |
| **Subagents** | Parallel exploration or review | Task tool (`explore`, `shell`, `bugbot`, etc.) |

### 3.3 Testing Capabilities

| Layer | Tool | Command |
|-------|------|---------|
| Frontend domain | Vitest | `npm test` |
| Frontend UI | Vitest + Testing Library | `npm test src/components/canvas/Canvas.test.tsx` |
| Frontend watch | Vitest | `npm run test:watch` |
| Rust domain | cargo test | `cargo test -p workflow` |
| Full suite | Both | `npm test && cargo test -p workflow` |
| E2E (v0.2) | Playwright via Tauri WebDriver | Not yet configured |

**Mocking boundaries:**

- Mock Herdr socket only at integration boundary
- Use fixture JSON (`crates/workflow/tests/fixtures/herdr_pane_list.json`) for bridge parsing tests
- Do not mock domain logic in unit tests

---

## 4. Collaboration & Routing Workflow

### 4.1 Canvas Topology

A typical multi-agent layout per project area:

```
Text: "Auth Refactor" (24px, bold)

┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                     │
│   [PRD Spec]  ──handoff──▶  [Claude]│
│   (markdown)                (term)  │
│                                     │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

| Node type | Role in routing |
|-----------|-----------------|
| **MarkdownNode** | Upstream spec/context source for handoffs |
| **TerminalNode** | Downstream execution target (Herdr-bound) |
| **Square** | Visual project boundary (no routing semantics) |
| **Text** | Section header (no edges) |

### 4.2 Handoff Flow (v0.1 — Manual)

```
User clicks Handoff on edge or target TerminalNode
        │
        ▼
HandoffDialog opens with prefilled payload:
  • MarkdownNode → TerminalNode: full markdown content
  • TerminalNode → TerminalNode: last 50 lines + upstream markdown ref
        │
        ▼
User edits prompt in compose dialog
        │
        ▼
invoke('herdr_agent_prompt', { paneId, text })
        │
        ▼
Target TerminalNode status → working (on next 2s poll)
```

**Routing rules:**

- [ ] Handoff edges are always user-initiated in v0.1
- [ ] User must review and edit the composed prompt before send
- [ ] Only TerminalNodes receive prompts — MarkdownNodes and Text nodes are sources only
- [ ] Text nodes do not support edges

### 4.3 Trigger Flow (v0.2 — Automatic)

Deferred. Will fire when upstream TerminalNode reaches Herdr `done` state.

Default payload:

- Markdown ref from upstream MarkdownNode (if connected)
- Status `done`
- Last 50 lines of terminal output

### 4.4 Multi-Agent Coordination Patterns

| Pattern | Layout | Routing |
|---------|--------|---------|
| **Spec → Implement** | MarkdownNode → TerminalNode | Manual handoff with full spec |
| **Implement → Review** | TerminalNode → TerminalNode | Handoff with output tail + context |
| **Parallel projects** | Multiple Square-framed areas | Independent handoff chains per area |
| **Stuck recovery** | Any TerminalNode | Force Done → manual next step or v0.2 trigger |

### 4.5 Development Agent Routing

When multiple development agents or subagents work on this codebase:

| Task type | Route to | Rationale |
|-----------|----------|-----------|
| Broad codebase exploration | `explore` subagent | Fast parallel search |
| Shell/git/CI operations | `shell` subagent | Isolated command execution |
| Bug fix with failing test | Primary agent | TDD cycle requires continuity |
| Security review of diff | `security-review` subagent | Specialized analysis |
| PR comment triage | `ci-investigator` subagent | Check-specific diagnosis |

**Handoff between development agents:** Use explicit context files (`CONTEXT.md`, relevant RFC section) in the prompt. Do not assume shared memory across sessions.

### 4.6 Herdr Connection Lifecycle

```
App launch
    │
    ▼
HerdrBridge.connect_or_spawn()
    ├── Existing socket found → reuse (do not kill on quit)
    └── No socket → spawn `herdr server` sidecar (kill on quit)
    │
    ▼
Bind TerminalNodes to pane IDs
    │
    ▼
Poll agent status (2s) + pane read (500ms when terminal expanded)
```

---

## 5. Context & Memory Guidelines

### 5.1 Required Reading (in order)

Before acting on any task, agents **must** consult:

| Priority | File | Purpose |
|----------|------|---------|
| 1 | [`CONTEXT.md`](./CONTEXT.md) | Domain glossary — ubiquitous language |
| 2 | [`prd/PRD.md`](./prd/PRD.md) | MVP scope, user stories, design system, acceptance criteria |
| 3 | [`rfc/RFC.md`](./rfc/RFC.md) | Architecture, HerdrBridge, TDD, development plan, workshop |

**Read additionally when relevant:**

| File | When |
|------|------|
| [`rfc/RFC.md`](./rfc/RFC.md) §14 | Workshop guide, canvas/toolbar implementation |
| `src/lib/nodes.ts` | Node factory changes |
| `src/lib/types.ts` | Type additions for new node kinds |
| `crates/workflow/src/repo.rs` | Persistence schema changes |
| `src-tauri/src/lib.rs` | Tauri command registration |

### 5.2 Memory Boundaries

| Data | Persisted | Source of truth |
|------|-----------|-----------------|
| Node positions, sizes, config | SQLite (`canvas.db`) | Canvas Orchestra |
| MarkdownNode content | SQLite | Canvas Orchestra |
| TerminalNode ↔ pane bindings | SQLite | Canvas Orchestra |
| Terminal output transcripts | **Not persisted** | Herdr |
| Agent lifecycle state | **Not persisted** | Herdr (polled) |
| Git status | **Not persisted** | Live `git status` on Inspector open |
| Theme preference | localStorage / SQLite | Canvas Orchestra |

### 5.3 Tech Stack Rules

Agents implementing code **must** adhere to:

| Layer | Locked choice | Do not substitute |
|-------|---------------|-------------------|
| App shell | Tauri 2 | Electron |
| Canvas | `@xyflow/react` v12+ | tldraw, React Flow v11 |
| State | Zustand | Redux, Jotai |
| Database | `rusqlite` in `crates/workflow` | drizzle-orm, JSON files |
| Terminal backend | Herdr | Embedded PTY, Orca CLI |
| Styling | Tailwind CSS 4 + shadcn/ui | CSS modules, styled-components |
| Markdown editor | CodeMirror 6 | Milkdown, plain textarea |
| Fonts | Geist Sans + Geist Mono | Inter |

### 5.4 Code Conventions

- Match surrounding file style (naming, imports, component structure)
- Domain factories in `src/lib/nodes.ts` — do not duplicate defaults inline
- `toFlowNode()` sets `zIndex: -1` for square nodes
- Tauri commands in `src-tauri/src/commands/`, bridge logic in `src-tauri/src/herdr/`
- React components in `src/components/` grouped by feature (`canvas/`, `theme/`)

---

## 6. Output & Quality Standards

### 6.1 Definition of Done

A feature is **done** when all of the following are true:

- [ ] Failing test written first, then minimal implementation (RFC §12 cycle)
- [ ] `npm test` passes (all Vitest suites green)
- [ ] `cargo test -p workflow` passes (if Rust touched)
- [ ] No linter errors introduced in edited files
- [ ] Matches PRD acceptance criteria for the relevant user story
- [ ] Respects design system tokens (PRD §15) — no banned anti-patterns
- [ ] Canvas state persists across restart (when persistence is in scope)
- [ ] Herdr integration uses fixture-based tests before live binary calls

### 6.2 TDD Protocol

```
1. RED     — Write one failing test describing desired behavior
2. VERIFY  — Confirm failure is for the right reason
3. GREEN   — Write minimal code to pass
4. VERIFY  — Full suite green
5. REFACTOR — Clean up, stay green
6. REPEAT  — Next behavior
```

**Rules:**

- One behavior per test — no `test('does X and Y')`
- Bug fixes require a failing reproduction test first
- Delete code written before tests; restart with TDD
- Do not test shadcn/ui primitives or `@xyflow/react` internals — test our wrappers

### 6.3 Test Order (Dependency Chain)

```
Domain factories (nodes.ts)
    → SQLite repository (crates/workflow)
    → Node components (TextNode, SquareNode, TerminalNode)
    → Canvas integration (Canvas.test.tsx)
    → Store / persistence (canvasStore, useCanvasPersistence)
    → Tauri commands (HerdrBridge, git, fs)
    → E2E handoff flow (v0.2)
```

### 6.4 Verification Commands

```bash
# Required before claiming work complete
npm test && cargo test -p workflow

# During development
npm run test:watch

# Single file
npm test src/components/canvas/Canvas.test.tsx

# Dev server (browser)
npm run dev

# Tauri desktop
npm run tauri:dev
```

### 6.5 Linting & Type Checking

| Check | Command | When |
|-------|---------|------|
| TypeScript | `tsc --noEmit` (via editor / build) | Before commit |
| Vitest | `npm test` | Every feature / bugfix |
| Rust compile | `cargo test -p workflow` | Any `crates/` or `src-tauri/` change |
| Visual review | `npm run dev` or `npm run tauri:dev` | UI changes |

### 6.6 MVP v0.1 Success Checklist

From PRD §14 — the project is MVP-complete when:

- [ ] App launches and connects to Herdr without manual setup
- [ ] User can place TerminalNode, MarkdownNode, Square, and Text on canvas
- [ ] TerminalNode shows live Herdr agent status
- [ ] Inspector shows cwd, folder tree, and git status on TerminalNode click
- [ ] Handoff from MarkdownNode to TerminalNode sends prompt via Herdr
- [ ] Square frame is click-through inside, draggable by border only
- [ ] Text node font size is configurable
- [ ] Canvas state persists across app restart

### 6.7 Implementation Phases

| Phase | Scope | Agent focus |
|-------|-------|-------------|
| Workshop | Canvas + Text/Square nodes | TDD canvas, design tokens |
| Phase 1 | Tauri wrap, persistence UI | Wire `crates/workflow` to Tauri |
| Phase 2 | HerdrBridge | Socket spike, fixture tests, status polling |
| Phase 3 | Work nodes | MarkdownNode, HandoffDialog, end-to-end handoff |
| Phase 4 | Inspector | git_status, fs_tree, xterm.js expand |
| Phase 5 | Polish | Force Done, config panels, error states |

---

## Appendix A — Node Data Schemas

```typescript
// terminal — pane-first; agentKind cosmetic after user starts agent in Herdr
{ label: string; herdrPaneId: string; cwd: string; agentKind?: string; agentName?: string }

// markdown
{ title: string; content: string }

// square
{ strokeColor?: string; strokeWidth?: number; strokeStyle?: 'solid' | 'dashed'; width: number; height: number }

// text
{ label: string; fontSize: number; fontWeight?: 'normal' | 'bold' }
```

## Appendix B — Key File Map

```
CONTEXT.md                          Domain glossary (read first)
agents.md                           This file
prd/PRD.md                          Product requirements + design system
rfc/RFC.md                          Architecture, TDD, orchestration, dev plan, workshop
src/lib/nodes.ts                    Node factories
src/lib/types.ts                    TypeScript types
src/stores/canvasStore.ts           Zustand canvas state
src/hooks/useCanvasPersistence.ts   Debounced SQLite save
crates/workflow/                    Rust persistence crate
src-tauri/                          Tauri shell + commands
```

## Appendix C — References

- [Herdr](https://herdr.dev/) — terminal multiplexer for AI agents
- [Herdr CLI docs](https://herdr.dev/docs/cli/pane)
- [@xyflow/react docs](https://reactflow.dev/)
- [Tauri 2 docs](https://v2.tauri.app/)
- [Orca ADE](https://www.onorca.dev/) — inspiration for Inspector panel
