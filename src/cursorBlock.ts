// ___.           __    __                                 .___
// \_ |__   _____/  |__/  |_  ___________   ____  ____   __| _/___________ 
//  | __ \_/ __ \   __\   __\/ __ \_  __ \_/ ___\/  _ \ / __ |/ __ \_  __ \
//  | \_\ \  ___/|  |  |  | \  ___/|  | \/\  \__(  <_> ) /_/ \  ___/|  | \/
//  |___  /\___  >__|  |__|  \___  >__|    \___  >____/\____ |\___  >__|   
//      \/     \/                \/            \/           \/    \/       
// BetterCoder Keymaps: Shortcuts to improve code speed
//
// Copyright (c) 2017 Justin Firth
// Copyright (c) 2018 Luís Ferreira

import { Position, Selection, Range, TextEditor, TextDocument } from "vscode";

abstract class CursorBlockOperation {
	protected static nextPosition(document: TextDocument, position: Position, up: boolean = false): number {
		const step = up ? -1 : 1;
		const boundary = up ? 0 : document.lineCount - 1;
		let index = position.line + step;
		if (position.line === boundary) return position.line;
		return CursorBlockRegister.afterBlock(document, step, boundary, position.line);
	}
	
	protected static afterBlock(document: TextDocument, step: number, boundary: number, index: number, startedBlock: boolean = false): number {
		const line = document.lineAt(index);
		return index === boundary || startedBlock && line.isEmptyOrWhitespace
			? index
			: CursorBlockRegister.afterBlock(document, step, boundary, index + step, startedBlock || !line.isEmptyOrWhitespace);
	}
	
	protected static anchorPosition(selection: Selection) {
		return selection.active.line === selection.end.line ? selection.start : selection.end
	}
	
	protected static markSelection(editor: TextEditor, next: number, anchor?: Position) {
			const active = editor.selection.active.with(next, 0);
			editor.selection = new Selection(anchor || active, active);
			editor.revealRange(new Range(active, active));
	}
}

export class CursorBlockRegister extends CursorBlockOperation {
	public static registerBlockStartUp(editor: TextEditor) {
		CursorBlockOperation.markSelection(editor, CursorBlockOperation.nextPosition(editor.document, editor.selection.active, true));
	}
	
	public static registerBlockEndDown(editor: TextEditor) {
		CursorBlockOperation.markSelection(editor, CursorBlockOperation.nextPosition(editor.document, editor.selection.active, false));
	}

	public static registerEndDownSelect(editor: TextEditor) {
		CursorBlockOperation.markSelection(
			editor,
			CursorBlockOperation.nextPosition(editor.document, editor.selection.active, false),
			CursorBlockOperation.anchorPosition(editor.selection)
		);
	}

	public static registerStartUpSelect(editor: TextEditor) {
		CursorBlockOperation.markSelection(
			editor,
			CursorBlockOperation.nextPosition(editor.document, editor.selection.active, true),
			CursorBlockOperation.anchorPosition(editor.selection)
		);
	}
}