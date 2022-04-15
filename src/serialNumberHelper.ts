

/**
 * 序号类
 */
 export class SerialNumberHelper{
    /** Hx的序号 */
    private static hxSerialNumbers: number[] = [0, 0, 0, 0, 0, 0];

    /**
     * 重置区间为[idx,6]的序号为0
     * @param idx 若idx=2（索引从0开始，故表示当前为h3），则把h3、h4、h5、h6的序号重置为0
     */
    public static resetHxSerialNumbers(idx: number){
        for (let index = idx; index < 6; index++) {
            SerialNumberHelper.hxSerialNumbers[index] = 0;
        }
    }

	/**
	 * 获取序号
	 * @param level 当前标题等级；如h4，则level=4 (即文章中这样写的: `#### 标题`)
	 * @param startWith 取值范围：1~6；从h几开始添加标题，如2，则#不生成序号，##生成序号1、2、3，###生成序号1.1、1.2、1.3……
	 * @param endWith 取值范围 `1~7`；如2，则只对h1生成序号；如7，则对h1~6生成序号
	 * @returns 点分序号 或 空字符串
	 */
    public static getSerialNumberStr(level: number, activedHeadlines: number[]): string{
        if (!activedHeadlines.includes(level)) {
            return '';//不在激活列表的标题, 不会生成序号
        }

        let serialLevel: number = activedHeadlines.indexOf(level) + 1;//序号等级, 如激活列表activedHeadlines=[3,4,6], 则[### 标题]会被转换为[### 1 标题], 此时h3对应的序号等级应该是1, 也就是说, 真实生成的序号应该只有一位数

        let newSerialNumber: string = '';//新的序号
        for (let idx = 0; idx < serialLevel; idx++) {
            if (idx == serialLevel - 1) {
                SerialNumberHelper.resetHxSerialNumbers(idx + 1);//若当前是h3，则把h4、h5、h6的索引值清空为0；
                SerialNumberHelper.hxSerialNumbers[idx] += 1;
                newSerialNumber += `${SerialNumberHelper.hxSerialNumbers[idx]}`;
            }
            else{
                newSerialNumber += `${SerialNumberHelper.hxSerialNumbers[idx]}.`;
            }
        }
        return `${newSerialNumber}`;
    }
}