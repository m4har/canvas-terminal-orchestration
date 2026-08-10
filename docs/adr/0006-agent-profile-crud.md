# ADR 0006: AgentProfile CRUD and Global Skill Discovery

**Status:** Accepted  
**Date:** 2026-08-10  
**Related:** ADR 0005 (OrchestraAgent runtime)

## Context

OrchestraAgent profiles were seeded as read-only bundled rows in SQLite. Users need to customize system prompts and attach skills without forking the app. Skills installed via `npx skills` live under `~/.agents/skills/{id}/SKILL.md`.

## Decision

1. **Bundled profiles** (`is_bundled=1`) remain read-only. Users **duplicate** a bundled profile to create an editable custom copy.
2. **Custom profiles** support full CRUD in Settings. Deletion is blocked when an OrchestraAgent references the profile.
3. **Profile skills** are stored as a JSON array of **skill ids** (directory names), not absolute paths.
4. **Skill discovery** scans `~/.agents/skills` and `~/.cursor/skills-cursor`, preferring `.agents/skills` on id collision.
5. **In-app skill creation** writes new skills to `~/.agents/skills/{id}/SKILL.md` with a minimal frontmatter template.

## Consequences

**Positive:**

- Profiles and skills align with the `npx skills` global layout
- Bundled defaults stay stable; customization is explicit via duplicate
- Play-time preamble resolves skills from live filesystem state

**Negative:**

- Skill ids in profiles can go stale if a skill is uninstalled from disk
- No in-app `npx skills add` shell bridge in v0.1

## Follow-up

- Per-agent skill override UI in Agent Inspector
- Project-local `.cursor/skills` discovery
- Skill staleness indicator in profile editor
