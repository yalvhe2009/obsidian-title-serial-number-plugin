import { App, PluginSettingTab, Setting } from 'obsidian';
import TitleSerialNumberPlugin from './main';

// Number style type
export type NumberStyle = 'arabic' | 'chinese' | 'chinese_capital' | 'roman' | 'roman_lower' | 'alpha' | 'alpha_lower';

// Style configuration for each level
export interface LevelStyleConfig {
    style: NumberStyle;
}

// Plugin settings interface
export interface TitleSerialNumberPluginSettings {
    startLevel: number;                          // Starting level for numbering (1-6)
    endLevel: number;                            // Ending level for numbering (1-6)
    separator: string;                           // Separator between levels
    levelStyles: { [level: number]: NumberStyle }; // Number style for each level
}

// Default settings
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

// Style display name mapping
export const STYLE_DISPLAY_NAMES: { [key in NumberStyle]: string } = {
    'arabic': 'Arabic (1, 2, 3...)',
    'chinese': 'Chinese Lowercase (一, 二, 三...)',
    'chinese_capital': 'Chinese Uppercase (壹, 贰, 叁...)',
    'roman': 'Roman Uppercase (I, II, III...)',
    'roman_lower': 'Roman Lowercase (i, ii, iii...)',
    'alpha': 'Alpha Uppercase (A, B, C...)',
    'alpha_lower': 'Alpha Lowercase (a, b, c...)'
};

// Settings tab class
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

        containerEl.createEl('h2', { text: 'Title Serial Number Settings' });

        // Start level setting
        new Setting(containerEl)
            .setName('Start Heading Level')
            .setDesc('Which heading level to start adding serial numbers (H1-H6)')
            .addDropdown(dropdown => {
                for (let i = 1; i <= 6; i++) {
                    dropdown.addOption(i.toString(), `H${i}`);
                }
                dropdown.setValue(this.plugin.settings.startLevel.toString());
                dropdown.onChange(async (value) => {
                    const newStartLevel = parseInt(value);
                    this.plugin.settings.startLevel = newStartLevel;
                    // Ensure end level is not less than start level
                    if (this.plugin.settings.endLevel < newStartLevel) {
                        this.plugin.settings.endLevel = newStartLevel;
                    }
                    await this.plugin.saveSettings();
                    this.display(); // Refresh display
                });
            });

        // End level setting
        new Setting(containerEl)
            .setName('End Heading Level')
            .setDesc('Which heading level to stop adding serial numbers (H1-H6)')
            .addDropdown(dropdown => {
                for (let i = this.plugin.settings.startLevel; i <= 6; i++) {
                    dropdown.addOption(i.toString(), `H${i}`);
                }
                dropdown.setValue(this.plugin.settings.endLevel.toString());
                dropdown.onChange(async (value) => {
                    this.plugin.settings.endLevel = parseInt(value);
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to update style options and preview
                });
            });

        // Separator setting
        new Setting(containerEl)
            .setName('Number Separator')
            .setDesc('Separator between level numbers, e.g. "." produces 1.1.1, "-" produces 1-1-1')
            .addText(text => {
                text.setPlaceholder('.')
                    .setValue(this.plugin.settings.separator)
                    .onChange(async (value) => {
                        this.plugin.settings.separator = value;
                        await this.plugin.saveSettings();
                        this.updatePreview(); // Update preview in real-time
                    });
            });

        // Divider
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: 'Heading Number Styles' });
        containerEl.createEl('p', { 
            text: 'Choose number style for each heading level',
            cls: 'setting-item-description'
        });

        // Style setting for each level
        for (let level = this.plugin.settings.startLevel; level <= this.plugin.settings.endLevel; level++) {
            new Setting(containerEl)
                .setName(`H${level} Number Style`)
                .setDesc(`Number style for heading level ${level}`)
                .addDropdown(dropdown => {
                    for (const [style, displayName] of Object.entries(STYLE_DISPLAY_NAMES)) {
                        dropdown.addOption(style, displayName);
                    }
                    dropdown.setValue(this.plugin.settings.levelStyles[level] || 'arabic');
                    dropdown.onChange(async (value) => {
                        this.plugin.settings.levelStyles[level] = value as NumberStyle;
                        await this.plugin.saveSettings();
                        this.updatePreview(); // Update preview in real-time
                    });
                });
        }

        // Divider
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: 'Preview' });

        // Generate preview
        this.previewContainer = containerEl.createDiv({ cls: 'serial-number-preview' });
        this.renderPreview(this.previewContainer);
    }

    // Update preview
    private updatePreview(): void {
        if (this.previewContainer) {
            this.renderPreview(this.previewContainer);
        }
    }

    // Render preview
    private renderPreview(container: HTMLElement): void {
        const { startLevel, endLevel, separator, levelStyles } = this.plugin.settings;
        
        // Dynamic import converter (avoid circular dependency)
        import('./numberConverter').then(({ NumberConverter }) => {
            const previewLines: string[] = [];
            const counters: number[] = [0, 0, 0, 0, 0, 0];
            
            // Simulate serial number preview
            for (let level = startLevel; level <= endLevel; level++) {
                counters[level - 1] = 1;
                
                // Build serial number string
                const parts: string[] = [];
                for (let l = startLevel; l <= level; l++) {
                    const style = levelStyles[l] || 'arabic';
                    const num = l === level ? 1 : counters[l - 1];
                    parts.push(NumberConverter.convert(num, style));
                }
                
                const serialNumber = parts.join(separator);
                const hashes = '#'.repeat(level);
                previewLines.push(`${hashes} ${serialNumber} Example Heading`);
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
