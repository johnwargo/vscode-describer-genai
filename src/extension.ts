// TODO: Add marketplace icon
// TODO: add a folder view context menu item for generation
// TODO: Add max token length configuration setting
// TODO: Add command icons?

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { DialogType, doNotify } from './utils';

import * as vscode from 'vscode';
import OpenAI from 'openai';
import YAML from 'yaml';

const extensionName = 'describer-genai';
const extensionTitle = 'Describer GenAI';
const timeKey = "Generation";
const yamlExpExclude = /---[\r\n].*?[\r\n]---/s;
const yamlPatternInclude = /(?<=---[\r\n]).*?(?=[\r\n]---)/s;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// ========================================================
	// Config command
	// ========================================================
	// console.log(`Extension ${extensionName} activated`);
	const configCmd = `${extensionName}.config`;
	const configHandler = () => {
		// vscode.window.showInformationMessage('Configuration handler');
		// console.log(`${extensionName}: Executing Configuration handler`);
		vscode.commands.executeCommand('workbench.action.openSettings', 'describer-genai.');
	};
	// console.log(`Registering command ${configCmd}`);
	context.subscriptions.push(vscode.commands.registerCommand(configCmd, configHandler));

	// ========================================================
	// Generate command
	// ========================================================

	const generateCmd = `${extensionName}.generate`;
	const generateHandler = () => {
		var theText: string;

		// console.log(`${extensionName}: Executing Generate handler`);
		const config = vscode.workspace.getConfiguration(extensionName);
		let apiKey: string = config.apiKey;
		if (!apiKey) {
			doNotify(DialogType.dtError, 'Extension Configuration missing ChatGPT API Key');
			return;
		}

		let targetProperty: string = config.targetProperty;
		if (!targetProperty) {
			doNotify(DialogType.dtError, 'Extension Configuration missing Description Property');
			return;
		}

		// at this point, we have a valid API key and target property
		// now, lets get the content from the current file
		// https://github.com/Microsoft/vscode-extension-samples/tree/main/document-editing-sample
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			doNotify(DialogType.dtWarning, 'No file open in the editor');
			return;
		}

		// get the currently open document
		const document = editor.document;
		// does it contain any text?
		if (document.getText().length < 1) {
			doNotify(DialogType.dtWarning, 'Active document contains no text');
			return;
		}

		// Get the text of the current document
		theText = document.getText();
		// does it contain any front matter?
		if (theText.match(yamlPatternInclude) === null) {
			// No, then get outta here
			doNotify(DialogType.dtWarning, 'Active document contains no front matter');
			return;
		}

		// is there text selected in the document?
		const selection = editor.selection;
		// do we have selected text?
		if (!selection.isEmpty) {
			// then use it instead of the whole document.
			theText = document.getText(selection);
		}

		// --------------------------------------------------------
		// summarize the text
		// --------------------------------------------------------
		// remove the front matter from the article text sent to the API
		var genText = theText.replace(yamlExpExclude, '');
		// create the openAI object
		const openai = new OpenAI({ apiKey: apiKey });
		async function runCompletion(
			editor: vscode.TextEditor,
			config: any,
			customCancellationToken: vscode.CancellationTokenSource
		) {
			// console.log('Calling ChatGPT API');
			// console.time(timeKey);

			// const chatCompletion = await openai.chat.completions.create({
			// 	messages: [{ role: 'user', content: `With the article content delimited with triple double quote marks """${genText}""", please generate a concise summary of the article using first-person perspective as if I am summarizing it myself` }], model: 'gpt-3.5-turbo',
			// });

			const prompt = `With the article content delimited with triple double quote marks """${genText}""", generate a concise summary of the article using first-person perspective as if I am summarizing it myself`;

			openai.chat.completions.create({ messages: [{ role: 'user', content: prompt }], temperature: 0.2, model: 'gpt-3.5-turbo' })
				.then((chatCompletion) => {
					// console.timeEnd(timeKey);
					// console.log('Response: ' + chatCompletion.choices[0].message.content);
					// grab the front matter from the document
					var YAMLDoc: YAML.Document[] = YAML.parseAllDocuments(theText, { logLevel: 'silent' });
					// update the ${targetProperty} property with the generated text
					var props: any = YAMLDoc[0].toJSON();
					props[config.targetProperty] = chatCompletion.choices[0].message.content;
					// set the Generated flag to the front matter if the user has it enabled
					if (config.enableGeneratedFlag) {
						// console.log('Setting generated flag');
						props['generatedDescription'] = true;
					}
					// Write the front matter back to the document
					let tmpFrontmatter = YAML.stringify(props, { logLevel: 'silent' });
					// remove the extra carriage return from the end of the frontmatter
					tmpFrontmatter = tmpFrontmatter.replace(/\n$/, '');
					theText = theText.replace(yamlPatternInclude, tmpFrontmatter);

					let invalidRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
					let validFullRange = editor.document.validateRange(invalidRange);

					editor.edit(editBuilder => {
						editBuilder.replace(validFullRange, theText);
					}).then(success => {
						// All done, so cancel the progress bar task
						customCancellationToken.cancel();
						if (!success) {
							doNotify(DialogType.dtError, 'Failed to update document');
							return;
						}
						doNotify(DialogType.dtInfo, 'File updated');
					});
				})
				.catch((err) => {
					customCancellationToken.cancel();
					if (err instanceof OpenAI.APIError) {
						doNotify(DialogType.dtError, `${err.name}:  ${err.message}`);
						// console.log(err.status); // 400
						// console.log(err.name); // BadRequestError
						// console.dir(err.headers); // {server: 'nginx', ...}
					} else {
						doNotify(DialogType.dtError, `Error: ${err.message}`);
					}
				});
		}

		// --------------------------------------------------------
		// https://www.eliostruyf.com/creating-timer-dismissable-notifications-visual-studio-code-extension/
		// https://www.eliostruyf.com/cancel-progress-programmatically-visual-studio-code-extensions/
		// https://github.com/microsoft/vscode-extension-samples/blob/main/notifications-sample/src/extension.ts
		vscode.window.withProgress({
			title: extensionTitle,
			location: vscode.ProgressLocation.Notification,
			cancellable: false
		},
			async (progress, token) => {
				return new Promise((async (resolve, reject) => {
					var interval: any;
					// setup a process to handle progress bar cancellation					
					var customCancellationToken: vscode.CancellationTokenSource | null = new vscode.CancellationTokenSource();
					customCancellationToken.token.onCancellationRequested(() => {
						// console.log('Clearing progress bar');
						interval = clearInterval(interval);
						customCancellationToken?.dispose();
						customCancellationToken = null;
						resolve(null);
						return;
					});
					// start description generation
					// console.log('Starting ChatGPT generation');
					runCompletion(editor, config, customCancellationToken);
					var loopCounter = 0;
					interval = setInterval(() => {
						// console.log('Waiting');
						loopCounter++;	//increment the loop counter
						if (loopCounter > 5) { loopCounter = 1; }	// reset the loop counter
						progress.report({ message: 'working' + '.'.repeat(loopCounter) });
					}, 1000);
				}));
			});
		// --------------------------------------------------------

	};
	// console.log(`Registering command ${generateCmd}`);
	context.subscriptions.push(vscode.commands.registerCommand(generateCmd, generateHandler));
}

// This method is called when your extension is deactivated
// export function deactivate() {
// 	console.log(`Extension "${extensionName}" deactivated`);
// }
