## ADDED Requirements

### Requirement: Terminal theming system
The application SHALL provide a system for customizing terminal appearance through color themes.

#### Scenario: Theme selection
- **WHEN** user opens theme picker
- **THEN** they SHALL see 12 available themes
- **WHEN** user selects "catppuccin"
- **THEN** terminal SHALL apply colors: bg=#1e1e2e, fg=#cdd6f4, accent=#cba6f7
- **WHEN** terminal window is resized
- **THEN** color names SHALL be rendered at standard terminal color values (ANSI/256)

#### Scenario: Theme data structure
- **WHEN** accessing a theme
- **THEN** it SHALL be an object with:
  - `name`: Theme identifier (e.g., "catppuccin")
  - `label`: Human-readable name (e.g., "Catppuccin Mocha")
  - `bg`, `fg`, `border`, `accent`, `accentAlt`, `dim`, `highlight`, `highlightFg` (terminal colors)
  - `success`, `warning`, `error` (semantic colors)
  - `cursor` (cursor color)

### Requirement: Theme persistence
The application SHALL persist the selected theme.

#### Scenario: Theme memory
- **WHEN** user selects "gruvbox"
- **THEN** theme SHALL be stored to config
- **WHEN** app restarts with "gruvbox" theme saved
- **THEN** it SHALL display in Gruvbox Dark colors

### Requirement: Default theme
The application SHALL have a sensible default theme.

#### Scenario: Initial display
- **WHEN** application first launches
- **THEN** it SHALL use "catppuccin" theme (modern dark theme)
- **WHEN** terminal has no TERM environment variable
- **THEN** it SHALL fallback to default theme with fallback color values