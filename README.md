# Inline Run to Cursor
https://marketplace.visualstudio.com/items?itemName=volsa.vscode-inline-run-to-cursor

Inline Run to Cursor is a VS Code extension that displays a convenient button to run to the current line when in debug mode. While VS Code provides such functionality, it's quite tedious from a UX perspective, as you have to either:

- Memorize a keyboard shortcut (`Ctrl+F10` / `Cmd+F10`)
- Right-click, find the context menu item, and click on it
- Create a temporary breakpoint, continue execution, then remove the breakpoint

This extension simplifies the workflow by showing an inline button you can simply click to run to that line. If you come from an IDE such as IntelliJ IDEA or Visual Studio, this feature should feel familiar and natural.


https://github.com/user-attachments/assets/a4beaa12-8ae3-4f94-8551-3377dac804df



## Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Inline Run to Cursor"
4. Click Install

## Usage

1. Start a debug session in VS Code
2. Place your cursor on any line where you want execution to pause
3. Click the "▶️ Run to Cursor" button that appears inline
4. The debugger will continue execution until it reaches that line

## Configuration

The extension can be configured through VS Code settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `inline-run-to-cursor.enabled` | Enable/disable the extension | `true` |
| `inline-run-to-cursor.buttonText` | Customize the button text | `"▶️ Run to Cursor"` |

Example:
```json
{
  "inline-run-to-cursor.enabled": true,
  "inline-run-to-cursor.buttonText": "🏃 Run Here"
}
```

## Requirements

- Visual Studio Code 1.101.0 or higher
- An active debug configuration for your project

## License

MIT
