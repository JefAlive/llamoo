# llamaoo Repository Specification Documentation

## Why

`llamoo` is an interactive CLI tool for managing Llama.cpp models and inference profiles, but its codebase is growing organically. We need systematic documentation to capture the repository's architecture, component relationships, and technical specifications in a structured, machine-readable format that can be evolved alongside the code.

## What Changes

- **New**: Comprehensive repository architecture documentation using OpenSpec artifacts
- **New**: Architecture specification capturing data flows, component interactions, and system design
- **New**: Component specifications defining interfaces and contracts between modules
- **New**: Technical specs for storage, persistence, and configuration mechanisms

## Capabilities

### New Capabilities
- **repo-architecture**: Top-level architecture overview with system diagram, component diagram, and data flow
- **component-definition**: Specifications for each major component (App, ProfilesScreen, ThemePicker, ProfileEditor, DirManager, RunnerScreen)
- **data-persistence**: Config storage schema and persistence layer specification
- **theme-management**: Terminal UI theming and color system specification
- **inference-profile**: Configuration schema for llama-server profiles and parameters

### Modified Capabilities
- *(None)* - All existing specs are new in this exercise. Existing OpenSpec patterns are established in the architecture spec.

## Impact

- **Architecture**: Clarifies monolithic structure, separation of concerns, and component boundaries
- **Development**: New features can reference specs for API contracts and integration requirements
- **Testing**: Specs serve as source of truth for acceptance testing and validation
- **Documentation**: Eliminates scattered docs; single source of truth for repository structure
- **Onboarding**: Reduces time to understand repository layout and component responsibilities
