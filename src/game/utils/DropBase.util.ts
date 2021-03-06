class DropBaseUtil {

    /**
     * 创建拖拽遮罩
     */
    public static createMask(input: eui.Component, { name, color, alpha }: CreateMaskType = {}) {
        name = name || `${Date.now()}_${getRandomIntInclusive(1000, 9999)}`;
        color = color || 0xF5F5DC;
        alpha = alpha || 0.8;
        const maskNum: number = input.$children.filter(component => component instanceof egret.Shape && component.name == name).length;
        if (maskNum > 0) return;
        const square: egret.Shape = new egret.Shape();
        square.graphics.beginFill(color, alpha);
        square.graphics.drawRect(0, 0, input.width, input.height);
        square.graphics.endFill();
        square.name = name;
        input.addChild(square);
    }

    /**
     * 移除拖拽遮罩
     */
    public static removeMask(input: eui.Component, name: string) {
        // 为了防止多次创建遮罩而不被销毁
        input.$children.filter(component => component instanceof egret.Shape && component.name === name)
            .forEach(component => input.removeChild(component));
    }

    /**
     * 移动动画
     * @param func 回调函数, 默认重置锁定
     */
    public static moveTween(target: any, { x, y }, func: Function = () => DropBaseUtil.unClock()) {
        egret.Tween.get(target).to({ x, y }, SceneManagerUtil.Instance.config.moveTime, egret.Ease.sineIn)
            .call(func);
    }

    /**
     * 获取选中的组件(拖拽标记的)
     */
    public static getSelectedPokes(): Poke[] {
        // 根据名称获取组件对象
        const pokes: Poke[] = SceneUtil.getComponentByNames(this.getDropPokeName());
        return pokes;
    }

    /**
     * 记录当前拖拽扑克牌
     */
    public static recordDropPoke(groupId: string, names: string[]) {
        // SceneManagerUtil.Instance.rootLayer.stage[DropBase.TOUCH_SELECTED] = { groupId, componentName: names };
        LocationState.moveQueue = names;
        LocationState.moveGroupId = groupId;
    }

    /**
     * 移除当前拖拽扑克牌
     */
    public static deleteDropPoke() {
        // SceneManagerUtil.Instance.rootLayer.stage[DropBase.TOUCH_SELECTED] = { groupId: null, componentName: [] };
        LocationState.moveGroupId = null;
        LocationState.moveQueue = [];
    }

    /**
     * 获取存储的扑克牌对象
     */
    public static getDropPokeName(): string[] {
        // const config: TouchSelected = SceneManagerUtil.Instance.rootLayer.stage[DropBase.TOUCH_SELECTED] || {};
        // return config.componentName || [];
        return LocationState.moveQueue;
    }

    /**
     * 获取存储的拖拽对象
     */
    public static getDropPoke(): TouchSelected {
        // return SceneManagerUtil.Instance.rootLayer.stage[DropBase.TOUCH_SELECTED] || { groupId: null, componentName: [] };
        return {
            groupId: LocationState.moveGroupId,
            componentName: LocationState.moveQueue
        }
    }

    public static selectPokesHandle<T>(callbackfn: (param: T, index: number) => any) {
        // 获取当前扑克牌中的全部队列
        const pokeNames: string[] = this.getDropPokeName() || [];
        pokeNames.forEach((name, index) => callbackfn(SceneUtil.getComponentByName(name), index));
    }

    /**
     * onTouchEnd处理事件
     * @param canMove 是否可重定位移动 {true: 是, false: 不可移动}
     */
    public static onTouchEndHandle(canMove: boolean) {
        // ================================================
        // 为了避免抬起时是在扑克牌上，此处直接获取选中扑克牌信息
        const selectNames: string[] = DropBaseUtil.getDropPokeName();
        if (selectNames.length > 0) {
            // ================================================
            // 扑克牌队列中获取扑克牌对象
            const queue: string[] = SceneUtil.getSelectPokeQueue(selectNames[0]);
            // 判断两个对象是否相等， 不相等则撤回记录到原始位置
            if (!selectNames.isEquals(queue)) {
                canMove = false;
            }
            // 重置扑克牌位置
            this.rollback(canMove);
            if (canMove) {
                PokeRuleUtil.Instance.handleMarge();
            }
        }
        // 移除扑克牌提示遮罩
        LocationState.tipQueue.forEach(name => {
            const poke: Poke = SceneUtil.getComponentByName(name);
            if (poke) DropBaseUtil.removeMask(poke, 'TIP_POKE');
        })
        // 重置扑克牌记录
        LocationState.reset();
    }

    /**
     * 重置扑克牌位置
     * @param canMove 是否可重定位移动 {true: 是, false: 不可移动}
     */
    public static rollback(canMove: boolean) {
        // 获取所有拖拽的扑克
        this.selectPokesHandle<Poke>(poke => {
            // 移除遮罩
            this.removeMask(poke, DropBase.MASK_OF_POKE);
            if (!canMove) {
                // 重置回到上一次的位置(重新计算，防止偏移)
                DropBaseUtil.moveTween(poke, PokeRuleUtil.Instance.reckonPointByNameOrComponent(poke));
            }
        })
    }

    /**
     * 获取全部碰撞检测点对应的扑克牌对象
     * @param poke 当前操作的扑克
     */
    public static getCollisionChecks(poke: Poke): Box[] {
        // 获取全部碰撞点（强制重新获取）
        const hitPoints: PokePositions = PokeRuleUtil.Instance.getHitPoints(true);
        // 记录碰撞点对应的扑克牌对象
        const hitPokes: Box[] = [];
        // 获取当前扑克牌以及下方列表中全部扑克牌名称
        const select: string[] = SceneUtil.getSelectPokeQueue(poke.name);
        hitPoints.filter(hitPoint => !select.deepContains(hitPoint.component.name)).forEach(hitPoint => {
            const isHit: boolean = poke.hitTestPoint(hitPoint.topLeft.x, hitPoint.topLeft.y)
                || poke.hitTestPoint(hitPoint.topRight.x, hitPoint.topRight.y)
                || poke.hitTestPoint(hitPoint.bottomLeft.x, hitPoint.bottomLeft.y)
                || poke.hitTestPoint(hitPoint.bottomRight.x, hitPoint.bottomRight.y);
            if (isHit) hitPokes.push(hitPoint.component);
        });
        return hitPokes;
    }

    /**
    * 获取碰撞检测对应的扑克牌对象，如果同时碰撞多个，则返回碰撞面积大的碰撞点
    * @param poke 当前操作的扑克
    */
    public static getCollisionCheck(poke: Poke): Box {
        // 获取全部碰撞扑克牌
        const collision: Box[] = DropBaseUtil.getCollisionChecks(poke);
        // TODO: 是否需要做判断操作 还是只是获取第一个
        if (collision.length === 1) {
            return collision[0];
        }
    }

    /**
     * 验证是否是当前扑克牌对象
     * @param poke 扑克牌对象
     * @returns { true: 是, false: 不是 }
     */
    public static isDropNow(poke: Poke): boolean {
        if (!poke) return false;
        // 获取存储的扑克牌对象
        const select: string[] = this.getDropPokeName();
        if (!select) return false;
        return select.deepContains(poke.name);
    }

    /**
     * 锁定拖拽（控制移动时全局只可同时移动一个）
     * (true: 锁定, false: 非锁定)
     */
    public static clock() {
        // SceneManagerUtil.Instance.rootLayer.stage['clock'] = true;
        LocationState.clock = true;
    }

    /**
     * 解锁拖拽
     */
    public static unClock() {
        // SceneManagerUtil.Instance.rootLayer.stage['clock'] = false;
        LocationState.clock = false;
    }

    /**
     * 获取拖拽锁定状态
     * @returns true: 锁定, false: 非锁定
     */
    public static isClock(): boolean {
        return LocationState.clock;
    }
}