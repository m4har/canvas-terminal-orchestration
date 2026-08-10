# Domain Glossary

Ubiquitous language for Canvas Orchestra Loop Engineer. Implementation details belong in RFC, not here.

## Canvas & Layout

| Term | Definition |
|------|------------|
| **Canvas** | Visual workspace where nodes and edges are placed and arranged. |
| **Square** | A stroke-only rectangular frame on the canvas. Interior is transparent and click-through. Only the border is draggable. Used to visually group nodes by project or area. Moving a Square does not move nodes inside it. |
| **Text** | A standalone label node with configurable font size. Typically used as a header for a Square or project area. |

## Workflow & Execution

| Term | Definition |
|------|------------|
| **Workflow** | A saved template of nodes and edges representing a repeatable process. |
| **Demo Workflow** | Pre-built canvas layout (Auth Refactor) with mock terminal previews for onboarding. |
| **Intro** | First-run guided overlay explaining canvas concepts before the user starts working. |
| **Run** | A single execution instance of a Workflow. Introduced in v0.2. |
| **RunEvent** | A timestamped log entry during a Run (e.g. node done, blocked, handoff fired). Introduced in v0.2. |

## Nodes

| Term | Definition |
|------|------------|
| **OrchestraAgent** | Named, reusable agent identity persisted app-wide. Owns profile, skills, model choice, and memory files. Distinct from a Herdr CLI agent in a TerminalNode. |
| **AgentNode** | Canvas widget that references one OrchestraAgent and a project working directory. Supports manual Play with streamed LLM output. |
| **AgentProfile** | Role template for OrchestraAgent. **Bundled** profiles (planner, designer, etc.) are read-only seeds; **custom** profiles are user-created or duplicated from bundled. Each profile has a display name, system prompt template, and default skill ids. |
| **AgentSkill** | Instruction file (`SKILL.md`) discovered from global skill directories (`~/.agents/skills`, `~/.cursor/skills-cursor`). Stored in a profile as a skill id (directory name); injected into the system prompt at Play time. |
| **AgentMemory** | Two-layer memory for an OrchestraAgent: global persona/history file per agent slug, plus project-scoped overlay in the agent's working directory. |
| **Play** | Manual execution of an AgentNode: compose prompt, call LLM, stream response. Distinct from Handoff, which targets a terminal PTY. |
| **LLMSettings** | Global app configuration for OrchestraAgent runtime: provider, base URL, and API key. |
| **McpServer** | Global registry entry for a Model Context Protocol server — local stdio subprocess or remote HTTP/SSE endpoint. |
| **AgentMcpBinding** | Per-OrchestraAgent selection of which global McpServers are enabled for that agent at Play time. |
| **TerminalNode** | A canvas node with an embedded local PTY (LocalShell) or a Herdr-bound session (HerdrBound). Starts as a plain local shell for instant I/O; user may bind to a Herdr pane for agent orchestration. Displays live PTY output and agent status when bound. |
| **LocalShell** | TerminalNode mode before Herdr bind — embedded PTY only, badge shows `local`. |
| **HerdrBound** | TerminalNode whose PTY runs inside a Herdr pane via exec takeover; pane ID required for handoff and status poll. |
| **Bind Herdr** | User or handoff action that provisions a pane ID (if missing) and exec-takeovers the active PTY into that pane. |
| **Pane** | A Herdr terminal session. Required only after bind — one TerminalNode maps to one pane ID when HerdrBound. Source of truth for agent lifecycle; display I/O flows through the embedded PTY. |
| **MarkdownNode** | A canvas node holding spec, instructions, or context to be sent to a downstream pane via handoff. |
| **Inspector** | A side panel (not a canvas node) shown when a TerminalNode is selected. Displays working directory, folder tree, and git status. |

## Edges & Communication

| Term | Definition |
|------|------------|
| **Edge** | A directed connection between two nodes on the canvas. |
| **Handoff** | A manual edge type. User composes the prompt in a dialog before sending it to the target pane. LocalShell targets receive the payload via OrchestratorBus PTY write; HerdrBound targets use Herdr CLI prompt. |
| **Trigger** | An automatic edge type. Fires when the upstream TerminalNode reaches `done`. Introduced in v0.2. |
| **Fan-out** | One upstream node connected to multiple downstream TerminalNodes (parallel branches). Layout is free on canvas; execution is manual in v0.1, automatic via trigger in v0.2. |
| **Join** | Waits until all upstream branches reach `done` before firing downstream. Introduced in v0.3. |
| **Loop** | Iteration cycle: agent output updates context (e.g. MarkdownNode) → re-handoff → next agent run. Introduced in v0.3. |
| **Force Done** | User override that marks a TerminalNode as `done` when parser state is stuck or the pane is still a plain shell without semantic agent state. LocalShell overrides call `orchestrator_force_done` on the bus. |

## Backend

| Term | Definition |
|------|------------|
| **Herdr** | External terminal multiplexer providing agent lifecycle state and a JSON socket API. Canvas embeds a local PTY for interactive I/O; Herdr owns pane lifecycle and agent semantics after bind. |
| **HerdrPresent** | A Herdr binary is available to Canvas — on the user PATH or in app-managed storage after download. |
| **HerdrConnected** | The Herdr server is running and HerdrBridge has an active socket connection. |
| **HerdrBridge** | The Tauri Rust layer that resolves the Herdr binary, runs `connect_or_spawn()`, holds a persistent socket to Herdr, and exposes pane I/O to the frontend. Tracks whether Canvas spawned the server so shutdown only kills sidecar-spawned sessions. Optional for LocalShell handoff and status. |
| **OrchestratorBus** | In-process Canvas service that routes handoff messages to terminal PTYs and derives agent lifecycle state from output streams. |
| **AgentSession** | A tracked terminal session (PTY id + optional agent kind) registered with OrchestratorBus. |
| **MessageDispatch** | Delivery of a handoff payload to a target AgentSession via PTY write, without Herdr CLI. |

## Responsibility Split

| Layer | Owns |
|-------|------|
| **Canvas PTY** | Interactive terminal I/O (LocalShell and HerdrBound display path) |
| **OrchestratorBus** | LocalShell handoff dispatch and push status from PTY output (no Herdr CLI) |
| **Herdr** | Pane lifecycle after bind, agent runtimes, agent-to-agent prompts, lifecycle state (`idle` / `working` / `blocked` / `done`) for HerdrBound nodes |
| **Canvas Orchestra** | Herdr lifecycle (binary install, server spawn/shutdown), lazy bind, visual layout, context routing (handoff/trigger), status display, workflow persistence, OrchestraAgent registry, global LLM/MCP settings |
| **MarkdownNode** | Spec/plan source of truth on canvas |
