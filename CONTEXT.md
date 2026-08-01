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
| **Run** | A single execution instance of a Workflow. Introduced in v0.2. |
| **RunEvent** | A timestamped log entry during a Run (e.g. node done, blocked, handoff fired). Introduced in v0.2. |

## Nodes

| Term | Definition |
|------|------------|
| **TerminalNode** | A canvas node bound to a **Herdr pane** (PTY session). Starts as a plain shell — the user freely starts any agent runtime inside it (`pi`, `opencode`, `claude`, etc.) via Herdr. Displays live pane output and agent status when an agent is active. |
| **Pane** | A Herdr terminal session. One TerminalNode maps to exactly one pane ID. Source of truth for terminal output. |
| **MarkdownNode** | A canvas node holding spec, instructions, or context to be sent to a downstream pane via handoff. |
| **Inspector** | A side panel (not a canvas node) shown when a TerminalNode is selected. Displays working directory, folder tree, and git status. |

## Edges & Communication

| Term | Definition |
|------|------------|
| **Edge** | A directed connection between two nodes on the canvas. |
| **Handoff** | A manual edge type. User composes the prompt in a dialog before sending it to the target pane via Herdr. |
| **Trigger** | An automatic edge type. Fires when the upstream TerminalNode reaches `done`. Introduced in v0.2. |
| **Fan-out** | One upstream node connected to multiple downstream TerminalNodes (parallel branches). Layout is free on canvas; execution is manual in v0.1, automatic via trigger in v0.2. |
| **Join** | Waits until all upstream branches reach `done` before firing downstream. Introduced in v0.3. |
| **Loop** | Iteration cycle: agent output updates context (e.g. MarkdownNode) → re-handoff → next agent run. Introduced in v0.3. |
| **Force Done** | User override that marks a TerminalNode as `done` when Herdr state is stuck or the pane is still a plain shell without semantic agent state. |

## Backend

| Term | Definition |
|------|------------|
| **HerdrBridge** | The Tauri Rust layer that connects to Herdr via `connect_or_spawn()`, creates panes, reads pane output, and queries agent status. |
| **Herdr** | External terminal multiplexer providing real PTY sessions, agent lifecycle state, and a JSON socket API. Source of truth for live terminal output and inter-agent communication. Canvas does not embed or replace Herdr — it supervises and routes context between panes. |

## Responsibility Split

| Layer | Owns |
|-------|------|
| **Herdr** | PTY sessions, agent runtimes, agent-to-agent prompts, lifecycle state (`idle` / `working` / `blocked` / `done`) |
| **Canvas Orchestra** | Visual layout, context routing (handoff/trigger), status display, workflow persistence |
| **MarkdownNode** | Spec/plan source of truth on canvas |
