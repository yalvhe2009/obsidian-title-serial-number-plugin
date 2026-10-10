const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const path = require('node:path');
const { buildSync } = require('esbuild');

// Run the actual TypeScript implementation; only Obsidian's UI API is stubbed.
const { outputFiles } = buildSync({
    stdin: {
        contents: `
            export { SerialNumberHelper } from './src/serialNumberHelper';
            export { DEFAULT_SETTINGS, TitleSerialNumberPluginSettingTab } from './src/settings';
            export { default as Plugin } from './src/main';
        `,
        resolveDir: path.resolve(__dirname, '..'),
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['obsidian'],
    write: false,
});
const sandbox = {
    module: { exports: {} },
    require(id) {
        assert.equal(id, 'obsidian');
        return {
            Plugin: class {
                commands = [];
                async loadData() { return {}; }
                addCommand(command) { this.commands.push(command); }
                addSettingTab() {}
            },
            PluginSettingTab: class {},
            Notice: class {},
        };
    },
};
vm.runInNewContext(outputFiles[0].text, sandbox);
const { SerialNumberHelper, DEFAULT_SETTINGS, TitleSerialNumberPluginSettingTab, Plugin } = sandbox.module.exports;
const settings = (overrides = {}) => ({ ...structuredClone(DEFAULT_SETTINGS), ...overrides });

test('issue #11: adding and clearing preserve unnumbered English headings', () => {
    const helper = new SerialNumberHelper(settings());
    for (const title of [
        'Hello world', 'Getting started guide', 'Current State', 'Introduction',
        'A guide', 'I think', 'a guide', 'i think', 'mix colors', 'CIVIL rights',
        'API Reference', 'Quick-start guide', 'getting-started guide', 'Hello, world',
    ]) {
        for (let level = 1; level <= 6; level++) {
            const hashes = '#'.repeat(level);
            const input = `${hashes} ${title}`;
            const numbered = `${hashes} ${Array(level).fill('1').join('.')} ${title}`;
            assert.equal(helper.processContent(input), numbered);
            assert.equal(SerialNumberHelper.clearSerialNumbers(input), input);
            assert.equal(helper.processContent(numbered), numbered);
            assert.equal(SerialNumberHelper.clearSerialNumbers(numbered), input);
        }
    }
});

test('repeated clear operations do not remove successive words', () => {
    let content = '# 1 Hello beautiful world';
    for (let i = 0; i < 4; i++) {
        content = SerialNumberHelper.clearSerialNumbers(content);
        assert.equal(content, '# Hello beautiful world');
    }
});

test('headings outside the configured range preserve their text', () => {
    const helper = new SerialNumberHelper(settings({ startLevel: 2, endLevel: 3 }));
    const input = '# Hello world\n## Getting started\n### Current State\n#### API Reference';
    assert.equal(helper.processContent(input), '# Hello world\n## 1 Getting started\n### 1.1 Current State\n#### API Reference');
});

test('plain text and fenced code are unchanged', () => {
    const input = 'Hello world\n\n```markdown\n# Hello world\n## 1 Code example\n```\n\n~~~\n# Another example\n~~~';
    assert.equal(new SerialNumberHelper(settings()).processContent(input), input);
    assert.equal(SerialNumberHelper.clearSerialNumbers(input), input);
});

test('existing numeric numbering can be replaced and cleared', () => {
    const helper = new SerialNumberHelper(settings());
    assert.equal(helper.processContent('# 8 Hello world\n## 8.4 Getting started'), '# 1 Hello world\n## 1.1 Getting started');
    for (const serial of ['1', '1.2.3', '一', '壹', '一.二', '1-2', '1/2', '一、二']) {
        assert.equal(SerialNumberHelper.clearSerialNumbers(`# ${serial} Hello world`), '# Hello world');
    }
});

const styles = {
    arabic: '1', chinese: '一', chinese_capital: '壹',
    roman: '(I)', roman_lower: '(i)', alpha: '(A)', alpha_lower: '(a)',
};
for (const [style, serial] of Object.entries(styles)) {
    test(`${style}: add, repeat, clear and re-add preserve the complete title`, () => {
        const helper = new SerialNumberHelper(settings({ levelStyles: { 1: style } }));
        const input = '# A guide to testing\n# I think this works';
        const numbered = helper.processContent(input);
        assert.equal(numbered.split('\n')[0], `# ${serial} A guide to testing`);
        assert.equal(helper.processContent(numbered), numbered);
        const cleared = SerialNumberHelper.clearSerialNumbers(numbered);
        assert.equal(cleared, input);
        assert.equal(SerialNumberHelper.clearSerialNumbers(cleared), input);
        assert.equal(helper.processContent(cleared), numbered);
    });
}

test('alphabetic numbering continues past Z without sacrificing words', () => {
    for (const style of ['alpha', 'alpha_lower']) {
        const helper = new SerialNumberHelper(settings({ levelStyles: { 1: style } }));
        const input = Array(28).fill('# Hello world').join('\n');
        const numbered = helper.processContent(input);
        assert.equal(numbered.split('\n')[26], style === 'alpha' ? '# (AA) Hello world' : '# (aa) Hello world');
        assert.equal(helper.processContent(numbered), numbered);
        assert.equal(SerialNumberHelper.clearSerialNumbers(numbered), input);
    }
});

test('mixed styles round-trip with custom separators, including regex characters', () => {
    for (const separator of ['.', '-', '/', '、', '_', '::', '*', '[x]', ' ', '']) {
        const helper = new SerialNumberHelper(settings({ separator, levelStyles: { 1: 'roman', 2: 'arabic', 3: 'alpha_lower' } }));
        const input = '# Hello world\n## Getting started\n### Current State';
        const numbered = `# (I) Hello world\n## (I${separator}1) Getting started\n### (I${separator}1${separator}a) Current State`;
        assert.equal(helper.processContent(input), numbered);
        assert.equal(helper.processContent(numbered), numbered);
        assert.equal(SerialNumberHelper.clearSerialNumbers(numbered, separator), input);
    }
});

test('switching styles replaces marked serials without changing title text', () => {
    const input = '# Hello world\n## Getting started';
    const alpha = new SerialNumberHelper(settings({ levelStyles: { 1: 'alpha', 2: 'alpha_lower' } }));
    const arabic = new SerialNumberHelper(settings());
    assert.equal(arabic.processContent(alpha.processContent(input)), arabic.processContent(input));
    assert.equal(alpha.processContent(arabic.processContent(input)), alpha.processContent(input));
});

test('ambiguous legacy alphabetic prefixes are preserved as text', () => {
    const input = '# A guide\n# I think\n## I.1.a Existing heading';
    assert.equal(SerialNumberHelper.clearSerialNumbers(input), input);
});

test('settings preview agrees with generated mixed-style numbering', async () => {
    const config = settings({ levelStyles: { 1: 'roman', 2: 'arabic', 3: 'alpha_lower' }, endLevel: 3 });
    const tab = new TitleSerialNumberPluginSettingTab({}, { settings: config });
    let preview;
    tab.renderPreview({ empty() {}, createEl() { return { style: {}, setText(text) { preview = text; } }; } });
    // The preview imports its converter asynchronously.
    await new Promise(resolve => setImmediate(resolve));
    const input = '# Example Heading\n## Example Heading\n### Example Heading';
    assert.equal(preview, new SerialNumberHelper(config).processContent(input));
});

test('Obsidian command callbacks use the configured separator for add and clear', async () => {
    const plugin = new Plugin();
    await plugin.onload();
    plugin.settings = settings({ separator: '::', levelStyles: { 1: 'roman', 2: 'alpha' } });
    const input = '# Hello world\n## Getting started';
    let content = input;
    const editor = { getValue: () => content, setValue: value => { content = value; } };
    const command = id => plugin.commands.find(item => item.id === id).editorCallback(editor, {});
    command('set-title-serial-number');
    assert.equal(content, '# (I) Hello world\n## (I::A) Getting started');
    command('set-title-serial-number');
    assert.equal(content, '# (I) Hello world\n## (I::A) Getting started');
    command('clear-title-serial-number');
    assert.equal(content, input);
    command('clear-title-serial-number');
    assert.equal(content, input);
});
