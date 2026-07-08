## 1. Create OpenSpec Change Directory

- [ ] 1.1 Create change directory at `openspec/changes/document-all-specs/`
- [ ] 1.2 Initialize change with `openspec new change "document-all-specs"`

## 2. Create Planning Artifacts

- [ ] 2.1 Write `proposal.md` with motivation and capabilities list
- [ ] 2.2 Write `design.md` with architectural decisions
- [ ] 2.3 Verify `openspec status` shows all planning artifacts as "done"

## 3. Create Repository Specifications

- [ ] 3.1 Create `specs/repo-architecture/spec.md` - top-level overview
- [ ] 3.2 Create `specs/component-definition/spec.md` - Ink React components
- [ ] 3.3 Create `specs/data-persistence/spec.md` - conf.js storage schema
- [ ] 3.4 Create `specs/theme-management/spec.md` - 12 theme system
- [ ] 3.5 Create `specs/inference-profile/spec.md` - LlamaProfile data structure
- [ ] 3.6 Verify `openspec status` shows specs artifact as "done"

## 4. Create Implementation Tasks

- [ ] 4.1 Create `tasks.md` with checkbox checklist for implementation
- [ ] 4.2 Organize tasks by numbered sections with task IDs (1.1, 2.3, etc.)
- [ ] 4.3 Verify `openspec status` shows tasks artifact as "done"

## 5. Validation and Verification

- [ ] 5.1 Run `openspec validate --change "document-all-specs"`
- [ ] 5.2 Check that all spec files use correct `#### Scenario:` headers
- [ ] 5.3 Verify all requirements have at least one scenario
- [ ] 5.4 Ensure all specs reference each other (cross-links)

## 6. Archive and Publish

- [ ] 6.1 Run `openspec archive --change "document-all-specs"`
- [ ] 6.2 Verify all artifacts are archived (no more "ready" or "pending")
- [ ] 6.3 Commit all artifacts to git