class ConsoleUtil {

    public static debugCode_GetPokeInfo(input: Poke, inputConsoleStr: string = '') {
        if (!input) return;
        const typeMap: {
            a: string, b: string, c: string, d: string
        } = { a: '♥', b: '♠', c: '♦', d: '♣' };
        if (inputConsoleStr && inputConsoleStr.length > 0) console.log(inputConsoleStr);
        console.log('%c======================扑克牌详情 - start ==========================', 'color:#e1ddd8; font-size:12px;');
        console.log(`%c扑克牌：${typeMap[input.config.off.poke.type]} ${input.config.off.poke.figure}`, 'color:#2cbdffb0; font-size:12px;');
        console.log(`%c是否是固定框: ${input.config.off.fixed.is}, 固定盒子类型: ${input.config.off.fixed.type}`, 'color:#2cbdffb0; font-size:12px;');
        console.log('%c======================扑克牌详情 - end  ==========================', 'color:#e1ddd8; font-size:12px;');
    }

    public static debugCode_GetPoke(input: Poke | Poke[]) {
        if (!input) return;
        const typeMap: {
            a: string, b: string, c: string, d: string
        } = { a: '♥（红桃）', b: '♠（黑桃）', c: '♦（方块）', d: '♣（梅花）' };
        let array: Poke[] = [];
        // 判断传入对象是否是集合，如果是集合则继续遍历
        if (Object.prototype.toString.call(input) !== '[object Array]') {
            array = [input as Poke];
        } else {
            array = [...(input as Poke[])];
        }
        array.forEach(row => {
            console.log('%c' + typeMap[row.config.off.poke.type] + '_ ' + row.config.off.poke.figure, 'color:red;font-size:18px;');
        })
    }

    public static debugCode_GetPokeConfig(input: Poke[][] | Poke[]): any {
        const array: any = [];
        // 判断传入对象是否是集合，如果是集合则继续遍历
        if (Object.prototype.toString.call(input) === '[object Array]') {
            for (let row of input) {
                if (row instanceof Poke) {
                    array.push(row.config.off);
                } else if (Object.prototype.toString.call(row) === '[object Array]') {
                    array.push(this.debugCode_GetPokeConfig(row));
                }
            }
        }
        return array;
    }

    public static componentByName(name: string) {
        let type: string;
        let location: PokePoint;
        if (PokeRuleUtil.Instance.TopFixedBox.deepContains(name)
            || PokeRuleUtil.Instance.CenterFixedBox.deepContains(name)
            || PokeRuleUtil.Instance.GearsBox.deepContains(name)) {
            type = 'FixedBox';
        } else if (PokeRuleUtil.Instance.pokeQueue.deepContains(name)) {
            type = 'Poke';
        } else {
            console.log(`%c名称为: ${name} 的控件未找到.`, 'color:#2cbdffb0; font-size:12px;');
            return;
        }
        const component: Box = SceneUtil.getComponentByName(name);
        console.log('%c======================详情 - start ==========================', 'color:#e1ddd8; font-size:12px;');
        console.log(`%c对象类型：${type}`, 'color:#2cbdffb0; font-size:12px;');
        console.log(`%c名称：${component.name}`, 'color:#2cbdffb0; font-size:12px;');
        console.log(`%c是否是固定扑克牌：${component instanceof FixedBox ? '是' : '不是'}`, 'color:#2cbdffb0; font-size:12px;');
        console.log(`%c所在位置：${component.name}`, 'color:#2cbdffb0; font-size:12px;');
        console.log('%c======================详情 - end  ==========================', 'color:#e1ddd8; font-size:12px;');
    }

    /**
     * 分段显示数据
     * @param start 前缀
     * @param show 显示数据集合
     */
    public static clips(start: string, ...show: any[]) {
        const font: string = 'font-size:12px;';
        const tagColor: string = 'color:#03a9f4;';
        const tagMargin: string = 'margin-left: 20px;';
        const descColor: string = 'color:#cac8c6;';
        const contextColor: string = 'color:#2cbdffb0;';
        const error: string = 'font-size:10px;color:red;';
        const contextMargin: string = 'margin-left: 20px;';
        console.log('\n')
        const date: Date = new Date();
        console.log(`%c :start %c${start}`, font + tagColor, font + tagColor)
        // console.log(`%cstart===============${start}===============start`, font + descColor);
        if (show.length === 0) console.log(`%c无输入`, error + contextMargin);
        show.forMoreEach((a, b) => {
            console.log(`%c${a} => `, font + contextColor + contextMargin, b)
        });
        // console.log(`%cend===============${start}===============end`, font + descColor);
        console.log(`%c :end %cRunTime: ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`, font + tagColor, font + descColor + tagMargin);
        console.log('\n')
    }
}