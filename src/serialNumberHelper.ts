

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
	 * @param level 当前标题等级；如h4，则level=4
	 * @param startWith 取值范围：1~6；从h几开始添加标题，如2，则#不生成序号，##生成序号1、2、3，###生成序号1.1、1.2、1.3……
	 * @param endWith 取值范围 1~7；如2，则只对h1生成序号；如7，则对h1~6生成序号
	 * @returns 点分序号 或 空字符串
	 */
    public static getSerialNumberStr(level: number, startWith: number, endWith: number): string{
		if(level >= endWith){
			return '';//大于endWith的不生成序号
		}
		if(level < startWith){
			return '';//小于startWith的不生成序号
		}
        level = level - startWith + 1;
        let newSerialNumber: string = '';//新的序号
        for (let idx = 0; idx < level; idx++) {
            if (idx == level - 1) {
                SerialNumberHelper.resetHxSerialNumbers(idx + 1);//若当前是h3，则把h4、h5、h6的索引值情况为0；
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