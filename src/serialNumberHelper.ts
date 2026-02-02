import { TitleSerialNumberPluginSettings } from './settings';
import { NumberConverter } from './numberConverter';

/**
 * 序号生成器类
 * 负责管理标题计数器和生成序号字符串
 */
export class SerialNumberHelper {
    // 每个标题级别的计数器 (索引0对应H1, 索引5对应H6)
    private counters: number[] = [0, 0, 0, 0, 0, 0];
    
    // 插件设置
    private settings: TitleSerialNumberPluginSettings;

    constructor(settings: TitleSerialNumberPluginSettings) {
        this.settings = settings;
    }

    /**
     * 更新设置
     */
    public updateSettings(settings: TitleSerialNumberPluginSettings): void {
        this.settings = settings;
    }

    /**
     * 重置所有计数器为0
     */
    public resetAllCounters(): void {
        this.counters = [0, 0, 0, 0, 0, 0];
    }

    /**
     * 重置指定级别及其所有子级别的计数器
     * @param level 标题级别 (1-6)
     */
    public resetCountersFrom(level: number): void {
        for (let i = level - 1; i < 6; i++) {
            this.counters[i] = 0;
        }
    }

    /**
     * 检查指定级别是否在编号范围内
     * @param level 标题级别 (1-6)
     * @returns 是否需要编号
     */
    public isLevelInRange(level: number): boolean {
        return level >= this.settings.startLevel && level <= this.settings.endLevel;
    }

    /**
     * 为指定标题级别生成序号
     * @param level 标题级别 (1-6)
     * @returns 序号字符串，如果该级别不在范围内则返回空字符串
     */
    public generateSerialNumber(level: number): string {
        // 检查是否在编号范围内
        if (!this.isLevelInRange(level)) {
            return '';
        }

        const { startLevel, endLevel, separator, levelStyles } = this.settings;

        // 增加当前级别的计数器
        this.counters[level - 1]++;

        // 重置所有子级别的计数器
        this.resetCountersFrom(level + 1);

        // 构建序号字符串
        const parts: string[] = [];
        
        for (let l = startLevel; l <= level; l++) {
            const count = this.counters[l - 1];
            
            // 如果父级别计数为0，说明文档结构有问题，但我们仍然生成序号
            // 使用1作为默认值以避免生成0
            const effectiveCount = count > 0 ? count : 1;
            
            const style = levelStyles[l] || 'arabic';
            const converted = NumberConverter.convert(effectiveCount, style);
            parts.push(converted);
        }

        return parts.join(separator);
    }

    /**
     * 获取当前级别的计数器值
     * @param level 标题级别 (1-6)
     * @returns 计数器值
     */
    public getCounter(level: number): number {
        if (level < 1 || level > 6) return 0;
        return this.counters[level - 1];
    }

    /**
     * 创建用于匹配标题的正则表达式
     * 匹配格式: ## [可选的序号] 标题内容
     * @returns 正则表达式
     */
    public static createHeadingRegex(): RegExp {
        const serialPattern = NumberConverter.getSerialNumberPattern();
        // 匹配: #号 + 空格 + 可选的(序号 + 空格) + 标题内容
        // 分组1: #号
        // 分组2: 可选的序号(带尾部空格)
        // 分组3: 标题内容
        return new RegExp(`^(#{1,6}) (?:(${serialPattern}) )?(.*)$`, 'gm');
    }

    // 代码块占位符前缀和后缀
    private static readonly CODE_BLOCK_PLACEHOLDER_PREFIX = '<<<CODE_BLOCK_PLACEHOLDER_';
    private static readonly CODE_BLOCK_PLACEHOLDER_SUFFIX = '_>>>';

    /**
     * 保护代码块，将代码块替换为占位符
     * @param content 原始内容
     * @returns [保护后的内容, 代码块数组]
     */
    private static protectCodeBlocks(content: string): [string, string[]] {
        const codeBlocks: string[] = [];
        
        // 匹配围栏代码块 (``` 或 ~~~)
        // 支持 ```language 格式，匹配到对应的结束标记
        const fencePattern = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1$/gm;
        
        const protectedContent = content.replace(fencePattern, (match) => {
            const index = codeBlocks.length;
            codeBlocks.push(match);
            return `${SerialNumberHelper.CODE_BLOCK_PLACEHOLDER_PREFIX}${index}${SerialNumberHelper.CODE_BLOCK_PLACEHOLDER_SUFFIX}`;
        });
        
        return [protectedContent, codeBlocks];
    }

    /**
     * 还原代码块，将占位符替换回原始代码块
     * @param content 包含占位符的内容
     * @param codeBlocks 代码块数组
     * @returns 还原后的内容
     */
    private static restoreCodeBlocks(content: string, codeBlocks: string[]): string {
        const placeholderPattern = new RegExp(
            `${SerialNumberHelper.CODE_BLOCK_PLACEHOLDER_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)${SerialNumberHelper.CODE_BLOCK_PLACEHOLDER_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
            'g'
        );
        
        return content.replace(placeholderPattern, (_, indexStr) => {
            const index = parseInt(indexStr, 10);
            return codeBlocks[index] || '';
        });
    }

    /**
     * 处理文档内容，添加序号
     * @param content 原始文档内容
     * @returns 处理后的文档内容
     */
    public processContent(content: string): string {
        this.resetAllCounters();
        
        // 1. 保护代码块
        const [protectedContent, codeBlocks] = SerialNumberHelper.protectCodeBlocks(content);
        
        const regex = SerialNumberHelper.createHeadingRegex();
        
        // 2. 使用 replace 回调函数处理每个匹配
        const result = protectedContent.replace(regex, (match, hashes, oldSerial, title) => {
            const level = hashes.length;
            
            // 生成新序号
            const newSerial = this.generateSerialNumber(level);
            
            // 如果不在编号范围内，保留原标题（去掉旧序号）
            if (newSerial === '') {
                return `${hashes} ${title}`;
            }
            
            return `${hashes} ${newSerial} ${title}`;
        });
        
        // 3. 还原代码块
        const finalResult = SerialNumberHelper.restoreCodeBlocks(result, codeBlocks);
        
        this.resetAllCounters();
        return finalResult;
    }

    /**
     * 清除文档中的所有序号
     * @param content 原始文档内容
     * @returns 清除序号后的文档内容
     */
    public static clearSerialNumbers(content: string): string {
        // 1. 保护代码块
        const [protectedContent, codeBlocks] = SerialNumberHelper.protectCodeBlocks(content);
        
        const regex = SerialNumberHelper.createHeadingRegex();
        
        // 2. 清除序号
        const result = protectedContent.replace(regex, (match, hashes, oldSerial, title) => {
            return `${hashes} ${title}`;
        });
        
        // 3. 还原代码块
        return SerialNumberHelper.restoreCodeBlocks(result, codeBlocks);
    }
}
