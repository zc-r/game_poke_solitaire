// 固定扑克牌类型 BOX: 可放置  MODE：不可放置
type FixedType = 'BOX' | 'MODE';

interface PokeConfig {
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    skinName?: string,
    // 非组件原有属性，为了不污染本身属性，使用此属性进行过滤
    off?: {
        // 是否是固定位置
        fixed: {
            // 是否是固定位置
            is: boolean,
            type: FixedType
        },
        imageConfig?: ImageConfig,
        // 是否开启拖拽，[false: 关闭拖拽，true: 启动拖拽]
        openDrop?: boolean,
        // 扑克牌 三属性
        type?: string,
        figure?: string,
        name?: string,
        // 是否开启吸附功能
        openAdsorb?: boolean,
        // 扑克牌生成的布局结构中，当前扑克牌所对应的下标，从零开始
        point?: {
            // 第几列（对应结构中最外层）
            col: number,
            // 第几行（对应机构中第二层）
            row: number
        }
    }
}

interface ImageConfig {
    source?: string
}

class PokeRandomUtil {

    // url常量地址
    static readonly POKE_PATH_PREFIX: string = `resource/assets/Poke/pk_`;
    static readonly POKE_PATH_SUFFIX: string = `.jpg`;
    // 扑克类型
    static readonly PokeType: string[] = ['a', 'b', 'c', 'd'];

    // 每类牌数最大数
    static readonly MAX_TYPE_NUM: number = 13;
    // 每张牌上下间距
    static readonly MARGIN_TOP: number = 30;
    // 列个数
    static readonly _colNum: number = 8;
    // 缝隙宽度
    protected static _space: number = 0;
    // 顶部间距
    static readonly _margin_top: number = 20;

    /**
     * 获取扑克🎴布局
     * 布局结构 [ [Poke, Poke, ...], [Poke, Poke, ...], [Poke, Poke, ...], ... ]
     */
    public static creator(input: Poke[]): Poke[][] {
        // 声明扑克牌生成池对象
        const creator: PokeRandomCreator = new PokeRandomCreator();
        const length: number = input.length;
        // 返回的数据体
        const result: Poke[][] = [];
        for (let i = 0;
            i < PokeRandomUtil.MAX_TYPE_NUM * PokeRandomUtil.PokeType.length;
            i++) {
            // i % length 结果是下标，可以直接获取`input`的值
            const index: number = i % length;
            // 获取每一列的列表
            result[index] = result[index] || [];
            // [注：得到的是每一个分组后对应组的数据个数下标， 同：result[index].length]
            // 也可以直接使用 row = result[index].length;
            const row: number = Math.floor(i / length);
            // 获取随机扑克牌对象
            const pokeInfoCreator: PokeInfoCreator = creator.poke;
            const poke = new Poke({
                x: input[index].x,
                y: input[index].y + row * this.MARGIN_TOP,
                skinName: 'resource/eui_skins/games/PokeComponentSkin.exml',
                off: {
                    // 默认打开扑克牌的拖拽功能
                    openDrop: true,
                    // 默认开启可吸附
                    openAdsorb: true,
                    imageConfig: { source: `resource/assets/Poke/${pokeInfoCreator.name}.jpg` },
                    type: pokeInfoCreator.type,
                    figure: pokeInfoCreator.figure,
                    name: pokeInfoCreator.name,
                    point: { col: index, row },
                    fixed: { is: false, type: null }
                }
            });
            // 在每一次像已存在数组中添加新的`poke`对象时，将上一个`poke`的拖拽设置为关闭，同时吸附设置为关闭
            // 生成数据结构为每一组集合中的最后一个为可拖拽和可吸附模式
            // 后续在每次拖走一个时，将当前变更集合中最后一个设置为启动
            if (result[index].length > 0) {
                // 获取序列中最后一个对象
                const pk: Poke = result[index][result[index].length - 1];
                pk.config.off.openAdsorb = false;
                pk.config.off.openDrop = false;

            }
            result[index].push(poke);
        }
        return result;
    }

    /**
     * 计算四个点坐标
     */
    public static computeCapePoint(poke: Poke): PokePosition {
        const { x, y }: Poke = poke;
        return {
            poke,
            topLeft: new egret.Point(x, y),
            topRight: new egret.Point(x + GameMainScene._pokeWidth, y),
            bottomLeft: new egret.Point(x, y + GameMainScene._pokeHeight),
            bottomRight: new egret.Point(x + GameMainScene._pokeWidth, y + GameMainScene._pokeHeight)
        };
    }

    /**
     * 根据参照的扑克牌对象，计算放在其下面的扑克牌对象位置
     * @param poke 参照的扑克牌对象
     */
    public static computeNextPokePoint(poke: Poke): egret.Point {
        // 判断是否是固定位置的对象，如果是，不做偏移
        const marginTop: number = poke.config.off.fixed.is ? 0 : this.MARGIN_TOP;
        return new egret.Point(
            poke.x, poke.y + marginTop
        )
    }
}

// 随机数： https://blog.csdn.net/xutongbao/article/details/89098939
const getRandomIntInclusive = (min: number, max: number, ignore: number[] = []): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    // 含最大值，含最小值
    let resultNum: number = Math.floor(Math.random() * (max - min + 1)) + min;
    if (ignore && ignore.length > 0 && ignore.indexOf(resultNum) > -1) {
        return getRandomIntInclusive(min, max, ignore);
    }
    return resultNum;
}

/**
 * 随机数： https://blog.csdn.net/xutongbao/article/details/89098939
 * @param min 最小值范围
 * @param max 最大值范围
 * @param handle 处理函数（返回true视为通过，不进行retry）
 */
const getRandomIntInclusiveWithFun = (min: number, max: number, handle: Function): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    // 含最大值，含最小值
    let resultNum: number = Math.floor(Math.random() * (max - min + 1)) + min;
    if (handle && !handle(resultNum)) {
        return getRandomIntInclusiveWithFun(min, max, handle);
    }
    return resultNum;
}