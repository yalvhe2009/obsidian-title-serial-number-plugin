import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { SerialNumberHelper } from './serialNumberHelper';
import { TitleSerialNumberPluginSettings, TitleSerialNumberPluginSettingTab } from './settings';




const DEFAULT_SETTINGS: TitleSerialNumberPluginSettings = {
	startWith: '1',
	endWith: '6'
}

export default class TitleSerialNumberPlugin extends Plugin {
	settings: TitleSerialNumberPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'set-title-serial-number-editor-command',
			name: 'Set Serial Number For Title',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				//console.log(this.settings);
				let startWith: number = parseInt(this.settings.startWith);
				let endWith: number = parseInt(this.settings.endWith);
				if(startWith > endWith){
					new Notice('Your configuration is ERROR, command terminated!');
					return;
				}
				//startWith == endWith时，仅仅对这一数组等级的进行标题添加操作
				endWith += 1;//为了写程序方便，把结束自增1

				const regex = /^([#]+) ([0-9.]* *)(.*)$/gm;
				let originVal: string = editor.getValue();
				let m;
				while ((m = regex.exec(originVal)) !== null) {
					if (m.index === regex.lastIndex) {
						regex.lastIndex++;
					}
					//js 返回的匹配结果：groupIndex=0表示匹配到的字符串、groupIndex=1表示匹配到的字符串的第一个分组的值、groupIndex=2表示匹配到的字符串的第二个分组的值
					let str: string = m[0];//当前匹配到的完整字符串
					let wellStr:string = m[1];//井号的字符串；用于判定是h1还是h2还是……h6
					let oldSerialNumber: string = m[2];//旧的标题号（如果有）；如1.1, 1. , 2.2.1,……
					let title:string = m[3];
					let matchStartIndex:number = m.index;//匹配项在文本中的索引位置
					//获取序号
					let newSerialNumber = SerialNumberHelper.getSerialNumberStr(wellStr.length, startWith, endWith);//新的序号
					let result = '';
					if (newSerialNumber === '') {
						result = `${wellStr} ${title}`;
					}
					else{
						result = `${wellStr} ${newSerialNumber} ${title}`;
					}
					let sub1 = originVal.substring(0, matchStartIndex);
					let sub2 = originVal.substring(matchStartIndex + str.length);
					originVal = sub1 + '' + result + sub2;					
				}
				editor.setValue(originVal);
				SerialNumberHelper.resetHxSerialNumbers(0);//全部重置为0；
			}
		});

		this.addCommand({
			id: 'clear-title-serial-number-editor-command',
			name: 'Clear Serial Number For Title',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				
				const regex2 = /^([#]+) ([0-9.]* *)(.*)$/gm;
				let originVal: string = editor.getValue();
				let m;
				while ((m = regex2.exec(originVal)) !== null) {
					if (m.index === regex2.lastIndex) {
						regex2.lastIndex++;
					}
					console.log(m);
					//js 返回的匹配结果：groupIndex=0表示匹配到的字符串、groupIndex=1表示匹配到的字符串的第一个分组的值、groupIndex=2表示匹配到的字符串的第二个分组的值
					let str: string = m[0];//当前匹配到的完整字符串
					let wellStr:string = m[1];//井号的字符串；用于判定是h1还是h2还是……h6
					let oldSerialNumber: string = m[2];//旧的标题号（如果有）；如1.1, 1. , 2.2.1,……
					let title:string = m[3];
					let matchStartIndex:number = m.index;//匹配项在文本中的索引位置
					
					let result = `${wellStr} ${title}`;
					let sub1 = originVal.substring(0, matchStartIndex);
					let sub2 = originVal.substring(matchStartIndex + str.length);
					originVal = sub1 + '' + result + sub2;
				}
				editor.setValue(originVal);
				SerialNumberHelper.resetHxSerialNumbers(0);//全部重置为0；
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TitleSerialNumberPluginSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
