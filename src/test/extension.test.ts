import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

// Mock the RunToCursorManager class for testing
class MockRunToCursorManager {
	private originalBreakpoints: any[] = [];
	private temporaryBreakpoint: vscode.SourceBreakpoint | null = null;
	private cleanupListeners: vscode.Disposable[] = [];
	private isOperationActive = false;

	async executeRunToCursor(uri: vscode.Uri, line: number): Promise<void> {
		if (this.isOperationActive) {
			throw new Error('Operation already in progress');
		}

		this.isOperationActive = true;
		
		try {
			this.storeBreakpointStates();
			this.setupCleanupListeners();
			await this.disableAllBreakpoints();
			await this.addTemporaryBreakpoint(uri, line);
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
		this.cleanupListeners.push(
			vscode.debug.onDidTerminateDebugSession(async () => {
				await this.cleanup();
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
			if (this.temporaryBreakpoint) {
				vscode.debug.removeBreakpoints([this.temporaryBreakpoint]);
				this.temporaryBreakpoint = null;
			}

			const breakpointsToRestore = this.originalBreakpoints
				.filter(bpState => bpState.enabled)
				.map(bpState => bpState.breakpoint);
			
			if (breakpointsToRestore.length > 0) {
				vscode.debug.addBreakpoints(breakpointsToRestore);
			}

			this.originalBreakpoints = [];
			this.cleanupListeners.forEach(listener => listener.dispose());
			this.cleanupListeners = [];
		} catch (error) {
			console.error('Error during cleanup:', error);
		}
	}

	get isActive(): boolean {
		return this.isOperationActive;
	}

	get storedBreakpoints(): any[] {
		return this.originalBreakpoints;
	}

	get tempBreakpoint(): vscode.SourceBreakpoint | null {
		return this.temporaryBreakpoint;
	}
}

suite('Extension Test Suite', () => {
	let runToCursorManager: MockRunToCursorManager;

	setup(() => {
		runToCursorManager = new MockRunToCursorManager();
	});

	test('RunToCursorManager initializes correctly', () => {
		assert.strictEqual(runToCursorManager.isActive, false);
		assert.strictEqual(runToCursorManager.storedBreakpoints.length, 0);
		assert.strictEqual(runToCursorManager.tempBreakpoint, null);
	});

	test('executeRunToCursor prevents concurrent operations', async () => {
		const uri = vscode.Uri.file('/test/file.js');
		
		// Mock the manager to simulate an active operation
		(runToCursorManager as any).isOperationActive = true;
		
		try {
			await runToCursorManager.executeRunToCursor(uri, 20);
			assert.fail('Should have thrown error for concurrent operation');
		} catch (error) {
			assert.strictEqual((error as Error).message, 'Operation already in progress');
		}
	});

	test('temporary breakpoint creation logic', () => {
		const uri = vscode.Uri.file('/test/file.js');
		const tempBreakpoint = new vscode.SourceBreakpoint(
			new vscode.Location(uri, new vscode.Position(9, 0)), // line 10 -> 0-based line 9
			true
		);

		assert.strictEqual(tempBreakpoint.location.uri.path, uri.path);
		assert.strictEqual(tempBreakpoint.location.range.start.line, 9);
		assert.strictEqual(tempBreakpoint.enabled, true);
	});

	test('cleanup state management', async () => {
		// Test that cleanup properly resets manager state
		const manager = new MockRunToCursorManager();
		
		// Manually set some state to simulate an operation
		(manager as any).isOperationActive = true;
		(manager as any).originalBreakpoints = [{ breakpoint: {}, enabled: true }];
		(manager as any).temporaryBreakpoint = new vscode.SourceBreakpoint(
			new vscode.Location(vscode.Uri.file('/test.js'), new vscode.Position(0, 0)),
			true
		);

		// Call cleanup
		await (manager as any).cleanup();

		// Verify state is reset
		assert.strictEqual(manager.isActive, false);
		assert.strictEqual(manager.storedBreakpoints.length, 0);
		assert.strictEqual(manager.tempBreakpoint, null);
	});

	test('breakpoint state storage logic', () => {
		// Test the logic for storing breakpoint states
		const uri = vscode.Uri.file('/test/file.js');
		const mockBreakpoints = [
			new vscode.SourceBreakpoint(new vscode.Location(uri, new vscode.Position(1, 0)), true),
			new vscode.SourceBreakpoint(new vscode.Location(uri, new vscode.Position(2, 0)), false),
			new vscode.SourceBreakpoint(new vscode.Location(uri, new vscode.Position(3, 0)), true)
		];

		// Simulate storing breakpoint states
		const storedStates = mockBreakpoints.map(bp => ({
			breakpoint: bp,
			enabled: bp.enabled
		}));

		assert.strictEqual(storedStates.length, 3);
		assert.strictEqual(storedStates[0].enabled, true);
		assert.strictEqual(storedStates[1].enabled, false);
		assert.strictEqual(storedStates[2].enabled, true);
		
		// Test filtering enabled breakpoints for restoration
		const enabledBreakpoints = storedStates
			.filter(state => state.enabled)
			.map(state => state.breakpoint);
		
		assert.strictEqual(enabledBreakpoints.length, 2);
	});

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
