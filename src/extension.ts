import * as vscode from 'vscode';

// Constants
const COMMAND_ID = 'vscode-inline-run-to-cursor.runToCursor';
const CONFIG_NAMESPACE = 'inline-run-to-cursor';
const DEFAULT_BUTTON_TEXT = '▶️ Run to Cursor';

interface RunToCursorArgs {
    uri: string;
    line: number;
}

interface BreakpointState {
    breakpoint: vscode.Breakpoint;
    enabled: boolean;
}

class RunToCursorManager {
    private originalBreakpoints: BreakpointState[] = [];
    private temporaryBreakpoint: vscode.SourceBreakpoint | null = null;
    private cleanupListeners: vscode.Disposable[] = [];
    private isOperationActive = false;

    async executeRunToCursor(uri: vscode.Uri, line: number): Promise<void> {
        if (this.isOperationActive) {
            vscode.window.showWarningMessage('Run to cursor operation already in progress');
            return;
        }

        const debugSession = vscode.debug.activeDebugSession;
        if (!debugSession) {
            vscode.window.showErrorMessage('No active debug session found');
            return;
        }

        this.isOperationActive = true;
        
        try {
            // Store current breakpoint states
            this.storeBreakpointStates();
            
            // Set up cleanup listeners
            this.setupCleanupListeners();
            
            // Disable all existing breakpoints
            await this.disableAllBreakpoints();
            
            // Add temporary breakpoint at target line
            await this.addTemporaryBreakpoint(uri, line);
            
            // Continue execution
            await vscode.commands.executeCommand('workbench.action.debug.continue');
            
        } catch (error) {
            await this.cleanup();
            throw error;
        }
    }

    private storeBreakpointStates(): void {
        this.originalBreakpoints = vscode.debug.breakpoints.map(bp => ({
            breakpoint: bp,
            enabled: bp.enabled
        }));
    }

    private setupCleanupListeners(): void {
        // Clean up when debug session terminates
        this.cleanupListeners.push(
            vscode.debug.onDidTerminateDebugSession(async () => {
                await this.cleanup();
            })
        );

        // Clean up when debug session changes state (pauses, stops, etc.)
        this.cleanupListeners.push(
            vscode.debug.onDidChangeActiveDebugSession(async (session) => {
                if (!session) {
                    await this.cleanup();
                }
            })
        );

        // Clean up when breakpoints are hit (session pauses)
        this.cleanupListeners.push(
            vscode.debug.onDidChangeBreakpoints(async () => {
                // Check if we're paused - if so, clean up
                const session = vscode.debug.activeDebugSession;
                if (session && this.isOperationActive) {
                    // Small delay to ensure state is updated
                    setTimeout(async () => {
                        await this.cleanup();
                    }, 100);
                }
            })
        );
    }

    private async disableAllBreakpoints(): Promise<void> {
        const enabledBreakpoints = vscode.debug.breakpoints.filter(bp => bp.enabled);
        if (enabledBreakpoints.length > 0) {
            vscode.debug.removeBreakpoints(enabledBreakpoints);
        }
    }

    private async addTemporaryBreakpoint(uri: vscode.Uri, line: number): Promise<void> {
        this.temporaryBreakpoint = new vscode.SourceBreakpoint(
            new vscode.Location(uri, new vscode.Position(line - 1, 0)),
            true
        );
        vscode.debug.addBreakpoints([this.temporaryBreakpoint]);
    }

