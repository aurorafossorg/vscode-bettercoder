import * as vscode from "vscode";

export function nextPosition(document: vscode.TextDocument, position: vscode.Position, up: boolean = false): number {
	const step = up ? -1 : 1;
	const boundary = up ? 0 : document.lineCount - 1;
	let index = position.line + step;
	if (position.line === boundary) return position.line;
	return afterBlock(document, step, boundary, position.line);
}

function afterBlock(document: vscode.TextDocument, step: number, boundary: number, index: number, startedBlock: boolean = false): number {
	const line = document.lineAt(index);
	return index === boundary || startedBlock && line.isEmptyOrWhitespace
		? index
		: afterBlock(document, step, boundary, index + step, startedBlock || !line.isEmptyOrWhitespace);
}

export function anchorPosition(selection: vscode.Selection) {
	return selection.active.line === selection.end.line ? selection.start : selection.end
}

export function markSelection(editor: vscode.TextEditor, next: number, anchor?: vscode.Position) {
		const active = editor.selection.active.with(next, 0);
		editor.selection = new vscode.Selection(anchor || active, active);
		editor.revealRange(new vscode.Range(active, active));
}