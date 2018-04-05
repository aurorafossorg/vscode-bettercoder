"use strict";

import * as cursorBlock from "./cursorBlock";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerTextEditorCommand("bettercoder.cursorBlockStartUp", (editor) => {
		cursorBlock.markSelection(editor, cursorBlock.nextPosition(editor.document, editor.selection.active, true));
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("bettercoder.cursorBlockEndDown", (editor) => {
		cursorBlock.markSelection(editor, cursorBlock.nextPosition(editor.document, editor.selection.active, false));
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("bettercoder.cursorBlockStartUpSelect", (editor) => {
		cursorBlock.markSelection(
			editor,
			cursorBlock.nextPosition(editor.document, editor.selection.active, true),
			cursorBlock.anchorPosition(editor.selection)
		);
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("bettercoder.cursorBlockEndDownSelect", (editor) => {
		cursorBlock.markSelection(
			editor,
			cursorBlock.nextPosition(editor.document, editor.selection.active, false),
			cursorBlock.anchorPosition(editor.selection)
		);
	}));
}