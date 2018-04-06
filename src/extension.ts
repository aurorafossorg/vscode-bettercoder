// ___.           __    __                                 .___
// \_ |__   _____/  |__/  |_  ___________   ____  ____   __| _/___________ 
//  | __ \_/ __ \   __\   __\/ __ \_  __ \_/ ___\/  _ \ / __ |/ __ \_  __ \
//  | \_\ \  ___/|  |  |  | \  ___/|  | \/\  \__(  <_> ) /_/ \  ___/|  | \/
//  |___  /\___  >__|  |__|  \___  >__|    \___  >____/\____ |\___  >__|   
//      \/     \/                \/            \/           \/    \/       
// BetterCoder Keymaps: Shortcuts to improve code speed
//
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