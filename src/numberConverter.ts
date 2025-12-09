import { NumberStyle } from './settings';

/**
 * 数字转换器类
 * 支持将数字转换为各种序号样式
 */
export class NumberConverter {
    // 中文小写数字
    private static readonly CHINESE_NUMBERS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    
    // 中文大写数字
    private static readonly CHINESE_CAPITAL_NUMBERS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾'];
    
    // 中文数字单位
    private static readonly CHINESE_UNITS = ['', '十', '百', '千', '万'];
    private static readonly CHINESE_CAPITAL_UNITS = ['', '拾', '佰', '仟', '万'];

    /**
     * 将数字转换为指定样式的序号
     * @param num 数字 (1-based)
     * @param style 序号样式
     * @returns 转换后的序号字符串
     */
    public static convert(num: number, style: NumberStyle): string {
        switch (style) {
            case 'arabic':
                return num.toString();
            case 'chinese':
                return this.toChineseNumber(num, false);
            case 'chinese_capital':
                return this.toChineseNumber(num, true);
            case 'roman':
                return this.toRomanNumeral(num, true);
            case 'roman_lower':
                return this.toRomanNumeral(num, false);
            case 'alpha':
                return this.toAlpha(num, true);
            case 'alpha_lower':
                return this.toAlpha(num, false);
            default:
                return num.toString();
        }
    }

    /**
     * 将数字转换为中文数字
     * @param num 数字
     * @param capital 是否使用大写
     * @returns 中文数字字符串
     */
    private static toChineseNumber(num: number, capital: boolean): string {
        if (num <= 0) return '';
        
        const numbers = capital ? this.CHINESE_CAPITAL_NUMBERS : this.CHINESE_NUMBERS;
        const units = capital ? this.CHINESE_CAPITAL_UNITS : this.CHINESE_UNITS;
        
        // 处理 1-10
        if (num <= 10) {
            if (num === 10) {
                return units[1]; // 十 或 拾
            }
            return numbers[num];
        }
        
        // 处理 11-99
        if (num < 100) {
            const tens = Math.floor(num / 10);
            const ones = num % 10;
            
            let result = '';
            if (tens === 1) {
                result = units[1]; // 十 或 拾
            } else {
                result = numbers[tens] + units[1];
            }
            
            if (ones > 0) {
                result += numbers[ones];
            }
            
            return result;
        }
        
        // 处理 100-999
        if (num < 1000) {
            const hundreds = Math.floor(num / 100);
            const remainder = num % 100;
            
            let result = numbers[hundreds] + units[2]; // 百 或 佰
            
            if (remainder > 0) {
                if (remainder < 10) {
                    result += numbers[0] + numbers[remainder]; // 零X
                } else {
                    result += this.toChineseNumber(remainder, capital);
                }
            }
            
            return result;
        }
        
        // 处理 1000-9999
        if (num < 10000) {
            const thousands = Math.floor(num / 1000);
            const remainder = num % 1000;
            
            let result = numbers[thousands] + units[3]; // 千 或 仟
            
            if (remainder > 0) {
                if (remainder < 100) {
                    result += numbers[0] + this.toChineseNumber(remainder, capital);
                } else {
                    result += this.toChineseNumber(remainder, capital);
                }
            }
            
            return result;
        }
        
        // 超过9999，使用阿拉伯数字
        return num.toString();
    }

    /**
     * 将数字转换为罗马数字
     * @param num 数字
     * @param uppercase 是否大写
     * @returns 罗马数字字符串
     */
    private static toRomanNumeral(num: number, uppercase: boolean): string {
        if (num <= 0 || num > 3999) {
            return num.toString(); // 罗马数字范围限制
        }
        
        const romanNumerals: [number, string][] = [
            [1000, 'M'],
            [900, 'CM'],
            [500, 'D'],
            [400, 'CD'],
            [100, 'C'],
            [90, 'XC'],
            [50, 'L'],
            [40, 'XL'],
            [10, 'X'],
            [9, 'IX'],
            [5, 'V'],
            [4, 'IV'],
            [1, 'I']
        ];
        
        let result = '';
        let remaining = num;
        
        for (const [value, symbol] of romanNumerals) {
            while (remaining >= value) {
                result += symbol;
                remaining -= value;
            }
        }
        
        return uppercase ? result : result.toLowerCase();
    }

    /**
     * 将数字转换为字母序号
     * @param num 数字
     * @param uppercase 是否大写
     * @returns 字母序号字符串 (A-Z, AA-AZ, BA-BZ, ...)
     */
    private static toAlpha(num: number, uppercase: boolean): string {
        if (num <= 0) return '';
        
        let result = '';
        let n = num;
        
        while (n > 0) {
            n--; // 调整为0-based
            const remainder = n % 26;
            const char = String.fromCharCode(65 + remainder); // 'A' = 65
            result = char + result;
            n = Math.floor(n / 26);
        }
        
        return uppercase ? result : result.toLowerCase();
    }

    /**
     * 获取用于匹配序号的正则表达式模式
     * @returns 匹配各种序号格式的正则表达式字符串
     */
    public static getSerialNumberPattern(): string {
        // 匹配各种可能的序号格式：
        // - 阿拉伯数字: 1, 1.2, 1.2.3
        // - 中文数字: 一, 二, 一.二
        // - 罗马数字: I, II, III, i, ii, iii
        // - 字母: A, B, a, b
        // - 混合格式: 1.一.A
        const arabicPattern = '[0-9]+';
        const chinesePattern = '[零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+';
        const romanPattern = '[IVXLCDMivxlcdm]+';
        const alphaPattern = '[A-Za-z]+';
        
        // 单个序号部分
        const singlePart = `(?:${arabicPattern}|${chinesePattern}|${romanPattern}|${alphaPattern})`;
        
        // 分隔符: 点、顿号、横线、斜杠等
        const separator = '[.、\\-/]';
        
        // 完整的序号模式: 可能有多个部分用分隔符连接
        return `(?:${singlePart}(?:${separator}${singlePart})*)`;
    }
}

