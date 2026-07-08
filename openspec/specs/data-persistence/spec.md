# data-persistence Specification

## Purpose
TBD - created by archiving change document-all-specs. Update Purpose after archive.
## Requirements
### Requirement: Persistent state storage
The application SHALL store all configuration and runtime state to a JSON file using `conf.js`.

#### Scenario: Session recovery
- **WHEN** application is restarted
- **THEN** it SHALL load previously saved theme, scan dirs, profiles, and models
- **WHEN** user makes configuration changes
- **THEN** they SHALL be persisted to `$HOME/.config/llamoo/llamoo.conf`
- **WHEN** new profile is created
- **THEN** it SHALL be immediately stored and available after app restart

#### Scenario: Default state
- **WHEN** no previous state exists
- **THEN** app SHALL initialize with defaults:
  - `theme`: "catppuccin"
  - `scanDirs`: []
  - `profiles`: []
  - `models`: []

### Requirement: Config schema integrity
The application SHALL validate that saved configuration conforms to the schema.

#### Scenario: Type safety
- **WHEN** reading a theme value
- **THEN** it SHALL be cast to `ThemeName` type
- **WHEN** reading an array of dirs
- **THEN** it SHALL be cast to `string[]` type

#### Scenario: Array mutation
- **WHEN** deleting a profile
- **THEN** the profile SHALL be filtered from the array (not replaced)
- **WHEN** saving a profile
- **THEN** it SHALL be found by id; if exists, replace; else append