    private async cleanup(): Promise<void> {
        if (!this.isOperationActive) {
            return;
        }

        this.isOperationActive = false;

        try {
            // Remove temporary breakpoint
            if (this.temporaryBreakpoint) {
                vscode.debug.removeBreakpoints([this.temporaryBreakpoint]);
                this.temporaryBreakpoint = null;
            }

            // Restore original breakpoint states
            const breakpointsToRestore = this.originalBreakpoints
                .filter(bpState => bpState.enabled)
                .map(bpState => bpState.breakpoint);
            
            if (breakpointsToRestore.length > 0) {
                vscode.debug.addBreakpoints(breakpointsToRestore);
            }

            // Clear stored states
            this.originalBreakpoints = [];

            // Dispose cleanup listeners
            this.cleanupListeners.forEach(listener => listener.dispose());
            this.cleanupListeners = [];

        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

/**
 * Provides CodeLens functionality for displaying inline "Run to Cursor" buttons
 * during debug sessions. The button appears on the current cursor line and follows
 * cursor movement in real-time.
 */
class DebugCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    /**
     * Provides CodeLens items for the given document. Returns a "Run to Cursor" button
     * on the current cursor line when debugging is active and the extension is enabled.
     * @param document The text document to provide CodeLens for
     * @returns Array of CodeLens items, or empty array if conditions aren't met
     */
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
        if (!config.get('enabled', true)) {
            return [];
        }

        const debugSession = vscode.debug.activeDebugSession;
        if (!debugSession) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== document) {
            return [];
        }

        // Get the line where the cursor currently is
        const currentLine = editor.selection.active.line;
        
        // Only show CodeLens on the current line
        const range = new vscode.Range(currentLine, 0, currentLine, 0);
        const codeLens = new vscode.CodeLens(range);
        
        const buttonText = config.get('buttonText', DEFAULT_BUTTON_TEXT);
        codeLens.command = {
            title: buttonText,
            command: COMMAND_ID,
            arguments: [{
                uri: document.uri.toString(),
                line: currentLine + 1 // Convert from 0-based to 1-based line numbering
            }]
        };
        
        codeLenses.push(codeLens);
        return codeLenses;
    }

    /**
     * Triggers a refresh of all CodeLens items, causing them to be re-evaluated
     * and re-rendered by VS Code.
     */
    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }
}


export function activate(context: vscode.ExtensionContext) {
    const codeLensProvider = new DebugCodeLensProvider();
    const runToCursorManager = new RunToCursorManager();
    
    // Register CodeLens provider for inline run-to-cursor buttons
    const codeLensDisposable = vscode.languages.registerCodeLensProvider(
        '*',
        codeLensProvider
    );

    const commandDisposable = vscode.commands.registerCommand(
        COMMAND_ID,
        async (args: RunToCursorArgs) => {
            try {
                if (!args || typeof args.uri !== 'string' || typeof args.line !== 'number') {
                    vscode.window.showErrorMessage('Invalid arguments provided to run to cursor command');
                    return;
                }

                const uri = vscode.Uri.parse(args.uri);
                let document: vscode.TextDocument;
                
                try {
                    document = await vscode.workspace.openTextDocument(uri);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to open document: ${error instanceof Error ? error.message : String(error)}`);
                    return;
                }
                
                try {
                    await vscode.window.showTextDocument(document);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to show document: ${error instanceof Error ? error.message : String(error)}`);
                    return;
                }
                
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor found');
                    return;
                }

                const position = new vscode.Position(args.line - 1, 0);
                editor.selection = new vscode.Selection(position, position);

                try {
                    await runToCursorManager.executeRunToCursor(uri, args.line);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to execute run to cursor: ${error instanceof Error ? error.message : String(error)}`);
                }
                
            } catch (error) {
                vscode.window.showErrorMessage(`Unexpected error in run to cursor: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    );

    // Refresh CodeLens when cursor position changes (only during debug sessions)
    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(() => {
        if (vscode.debug.activeDebugSession) {
            codeLensProvider.refresh();
        }
    });

    // Refresh CodeLens when debug session changes
    const debugSessionWatcher = vscode.debug.onDidChangeActiveDebugSession(() => {
        codeLensProvider.refresh();
    });

    context.subscriptions.push(
        codeLensDisposable, 
        commandDisposable, 
        selectionChangeDisposable,
        debugSessionWatcher
    );
}

export function deactivate() {}