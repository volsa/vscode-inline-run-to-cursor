# Change Log

All notable changes to the "vscode-inline-run-to-cursor" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.1.1] - 2025-06-29

### Added
- Extension icon (assets/icon.png) for VS Code marketplace

## [0.1.0] - 2025-06-29

### Added
- Custom breakpoint-based run to cursor implementation that bypasses intermediate breakpoints
- RunToCursorManager class for robust breakpoint state management
- Comprehensive test suite with 6 test cases covering core functionality and edge cases
- Event-driven cleanup listeners for debug session termination, pause, and error scenarios
- Sinon test framework integration for advanced mocking capabilities
- CLAUDE.md development guide with architecture overview and commit guidelines
- Repository configuration in package.json
- Optimized activation events for debugging sessions only

### Changed
- Replaced VS Code's built-in `editor.debug.action.runToCursor` with custom implementation
- Enhanced reliability by ensuring execution reaches target line regardless of existing breakpoints
- Improved CLAUDE.md structure and documentation format
- Bumped version from 0.0.1 to 0.1.0 for initial feature release

### Fixed
- Issue where intermediate breakpoints would prevent reaching target line during run to cursor