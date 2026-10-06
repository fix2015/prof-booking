---
name: load-registry
description: Use this skill when the user asks to find, search, discover, install, or suggest skills, hooks, agents, rules, or MCP servers for their AI coding setup. Triggers on: "find a skill", "suggest hooks", "search agents", "install rule", "add MCP server", "what skills exist for", "recommend", "load-skill", "load-hooks", "load-agents", "load-rules", "load-mcp", or any request to enhance the AI coding environment with community extensions.
---

# Load Registry — Discover & Install AI Coding Extensions

Search and install community-curated skills, hooks, agents, rules, and MCP servers from public registries using the `load-*` CLI family.

## Prerequisites

All five CLIs must be installed globally:

```bash
npm install -g load-skill load-hooks load-agents load-rules load-mcp
```

## What Each Registry Contains

| CLI | What it provides | Registry size | Installs to |
|-----|-----------------|---------------|-------------|
| `load-skill` | Domain expertise prompts (e.g. react-expert, playwright-expert) | 1,168 skills | `.claude/skills/<name>/SKILL.md` |
| `load-hooks` | Event-driven automation scripts (lint on save, security checks) | 25+ hooks | `.claude/hooks/<name>.js` |
| `load-agents` | Specialized agent personas (code-reviewer, security-auditor) | 30+ agents | `.claude/agents/<name>.md` |
| `load-rules` | Coding style/framework rules (nextjs, tailwind, python) | 50+ rules | `.claude/rules/<name>.md` |
| `load-mcp` | MCP server configs (GitHub, Postgres, Slack, Sentry, etc.) | 50+ servers | `~/.claude/settings.json` mcpServers |

## Workflow: How to Help the User

### Step 1 — Understand What They Need

When the user asks for help enhancing their setup, determine which registry to search:

- **"I need help with React patterns"** → search `load-skill` and `load-rules`
- **"Auto-lint my code after edits"** → search `load-hooks`
- **"I want a code review agent"** → search `load-agents`
- **"Connect Claude to my database"** → search `load-mcp`
- **Vague request** → search across all registries with relevant keywords

### Step 2 — Search the Registries

Use `--json` flag for structured output that's easy to parse:

```bash
# Search by keyword
load-skill search "react" --json
load-hooks search "lint" --json
load-agents search "review" --json
load-rules search "typescript" --json
load-mcp search "postgres" --json

# List all available items
load-skill list --json
load-hooks list --json

# Filter by tag
load-skill list --tag frontend --json
load-hooks list --tag security --json

# Get detailed info about a specific item
load-skill info react-expert
load-hooks info auto-lint
load-agents info code-reviewer
load-rules info nextjs
load-mcp info github
```

### Step 3 — Present Options to the User

After searching, present the top matches with:
- **Name** and one-line description
- **Tags** for context
- **Why it's relevant** to their request
- The exact install command they can run

Example response format:

> Found 3 relevant skills for your React + TypeScript project:
>
> 1. **react-expert** — React development with hooks, context, patterns, performance optimization
>    `load-skill install react-expert`
>
> 2. **typescript-expert** — TypeScript strict mode, generics, type guards, utility types
>    `load-skill install typescript-expert`
>
> 3. **frontend-design** — Production-grade frontend interfaces avoiding generic AI aesthetics
>    `load-skill install frontend-design`

### Step 4 — Install on User Confirmation

Only install after the user confirms. Use the appropriate flags:

```bash
# Install for Claude Code (default)
load-skill install react-expert

# Install for Cursor
load-skill install react-expert --tool cursor

# Install globally (available in all projects)
load-skill install react-expert --global

# Custom output path
load-skill install react-expert -o ./custom/path/
```

For hooks, remind the user they need to wire the hook into `settings.json` after install:

```bash
load-hooks install auto-lint
# Then add to .claude/settings.json under the appropriate event (PreToolUse, PostToolUse, etc.)
```

For MCP servers, remind the user to fill in placeholder env values (API tokens, etc.) after install.

## CLI Reference

All five CLIs share the same command structure:

```
load-<type> list [--source <s>] [--tag <t>] [--tool <t>] [--json]
load-<type> search <query> [--tag <t>] [--json]
load-<type> info <name>
load-<type> install <name> [--tool <t>] [--global] [-o <path>]
load-<type> tags
load-<type> sources
load-<type> update          # refresh registry from GitHub sources
```

**Supported `--tool` values:** `claude-code` (default), `cursor`, `codex`, `gemini-cli`

## Common Search Strategies

| User intent | Commands to run |
|------------|----------------|
| Improve code quality | `load-hooks search "lint"`, `load-agents search "review"` |
| Add testing capability | `load-skill search "test"`, `load-hooks search "test"` |
| Framework-specific rules | `load-rules search "<framework>"`, `load-skill search "<framework>"` |
| Connect external service | `load-mcp search "<service>"` |
| Security hardening | `load-hooks search "security"`, `load-agents search "security"` |
| Full project setup | Search all 5 registries with project stack keywords |

## Important Notes

- Always search before suggesting — registry contents update over time
- Use `load-<type> update` if results seem stale (re-scrapes GitHub sources)
- Never install without user confirmation
- For MCP servers: env placeholders (API keys, tokens) must be filled in manually
- For hooks: wiring into `settings.json` events is a separate manual step
- Multiple items can be installed in sequence — they don't conflict
