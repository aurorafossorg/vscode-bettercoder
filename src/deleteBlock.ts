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

import { Position, Range, Selection, TextEditor, TextDocument, TextLine } from "vscode";

declare global {
	interface String {
		findLastIndex(predicate: (theChar: string) => Boolean, columnNumber?: number, ): number;
	}
}

String.prototype.findLastIndex = function (predicate: (theChar: string) => Boolean, columnNumber?: number) {
	if (typeof columnNumber === 'undefined') {
		columnNumber = this.length;
	}

	for (let i = columnNumber; i >= 0; i--) {
		if (predicate(this[i])) {
			return i;
		}
	}

	return -1;
}

export abstract class DeleteBlockOperation {
	public static backtraceAboveLine(doc: TextDocument, cursorLineNumber: number, direction: boolean): Position {
		let backtraceLineNumber = (direction) ? cursorLineNumber + 1 : cursorLineNumber - 1;
		let empty = true;
		while (((direction) ? backtraceLineNumber <= doc.lineCount : backtraceLineNumber >= 0) && empty) {
			empty = doc.lineAt(backtraceLineNumber).isEmptyOrWhitespace;
			if (empty) {
				(direction) ? backtraceLineNumber++ : backtraceLineNumber--;
			}
		}
	
		if ((direction) ? backtraceLineNumber < 0 : backtraceLineNumber > doc.lineCount) {
			return (direction) ? doc.positionAt(doc.getText().length) : new Position(0, 0);
		} else {
			return (direction) ? new Position(backtraceLineNumber, doc.lineAt(backtraceLineNumber).firstNonWhitespaceCharacterIndex) : doc.lineAt(backtraceLineNumber).range.end;
		}
	}

	protected static backtraceInLine(doc: TextDocument, cursorLine: TextLine, cursorPosition: Position, direction: boolean): Position {
		const text = cursorLine.text;
		let charIndexBefore = cursorPosition.character - 1;
		let wordRange = doc.getWordRangeAtPosition(cursorPosition);
		let wordRangeBefore = doc.getWordRangeAtPosition(new Position(cursorPosition.line, charIndexBefore));

		if (wordRange && wordRangeBefore) {
			return wordRangeBefore.start;
		} else {
			let nonEmptyCharIndex = text.findLastIndex(theChar => /\S/.test(theChar), charIndexBefore);
			let offset = charIndexBefore - nonEmptyCharIndex;
			let deleteWhiteSpaceOnly = (offset > 1);
	
			if (deleteWhiteSpaceOnly) {
				return new Position(cursorPosition.line, nonEmptyCharIndex + 1);
			} else {
				wordRange = doc.getWordRangeAtPosition(new Position(cursorPosition.line, nonEmptyCharIndex));
				if (wordRange) {
					return wordRange.start;
				} else {
					let separatorChar = text.charAt(nonEmptyCharIndex);
					const nonSeparatorIndex = text.findLastIndex(theChar => theChar !== separatorChar, nonEmptyCharIndex - 1);
					const endIdx = (nonSeparatorIndex < 0) ? 0 : (nonSeparatorIndex + 1);
	
					return new Position(cursorPosition.line, endIdx);
				}
			}
		}
	}

	protected static findDeleteRange(doc: TextDocument, selection: Selection, direction: boolean) : Range {
		if (!selection.isEmpty) {
			return new Range(selection.start, selection.end);
		}
	
		const cursorPosition = selection.active;
		const cursorLine = doc.lineAt(cursorPosition);

		return new Range((cursorLine.isEmptyOrWhitespace || (cursorPosition.character <= cursorLine.firstNonWhitespaceCharacterIndex))
		? DeleteBlockOperation.backtraceAboveLine(doc, cursorPosition.line, direction)
		: DeleteBlockOperation.backtraceInLine(doc, cursorLine, cursorPosition, direction), cursorPosition);
	}
}

export class DeleteBlockRegister extends DeleteBlockOperation {
	public static registerDeleteLeft(editor: TextEditor) : Thenable<Boolean> { return DeleteBlockRegister.registerDelete(editor, false); }
	public static registerDeleteRight(editor: TextEditor) : Thenable<Boolean> { return DeleteBlockRegister.registerDelete(editor, true); }

	private static registerDelete(editor: TextEditor, direction: boolean) : Thenable<Boolean> {
		const deleteRanges = editor.selections.map(selection => DeleteBlockOperation.findDeleteRange(editor.document, selection, direction));
	
		const returned = editor.edit(editorBuilder => deleteRanges.forEach(range => editorBuilder.delete(range)));
	
		if (deleteRanges.length <= 1) {
			editor.revealRange(new Range(editor.selection.start, editor.selection.end));
		}

		return returned;
	}
}