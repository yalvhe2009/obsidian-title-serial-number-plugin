import { App, PluginSettingTab, Setting } from 'obsidian';
import TitleSerialNumberPlugin from './main';

// 序号样式类型
export type NumberStyle = 'arabic' | 'chinese' | 'chinese_capital' | 'roman' | 'roman_lower' | 'alpha' | 'alpha_lower';

// 每个级别的样式配置
export interface LevelStyleConfig {
    style: NumberStyle;
}

// 插件设置接口
export interface TitleSerialNumberPluginSettings {
    startLevel: number;                          // 从哪个级别开始编号 (1-6)
    endLevel: number;                            // 到哪个级别结束编号 (1-6)
    separator: string;                           // 级别之间的分隔符
    levelStyles: { [level: number]: NumberStyle }; // 每个级别的序号样式
}

// 默认设置
export const DEFAULT_SETTINGS: TitleSerialNumberPluginSettings = {
    startLevel: 1,
    endLevel: 6,
    separator: '.',
    levelStyles: {
        1: 'arabic',
        2: 'arabic',
        3: 'arabic',
        4: 'arabic',
        5: 'arabic',
        6: 'arabic'
    }
};

// 样式显示名称映射
export const STYLE_DISPLAY_NAMES: { [key in NumberStyle]: string } = {
    'arabic': '阿拉伯数字 (1, 2, 3...)',
    'chinese': '中文小写 (一, 二, 三...)',
    'chinese_capital': '中文大写 (壹, 贰, 叁...)',
    'roman': '罗马大写 (I, II, III...)',
    'roman_lower': '罗马小写 (i, ii, iii...)',
    'alpha': '字母大写 (A, B, C...)',
    'alpha_lower': '字母小写 (a, b, c...)'
};

// 设置页面类
export class TitleSerialNumberPluginSettingTab extends PluginSettingTab {
    plugin: TitleSerialNumberPlugin;
    private previewContainer: HTMLElement | null = null;

    constructor(app: App, plugin: TitleSerialNumberPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: '标题序号插件设置' });

        // 起始级别设置
        new Setting(containerEl)
            .setName('起始标题级别')
            .setDesc('从哪个标题级别开始添加序号 (H1-H6)')
            .addDropdown(dropdown => {
                for (let i = 1; i <= 6; i++) {
                    dropdown.addOption(i.toString(), `H${i}`);
                }
                dropdown.setValue(this.plugin.settings.startLevel.toString());
                dropdown.onChange(async (value) => {
                    const newStartLevel = parseInt(value);
                    this.plugin.settings.startLevel = newStartLevel;
                    // 确保结束级别不小于起始级别
                    if (this.plugin.settings.endLevel < newStartLevel) {
                        this.plugin.settings.endLevel = newStartLevel;
                    }
                    await this.plugin.saveSettings();
                    this.display(); // 刷新显示
                });
            });

        // 结束级别设置
        new Setting(containerEl)
            .setName('结束标题级别')
            .setDesc('到哪个标题级别结束添加序号 (H1-H6)')
            .addDropdown(dropdown => {
                for (let i = this.plugin.settings.startLevel; i <= 6; i++) {
                    dropdown.addOption(i.toString(), `H${i}`);
                }
                dropdown.setValue(this.plugin.settings.endLevel.toString());
                dropdown.onChange(async (value) => {
                    this.plugin.settings.endLevel = parseInt(value);
                    await this.plugin.saveSettings();
                    this.display(); // 刷新显示以更新样式选项和预览
                });
            });

        // 分隔符设置
        new Setting(containerEl)
            .setName('序号分隔符')
            .setDesc('各级序号之间的分隔符，如 "." 会生成 1.1.1，"、" 会生成 1、1、1')
            .addText(text => {
                text.setPlaceholder('.')
                    .setValue(this.plugin.settings.separator)
                    .onChange(async (value) => {
                        this.plugin.settings.separator = value;
                        await this.plugin.saveSettings();
                        this.updatePreview(); // 实时更新预览
                    });
            });

        // 分隔线
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: '各级标题序号样式' });
        containerEl.createEl('p', { 
            text: '为每个标题级别选择序号样式',
            cls: 'setting-item-description'
        });

        // 每个级别的样式设置
        for (let level = this.plugin.settings.startLevel; level <= this.plugin.settings.endLevel; level++) {
            new Setting(containerEl)
                .setName(`H${level} 序号样式`)
                .setDesc(`第 ${level} 级标题的序号样式`)
                .addDropdown(dropdown => {
                    for (const [style, displayName] of Object.entries(STYLE_DISPLAY_NAMES)) {
                        dropdown.addOption(style, displayName);
                    }
                    dropdown.setValue(this.plugin.settings.levelStyles[level] || 'arabic');
                    dropdown.onChange(async (value) => {
                        this.plugin.settings.levelStyles[level] = value as NumberStyle;
                        await this.plugin.saveSettings();
                        this.updatePreview(); // 实时更新预览
                    });
                });
        }

        // 分隔线
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: '预览' });

        // 生成预览
        this.previewContainer = containerEl.createDiv({ cls: 'serial-number-preview' });
        this.renderPreview(this.previewContainer);
    }

    // 更新预览
    private updatePreview(): void {
        if (this.previewContainer) {
            this.renderPreview(this.previewContainer);
        }
    }

    // 渲染预览
    private renderPreview(container: HTMLElement): void {
        const { startLevel, endLevel, separator, levelStyles } = this.plugin.settings;
        
        // 动态导入转换器（避免循环依赖）
        import('./numberConverter').then(({ NumberConverter }) => {
            const previewLines: string[] = [];
            const counters: number[] = [0, 0, 0, 0, 0, 0];
            
            // 模拟生成序号预览
            for (let level = startLevel; level <= endLevel; level++) {
                counters[level - 1] = 1;
                
                // 构建序号字符串
                const parts: string[] = [];
                for (let l = startLevel; l <= level; l++) {
                    const style = levelStyles[l] || 'arabic';
                    const num = l === level ? 1 : counters[l - 1];
                    parts.push(NumberConverter.convert(num, style));
                }
                
                const serialNumber = parts.join(separator);
                const hashes = '#'.repeat(level);
                previewLines.push(`${hashes} ${serialNumber} 示例标题`);
            }
            
            container.empty();
            const pre = container.createEl('pre');
            pre.style.backgroundColor = 'var(--background-secondary)';
            pre.style.padding = '10px';
            pre.style.borderRadius = '5px';
            pre.style.fontSize = '12px';
            pre.setText(previewLines.join('\n'));
        });
    }
}
