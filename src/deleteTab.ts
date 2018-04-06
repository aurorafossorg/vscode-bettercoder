// ___.           __    __                                 .___
// \_ |__   _____/  |__/  |_  ___________   ____  ____   __| _/___________ 
//  | __ \_/ __ \   __\   __\/ __ \_  __ \_/ ___\/  _ \ / __ |/ __ \_  __ \
//  | \_\ \  ___/|  |  |  | \  ___/|  | \/\  \__(  <_> ) /_/ \  ___/|  | \/
//  |___  /\___  >__|  |__|  \___  >__|    \___  >____/\____ |\___  >__|   
//      \/     \/                \/            \/           \/    \/       
// BetterCoder Keymaps: Shortcuts to improve code speed
//
// Copyright (c) 2017 Jason Liu
// Copyright (c) 2018 Luís Ferreira

import { workspace, Range, TextEditor, TextDocument, Selection, Position } from "vscode";
import { DeleteBlockOperation } from "./deleteBlock";

let deleteTabConfig = {};

export class DeleteTab {
	public static setConfig(newConfig: {}) {
		if (newConfig && Object.keys(newConfig)) {
			Object.assign(deleteTabConfig, newConfig);
		}
	}

	protected static getSetting(str: string) : boolean {
		if (!deleteTabConfig["debug"]) {
			deleteTabConfig[str] = workspace.getConfiguration().get(str);
		}
	
		return deleteTabConfig[str];
	}

	protected static coupleCharacter = [
		"()",
		"[]",
		"<>",
		"{}",
		"''",
		"``",
		'""',
	];
}

abstract class DeleteTabOperation extends DeleteTab {
	protected static findBackspaceRange(doc: TextDocument, selection: Selection, direction: boolean): Range | [Position, Range] {
		if (!selection.isEmpty) {
			return new Range(selection.start, selection.end);
		}
	
		const cursorPosition = selection.active;
		const cursorLineNumber = cursorPosition.line;
		const cursorLine = doc.lineAt(cursorPosition);

		let isSmartBackspace = (((direction) ? (cursorLineNumber < doc.lineCount-1) : (cursorLineNumber > 0)) && ((direction) ? (cursorPosition.character < cursorLine.firstNonWhitespaceCharacterIndex) : (cursorPosition.character <= cursorLine.firstNonWhitespaceCharacterIndex)));
		if (isSmartBackspace) {
			let aboveLine = doc.lineAt((direction) ? cursorLineNumber + 1 : cursorLineNumber - 1);
			let aboveRange = aboveLine.range;
	
			if (aboveLine.isEmptyOrWhitespace) {
				return new Range(aboveRange.start, aboveRange.start.translate(1, 0));
			} else {
				let lastWordPosition = DeleteBlockOperation.backtraceAboveLine(doc, cursorLineNumber, direction);
				let a = doc.getText(new Range((direction) ? lastWordPosition.translate(0, 1) : lastWordPosition.translate(0, -1), lastWordPosition));
				let isKeepOneSpace = DeleteTab.getSetting("bettercoder.deleteTabEnd.keepOneSpace") &&
					// For better UX ?
					// Don't add space if current line is empty
					!cursorLine.isEmptyOrWhitespace &&
					// Only add space if there is no space
					/\S/.test(a);
				if (isKeepOneSpace) {
					return [lastWordPosition, new Range(lastWordPosition, cursorPosition)];
				} else {
					return new Range(lastWordPosition, cursorPosition);
				}
			}
		} else if ((direction) ? ((cursorPosition.line == doc.lineCount-1) && (cursorPosition.character == doc.lineAt(doc.lineCount-1).text.length)) : (cursorPosition.line == 0 && cursorPosition.character == 0)) {
			// edge case, otherwise it will failed
			return new Range(cursorPosition, cursorPosition);
		} else {
			// inline
			let positionBefore = (doc.lineAt(cursorPosition).text.length == 0) ? doc.lineAt((direction) ? (doc.lineAt(cursorPosition).lineNumber + 1) : (doc.lineAt(cursorPosition).lineNumber - 1)).range.end : cursorPosition.translate(0, -1);
			let positionAfter = (doc.lineAt(cursorPosition).text.length == 0) ? (((doc.lineCount - 1) == doc.lineAt(cursorPosition).lineNumber) ? cursorPosition : doc.lineAt((direction) ? (doc.lineAt(cursorPosition).lineNumber + 1) : (doc.lineAt(cursorPosition).lineNumber - 1)).range.start) : cursorPosition.translate(0, 1);
			let peekBackward = doc.getText(new Range(positionBefore, cursorPosition));
			let peekForward = doc.getText(new Range(cursorPosition, positionAfter));
			let isAutoClosePair = ~DeleteTab.coupleCharacter.indexOf(peekBackward + peekForward);
	
			return (isAutoClosePair) ?
				new Range(positionBefore, positionAfter) :
				(direction) ? new Range(positionAfter, cursorPosition) : new Range(positionBefore, cursorPosition); // original backsapce
		}
	}
}

export class DeleteTabRegister extends DeleteTabOperation {
	public static registerDeleteTabEndRight(editor: TextEditor) { return DeleteTabRegister.registeryDeleteTabEnd(editor, true); }
	public static registerDeleteTabEndLeft(editor: TextEditor) { return DeleteTabRegister.registeryDeleteTabEnd(editor, false); }
		
	public static registeryDeleteTabEnd(editor: TextEditor, direction:boolean ): Thenable<Boolean> {
		const deleteRanges = editor.selections.map(selection => DeleteTabOperation.findBackspaceRange(editor.document, selection, direction));
	
		const returned = editor.edit(editorBuilder => deleteRanges.forEach(range => {
			if (range instanceof Range) {
				editorBuilder.delete(range)
			} else {
				let position = range[0];
				editorBuilder.insert(position, " ");
				editorBuilder.delete(range[1]);
			}
		}));
	
		if (deleteRanges.length <= 1) {
			editor.revealRange(new Range(editor.selection.start, editor.selection.end));
		}
	
		return returned;
	}
}