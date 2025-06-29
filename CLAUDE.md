# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `npm run compile` - Compiles TypeScript to JavaScript in the `out/` directory
- **Watch mode**: `npm run watch` - Continuously compiles on file changes during development
- **Lint**: `npm run lint` - Runs ESLint on TypeScript files in `src/`
- **Test**: `npm run test` - Runs the test suite using vscode-test
- **Pre-test**: `npm run pretest` - Compiles and lints before running tests
- **Package for publishing**: `npm run vscode:prepublish` - Prepares extension for VS Code marketplace

## Git Workflow

- **Always update CHANGELOG.md before committing** - Document all changes, fixes, and new features
- **Use semantic commit style** - First line should be a concise description using prefixes like `feat:`, `fix:`, `docs:`, `refactor:`, etc.

## Architecture

This is a VS Code extension that provides IntelliJ-style "Run to Cursor" debugging functionality through inline CodeLens buttons.

### Core Components

1. **DebugCodeLensProvider** (`src/extension.ts:3-47`): Custom CodeLens provider that displays inline "▶️ Run to Cursor" buttons on the current cursor line during debug sessions. Key features:
   - Only shows during active debug sessions
   - Follows cursor movement in real-time
   - Configurable via `inline-run-to-cursor.enabled` setting

2. **Command Handler** (`src/extension.ts:59-89`): Handles the `vscode-inline-run-to-cursor.runToCursor` command by:
   - Opening the target document
   - Positioning cursor at the specified line
   - Executing VS Code's built-in `editor.debug.action.runToCursor` command

3. **Event Listeners** (`src/extension.ts:92-99`): Refreshes CodeLens display when:
   - Text editor selection changes (cursor movement)
   - Debug session state changes (start/stop debugging)

### Configuration

The extension uses VS Code's configuration system with the `inline-run-to-cursor` namespace:
- `inline-run-to-cursor.enabled`: Enable/disable functionality (default: true)
- `inline-run-to-cursor.buttonText`: Customize button text (default: "▶️ Run to Cursor")

### TypeScript Configuration

- Target: ES2022 with Node16 modules
- Strict type checking enabled
- Source maps generated for debugging
- Output directory: `out/`

### Testing

Uses `@vscode/test-cli` and `@vscode/test-electron` for VS Code extension testing. Test files are located in `src/test/`.