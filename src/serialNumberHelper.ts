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

    /**
     * 处理文档内容，添加序号
     * @param content 原始文档内容
     * @returns 处理后的文档内容
     */
    public processContent(content: string): string {
        this.resetAllCounters();
        
        const regex = SerialNumberHelper.createHeadingRegex();
        
        // 使用 replace 回调函数处理每个匹配
        const result = content.replace(regex, (match, hashes, oldSerial, title) => {
            const level = hashes.length;
            
            // 生成新序号
            const newSerial = this.generateSerialNumber(level);
            
            // 如果不在编号范围内，保留原标题（去掉旧序号）
            if (newSerial === '') {
                return `${hashes} ${title}`;
            }
            
            return `${hashes} ${newSerial} ${title}`;
        });
        
        this.resetAllCounters();
        return result;
    }

    /**
     * 清除文档中的所有序号
     * @param content 原始文档内容
     * @returns 清除序号后的文档内容
     */
    public static clearSerialNumbers(content: string): string {
        const regex = SerialNumberHelper.createHeadingRegex();
        
        return content.replace(regex, (match, hashes, oldSerial, title) => {
            return `${hashes} ${title}`;
        });
    }
}
