# llamaoo Architecture Design

## Context

`llamoo` is a monolithic CLI application built with React and Ink (terminal UI). The application manages Llama.cpp models and inference profiles through a React-based terminal interface. This document captures the architectural decisions behind the codebase structure.

## Goals / Non-Goals

**Goals:**
- Single-page terminal application with state persistence
- Interactive CLI for configuring and running local LLM inference
- Session recovery from disk persistence
- Terminal-aware UI with responsive layouts

**Non-Goals:**
- Multi-user concurrent access (CLI is inherently single-user)
- Web-based interface (that would require separate setup)
- Distributed caching or complex orchestration

## Decisions

### 1. Monolithic Architecture

**Decision**: Single React application with file-system persistence

**Rationale**:
- Simplicity over complexity
- Fast development and debugging
- Zero runtime overhead (no server spinup)
- Perfect for a devtool CLI

**Alternative considered**: Microservices architecture
**Why rejected**: Overkill for a CLI devtool, requires distributed coordination

### 2. Ink Terminal UI

**Decision**: Use Ink library for terminal-based React component

**Rationale**:
- Direct terminal manipulation (no terminal simulation overhead)
- Built-in theming system (matches app theme system)
- Real-time reactivity for live displays (e.g., runner output)
- Responsive layouts (flexbox support)

### 3. Persistent State

**Decision**: `conf.js` for persistent storage

**Rationale**:
- Simple JSON-based configuration
- Session recovery (app remembers state on restart)
- Type-safe defaults
- File-based storage (no database complexity)

**Storage Schema:**
```json
{
  "theme": "catppuccin",
  "scanDirs": ["~/models"],
  "profiles": [...],
  "models": [...]
}
```

### 4. Reactive State Management

**Decision**: React state with `useState` and `useEffect`

**Rationale**:
- Simple, local state for each screen/component
- Computationally efficient (only re-renders what changed)
- Built-in reactivity (UI updates when state changes)
- No global store overhead

### 5. Screen-based Routing

**Decision**: `screen` state for navigation

**Rationale**:
- Simple string-based navigation ("profiles", "run", "edit")
- No router library overhead
- Direct component mounting based on state

### 6. Theme System

**Decision**: 12 curated terminal themes with CSS color names

**Themes:**
- Catppuccin, Gruvbox, Tokyo Night (popular Vim/Vscode themes)
- Synthwave '84, Matrix, Tron Legacy (retro/fun)
- Solarized Dark (ergonomic)
- Default, FNaF, ORNG, Tron Ares (various)

**Rationale**: 
- Users can match their editor theme
- No need to manually define terminal colors

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Screen overflow on narrow terminals | Ink provides scrollbars, responsive layout |
| Large profiles (100+ fields) take forever to edit | Incremental editing, field-by-field navigation |
| Conflicts between parallel modifications | Sequential UI (edit one profile, save, then next) |
| Missing terminal emulator | Ink detects TERM environment variable |

## Open Questions

- How to handle model caching strategies?
- Should we support model compression formats?
- How to handle multi-GPU tensor splitting?

---

*See [`proposal.md`](./proposal.md) for motivation and requirements. *See [`specs/`](./specs/) for detailed specifications. *See [`tasks.md`](./tasks.md) for implementation steps.*