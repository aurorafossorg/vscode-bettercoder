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