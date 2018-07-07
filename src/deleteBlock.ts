/*
                                   / _|
  __ _ _   _ _ __ ___  _ __ __ _  | |_ ___  ___ ___
 / _` | | | | '__/ _ \| '__/ _` | |  _/ _ \/ __/ __|
| (_| | |_| | | | (_) | | | (_| | | || (_) \__ \__ \
 \__,_|\__,_|_|  \___/|_|  \__,_| |_| \___/|___/___/

Copyright (C) 2018 Aurora Free Open Source Software.

This file is part of the Aurora Free Open Source Software. This
organization promote free and open source software that you can
redistribute and/or modify under the terms of the MIT License available in
the package root path as 'LICENSE' file. Please review the following
information to ensure that the license requirements meet the opensource
guidelines at opensource.org .

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

NOTE: All products, services or anything associated to trademarks and
service marks used or referenced on this file are the property of their
respective companies/owners or its subsidiaries. Other names and brands
may be claimed as the property of others.

For more info about intellectual property visit: aurorafoss.org or
directly send an email to: contact (at) aurorafoss.org .
*/

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
		let backtraceLineNumber = (direction) ? cursorLineNumber + 1 : cursorLineNumber - 1; if ((direction) ? (backtraceLineNumber == doc.lineCount) : (backtraceLineNumber == -1))
			return (direction) ? doc.lineAt(cursorLineNumber).range.end : doc.lineAt(cursorLineNumber).range.start;
		let empty = true;
		while (((direction) ? backtraceLineNumber < doc.lineCount-1 : backtraceLineNumber > 0) && empty) {
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