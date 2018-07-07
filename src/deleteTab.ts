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