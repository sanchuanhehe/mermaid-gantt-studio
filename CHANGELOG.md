# Changelog

All notable user-facing changes are recorded here. Versions follow Semantic Versioning; during 0.x, minor releases may contain documented breaking changes.

## [Unreleased]

## [0.1.0] - 2026-09-10

### Added
- Local Mermaid editor with automatic preview and focused source/preview views.
- Gantt task editing from the preview with source writeback and undo.
- Swimlane separators, right-side task labels, risk colors and release markers.
- SVG and PNG exports, configurable dimensions, font sizes and row heights.
- Trackpad and wheel zoom with pointer anchoring and zoom controls.
- Official Mermaid 11.17.2 CLI renderer and scheduling compatibility checks.
- Independent GitHub Pages deployment with a generic public example.
- Unified version checks, CI, tagged releases, offline bundles and SHA-256 checksums.

### Fixed
- Task selection now tolerates alignment whitespace in official Mermaid labels.
- Outdated render results cannot overwrite newer edits or be exported as current.

### Security
- Public deployment excludes the internal example plan and its notes; source repository remains private.

[Unreleased]: https://github.com/sanchuanhehe/mermaid-gantt-studio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sanchuanhehe/mermaid-gantt-studio/releases/tag/v0.1.0
