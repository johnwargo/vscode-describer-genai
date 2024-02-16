import * as vscode from 'vscode';

export enum DialogType { dtError, dtWarning, dtInfo };

export function doNotify(dialogType: DialogType, msg: string) {
	switch (dialogType) {
		case DialogType.dtError:
			console.error(msg);
			vscode.window.showErrorMessage(`Describer: ${msg}`);
			break;
		case DialogType.dtWarning:
			console.warn(msg);
			vscode.window.showWarningMessage(`Describer: ${msg}`);
			break;
		default:
			console.log(msg);
			vscode.window.showInformationMessage(`Describer: ${msg}`);
			break;
	}
}

