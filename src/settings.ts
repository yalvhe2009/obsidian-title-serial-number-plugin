import { App, PluginSettingTab, Setting } from 'obsidian';
import TitleSerialNumberPlugin from './main';


export interface TitleSerialNumberPluginSettings {
	startWith: string;//从h几 标题开始加序号
	endWith: string;//从h几 标题后，不加序号
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

		new Setting(containerEl)
			.setName('Start With (X)')
			.setDesc('To add serial number when header level in interval [X, Y].')
			.addDropdown(dropdown=>{
				for (const i of [1, 2, 3, 4, 5, 6]) {
					dropdown.addOption(i.toString(), i.toString());
				}
				dropdown.setValue(this.plugin.settings.startWith);
				dropdown.onChange(async (value)=>{
					this.plugin.settings.startWith = value;
					await this.plugin.saveSettings();
				})
			});
		new Setting(containerEl)
		.setName('End With (Y)')
		.setDesc('To add serial number when header level in interval [X, Y].')
		.addDropdown(dropdown=>{
			for (const i of [1, 2, 3, 4, 5, 6]) {
				dropdown.addOption(i.toString(), i.toString());
			}
			dropdown.setValue(this.plugin.settings.endWith);
			dropdown.onChange(async (value)=>{
				this.plugin.settings.endWith = value;
				await this.plugin.saveSettings();
			})
		});
	}
}