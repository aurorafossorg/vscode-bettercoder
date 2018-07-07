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

// Copyright (c) 2018 Luís Ferreira


"use strict";
import { commands, ExtensionContext } from "vscode";
import { CursorBlockRegister } from "./cursorBlock";
import { DeleteBlockRegister } from "./deleteBlock";
import { DeleteTabRegister } from "./deleteTab";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.cursorBlockStartUp", CursorBlockRegister.registerBlockStartUp));
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.cursorBlockEndDown", CursorBlockRegister.registerBlockEndDown));
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.cursorBlockStartUpSelect", CursorBlockRegister.registerStartUpSelect));
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.cursorBlockEndDownSelect", CursorBlockRegister.registerEndDownSelect));
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.deleteBlockRight", DeleteBlockRegister.registerDeleteRight));
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.deleteBlockLeft", DeleteBlockRegister.registerDeleteLeft));
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.deleteTabEndRight", DeleteTabRegister.registerDeleteTabEndRight));
	context.subscriptions.push(commands.registerTextEditorCommand("bettercoder.deleteTabEndLeft", DeleteTabRegister.registerDeleteTabEndLeft));
}