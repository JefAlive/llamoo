## ADDED Requirements

### Requirement: React-based terminal UI
The application SHALL use React with Ink as the terminal UI library.

#### Scenario: Dynamic layout changes
- **WHEN** component state changes
- **THEN** Ink SHALL render new terminal characters in real-time
- **WHEN** window size changes
- **THEN** terminal SHALL respect TERM_WIDTH and TERM_HEIGHT environment variables

#### Scenario: Responsive component
- **WHEN** layout switches between left/right columns
- **THEN** Ink flexbox SHALL adjust heights to fill available space
- **WHEN** text is too long for a field
- **THEN** text SHALL wrap at column boundaries

### Requirement: Screen-based navigation
The application SHALL use a single `screen` state variable for navigation.

#### Scenario: Screen transitions
- **WHEN** user selects a profile to run
- **THEN** `screen` state SHALL change to "profile-run"
- **WHEN** user exits the runner
- **THEN** `screen` state SHALL return to "profiles"
- **WHEN** user clicks "theme" button
- **THEN** `screen` state SHALL change to "theme-picker"

#### Scenario: Component mounting
- **WHEN** `screen` state changes to "profile-edit"
- **THEN** ProfileEditor component SHALL mount
- **WHEN** `screen` state changes away from "profile-edit"
- **THEN** ProfileEditor component SHALL unmount (cleanup effects)