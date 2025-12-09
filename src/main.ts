import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { SerialNumberHelper } from './serialNumberHelper';
import { 
    TitleSerialNumberPluginSettings, 
    TitleSerialNumberPluginSettingTab,
    DEFAULT_SETTINGS 
} from './settings';

export default class TitleSerialNumberPlugin extends Plugin {
    settings: TitleSerialNumberPluginSettings;
    private serialHelper: SerialNumberHelper;

    async onload() {
        await this.loadSettings();
        
        // 初始化序号生成器
        this.serialHelper = new SerialNumberHelper(this.settings);

        // 添加设置序号命令
        this.addCommand({
            id: 'set-title-serial-number',
            name: 'Set Serial Number',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.setSerialNumbers(editor);
            }
        });

        // 添加清除序号命令
        this.addCommand({
            id: 'clear-title-serial-number',
            name: 'Clear Serial Number',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.clearSerialNumbers(editor);
            }
        });

        // 添加设置页面
        this.addSettingTab(new TitleSerialNumberPluginSettingTab(this.app, this));
    }

    onunload() {
        // 清理工作
    }

    /**
     * 为文档添加序号
     */
    private setSerialNumbers(editor: Editor): void {
        // 验证设置
        if (this.settings.startLevel > this.settings.endLevel) {
            new Notice('Configuration error: start level cannot be greater than end level!');
            return;
        }

        // 更新序号生成器的设置
        this.serialHelper.updateSettings(this.settings);

        // 获取编辑器内容
        const content = editor.getValue();

        // 处理内容
        const newContent = this.serialHelper.processContent(content);

        // 更新编辑器
        if (content !== newContent) {
            editor.setValue(newContent);
            new Notice('Serial number added!');
        } else {
            new Notice('No titles need to add serial number.');
        }
    }

    /**
     * 清除文档中的序号
     */
    private clearSerialNumbers(editor: Editor): void {
        const content = editor.getValue();
        const newContent = SerialNumberHelper.clearSerialNumbers(content);

        if (content !== newContent) {
            editor.setValue(newContent);
            new Notice('Serial number cleared!');
        } else {
            new Notice('No serial number to clear.');
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        
        // 确保 levelStyles 完整
        for (let i = 1; i <= 6; i++) {
            if (!this.settings.levelStyles[i]) {
                this.settings.levelStyles[i] = 'arabic';
            }
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
        
        // 更新序号生成器的设置
        if (this.serialHelper) {
            this.serialHelper.updateSettings(this.settings);
        }
    }
}
