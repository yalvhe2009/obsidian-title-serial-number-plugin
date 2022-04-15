import { App, PluginSettingTab, Setting } from 'obsidian';
import TitleSerialNumberPlugin from './main';


export interface TitleSerialNumberPluginSettings {
	activedHeadlines: number[];//激活的标题;(如存放1,3,5), 则[# 标题]会被转换为: [# 1 标题], [##### 测试] 会被转换为: [##### 1.1.1 测试]
}

export class TitleSerialNumberPluginSettingTab extends PluginSettingTab {
	plugin: TitleSerialNumberPlugin;

	constructor(app: App, plugin: TitleSerialNumberPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for title serial number plugin.'});

		containerEl.createDiv({text: "Which headlines do you like to generate serial number for?"});

		let div = containerEl.createDiv();
		for (const i of [1, 2, 3, 4, 5, 6]) {
			div.createEl('label', { attr: { for: `h${i}` }, text: `H${i}` });

			let hxInput =  div.createEl('input', { type: 'checkbox', attr: {id: `h${i}`, name: "actived-headline"}});
			if(this.plugin.settings.activedHeadlines.includes(i)){
				hxInput.checked = true//把从文件读取出来的用户设置, 还原到复选框上
			}

			let activedArr: number[] = []
			hxInput.addEventListener("change", async (ev)=>{
				let cked = div.querySelectorAll("input[type=checkbox][name=actived-headline]");
				for (let i = 0; i < cked.length; i++) {
					const element = cked[i];
					let e = <HTMLInputElement> element;
					//console.log(`h${i+1}: ${e.checked}`)

					if(e.checked){
						activedArr.push(i + 1)
					}
					this.plugin.settings.activedHeadlines = activedArr;
					await this.plugin.saveSettings();
				}
				
			});

			div.createEl("span", {text: "  |  "});//分割
		}


	}
}