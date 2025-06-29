# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and auto-compile
- `npm run lint` - Run ESLint on source code
- `npm run test` - Run the test suite using VS Code test framework
- `npm run vscode:prepublish` - Pre-publish compilation step

## Architecture Overview

This is a VS Code extension that enhances debugging by providing inline "Run to Cursor" buttons. The architecture is event-driven and uses VS Code's CodeLens API:

**Core Components:**
- `src/extension.ts` - Single-file architecture containing all functionality
- `DebugCodeLensProvider` class - Implements VS Code's CodeLens interface
- `RunToCursorManager` class - Custom breakpoint-based run to cursor implementation
- Event listeners for cursor movement and debug session changes

**Key Workflow:**
1. Extension activates only during debugging sessions (`onDebugInitialConfigurations`, `onDebugResolve`)
2. CodeLens provider displays "▶️ Run to Cursor" button on current line
3. Real-time updates as user moves cursor or debug session changes
4. Custom breakpoint implementation that bypasses intermediate breakpoints:
   - Stores current breakpoint states
   - Temporarily removes all existing breakpoints
   - Adds temporary breakpoint at target line
   - Continues execution
   - Automatically restores original breakpoints on completion/termination

**Output Directory:** `out/` contains compiled JavaScript files

## Extension Configuration

**Activation Events:** Only activates during debugging to minimize resource usage

**User Settings:**
- `inline-run-to-cursor.enabled` (boolean, default: true)
- `inline-run-to-cursor.buttonText` (string, default: "▶️ Run to Cursor")

**Commands:** `vscode-inline-run-to-cursor.runToCursor`

## Development Notes

- Single TypeScript file architecture for simplicity
- Uses ES2022 with Node16 modules and strict type checking
- Testing setup uses VS Code's official test framework with Mocha and Sinon
- Performance-optimized: only active during debugging sessions
- Real-time responsiveness through event-driven updates
- Custom breakpoint management ensures reliable execution to target line
- Robust cleanup mechanisms handle all termination scenarios

## Commit Guidelines

- Use semantic commit messages (feat:, fix:, docs:, style:, refactor:, test:, chore:)
- Always update CHANGELOG.md with a new entry when committing changes