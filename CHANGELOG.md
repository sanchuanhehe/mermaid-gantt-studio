# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

During initial development (0.x), minor releases may contain explicitly documented breaking changes.

## [Unreleased]

## [0.1.0] - 2026-09-10

### Added

- Local Mermaid editor with automatic preview and focused source/preview views.
- Gantt task editing from the preview with source writeback and undo.
- Swimlane separators, right-side task labels, risk colors and release markers.
- SVG and PNG exports, configurable dimensions, font sizes and row heights.
- Trackpad and wheel zoom with pointer anchoring and zoom controls.
- Official Mermaid 11.17.2 CLI renderer and scheduling compatibility checks.
- Independent GitHub Pages deployment with a generic public example, excluding the internal plan and its notes.
- Unified version checks, CI, tagged releases, offline bundles and SHA-256 checksums.

### Fixed

- Task selection now tolerates alignment whitespace in official Mermaid labels.
- Outdated render results cannot overwrite newer edits or be exported as current.

[Unreleased]: https://github.com/sanchuanhehe/mermaid-gantt-studio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sanchuanhehe/mermaid-gantt-studio/releases/tag/v0.1.0
