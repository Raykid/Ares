const THRESHOLD_DRAGGING:number = 3;
const ELASTICITY_COEFFICIENT:number = 1;
const FRICTION_COEFFICIENT:number = 0.01;

interface Shifting
{
    x:number;
    y:number;
    distance:number;
}

function shifting(to:PIXI.Point, from:PIXI.Point):Shifting
{
    var x:number = to.x - from.x;
    var y:number = to.y - from.y;
    return {
        x: x,
        y: y,
        distance: Math.sqrt(x * x + y * y)
    };
}

export interface ViewPortHandlerOptions
{
    oneway?:boolean;
    lockH?:boolean;
    lockV?:boolean;
    damping?:boolean;
}

export interface ViewPortObserver
{
    (handler?:ViewPortHandler):void;
}

export class ViewPortHandler
{
    private static DIRECTION_H:number = 1;
    private static DIRECTION_V:number = 2;

    private _target:PIXI.DisplayObject;
    private _viewPort:PIXI.Rectangle;
    private _viewPortGlobal:PIXI.Rectangle;
    private _ticker:PIXI.ticker.Ticker;
    private _masker:PIXI.Graphics;
    private _options:ViewPortHandlerOptions;

    private _movableH:boolean = false;
    private _movableV:boolean = false;
    private _downTarget:PIXI.DisplayObject;
    private _downPoint:PIXI.Point;
    private _lastPoint:PIXI.Point;
    private _lastTime:number;
    private _speed:PIXI.Point;
    private _dragging:boolean = false;
    private _direction:number = 0;

    private _observers:ViewPortObserver[] = [];

    private _onPointerUp:(evt:Event)=>void;

    /** 获取全局视窗范围 */
    public get viewportGlobal():PIXI.Rectangle
    {
        return this._viewPortGlobal;
    }

    public constructor(target:PIXI.DisplayObject, options?:ViewPortHandlerOptions)
    {
        this._target = target;
        this._options = options || {};
        this._viewPort = new PIXI.Rectangle();
        this._ticker = new PIXI.ticker.Ticker();
        this._ticker.add(this.onTick, this);
        this._speed = new PIXI.Point();
        // 生成一个遮罩物体
        this._masker = new PIXI.Graphics();
        target.mask = this._masker;
        // 添加监听
        target.interactive = true;
        target.on("pointerdown", this.onPointerDown, this);
        target.on("pointermove", this.onPointerMove, this);
        // 记录绑定this的引用
        this._onPointerUp = this.onPointerUp.bind(this);
    }
    
    private onPointerDown(evt:PIXI.interaction.InteractionEvent):void
    {
        if(!this._downTarget)
        {
            // 初始化状态
            this._downTarget = evt.target;
            this._dragging = false;
            this._direction = 0;
            this._speed.set(0, 0);
            // 设置移动性
            this._movableH = !this._options.lockV && (this._target["width"] || 0) > this._viewPort.width;
            this._movableV = !this._options.lockH && (this._target["height"] || 0) > this._viewPort.height;
            // 记录最后点位置
            this._downPoint = this._lastPoint = evt.data.global.clone();
            // 记录最后时刻
            this._lastTime = Date.now();
            // 对目标对象实施抬起监听
            this._downTarget.on("mouseup", this.onTargetPointerUp, this);
            this._downTarget.on("mouseupoutside", this.onTargetPointerUp, this);
            this._downTarget.on("pointerup", this.onTargetPointerUp, this);
            this._downTarget.on("pointerupoutside", this.onTargetPointerUp, this);
            window.addEventListener("mouseup", this._onPointerUp, true);
            window.addEventListener("touchend", this._onPointerUp, true);
        }
    }
    
    private onPointerMove(evt:PIXI.interaction.InteractionEvent):void
    {
        if(this._downTarget)
        {
            // 计算位移
            var nowPoint:PIXI.Point = evt.data.global.clone();
            var s:Shifting = shifting(nowPoint, this._lastPoint);
            // 如果移动距离超过THRESHOLD_DRAGGING像素则认为是移动了
            if(!this._dragging && shifting(nowPoint, this._downPoint).distance > THRESHOLD_DRAGGING)
            {
                this._dragging = true;
            }
            // 判断移动方向
            if(this._direction == 0 && s.distance > 0)
            {
                if(this._options && this._options.oneway)
                {
                    if(!this._movableV || (this._movableH && Math.abs(s.x) > Math.abs(s.y))) this._direction = ViewPortHandler.DIRECTION_H;
                    else this._direction = ViewPortHandler.DIRECTION_V;
                }
                else
                {
                    this._direction = ViewPortHandler.DIRECTION_H | ViewPortHandler.DIRECTION_V;
                }
            }
            var dirH:boolean = (this._direction & ViewPortHandler.DIRECTION_H) > 0;
            var dirV:boolean = (this._direction & ViewPortHandler.DIRECTION_V) > 0;
            // 移动物体
            var sx:number = 0, sy:number = 0;
            if(dirH) sx = s.x;
            if(dirV) sy = s.y;
            this.moveTarget(sx, sy);
            // 记录本次坐标
            this._lastPoint = nowPoint;
            // 计算运动速度
            var nowTime:number = Date.now();
            var deltaTime:number = nowTime - this._lastTime;
            this._speed.set(
                dirH && this._movableH ? s.x / deltaTime * 5 : 0,
                dirV && this._movableV ? s.y / deltaTime * 5 : 0
            );
            // 记录最后时刻
            this._lastTime = nowTime;
        }
    }

    private onTargetPointerUp(evt:PIXI.interaction.InteractionEvent):void
    {
        if(this._downTarget)
        {
            // 移除抬起监听
            this._downTarget.off("mouseup", this.onTargetPointerUp, this);
            this._downTarget.off("mouseupoutside", this.onTargetPointerUp, this);
            this._downTarget.off("pointerup", this.onTargetPointerUp, this);
            this._downTarget.off("pointerupoutside", this.onTargetPointerUp, this);
            // 如果按下时有移动，则禁止抬起事件继续向下传递
            if(this._dragging) evt.stopPropagation();
        }
    }
    
    private onPointerUp(evt:Event):void
    {
        if(this._downTarget)
        {
            // 移除抬起监听
            window.removeEventListener("mouseup", this._onPointerUp, true);
            window.removeEventListener("touchend", this._onPointerUp, true);
            // 如果按下时有移动，则禁止抬起事件继续向下传递
            if(this._dragging) evt.stopPropagation();
            // 重置状态
            this._downTarget = null;
            this._dragging = false;
            // 开始缓动
            this.homing(true);
        }
    }

    private getContentBounds(targetX:number, targetY:number):PIXI.Rectangle
    {
        var bounds:PIXI.Rectangle = this._target.getLocalBounds();
        bounds.x += targetX;
        bounds.y += targetY;
        return bounds;
    }

    private getDelta(targetX:number, targetY:number):{x:number, y:number}
    {
        var bounds:PIXI.Rectangle = this.getContentBounds(targetX, targetY);
        // 计算横向偏移
        var deltaX:number = 0;
        if(bounds.left > this._viewPort.left)
            deltaX = this._viewPort.left - bounds.left;
        else if(bounds.left < this._viewPort.left && bounds.right < this._viewPort.right)
            deltaX = Math.min(this._viewPort.left - bounds.left, this._viewPort.right - bounds.right);
        // 计算纵向偏移
        var deltaY:number = 0;
        if(bounds.top > this._viewPort.top)
            deltaY = this._viewPort.top - bounds.top;
        else if(bounds.top < this._viewPort.top && bounds.bottom < this._viewPort.bottom)
            deltaY = Math.min(this._viewPort.top - bounds.top, this._viewPort.bottom - bounds.bottom);
        // 返回结果
        return {x: deltaX, y: deltaY};
    }

    private moveTarget(x:number, y:number):void
    {
        if(this._movableH || this._movableV)
        {
            // 停止归位缓动
            this._ticker.stop();
            // 如果超过范围则需要进行阻尼递减
            var d:{x:number, y:number} = this.getDelta(this._target.x, this._target.y);
            // 开始移动
            var pos:PIXI.Point = this._target.position;
            if(this._movableH) pos.x += (d.x != 0 ? x * 0.33 / ELASTICITY_COEFFICIENT : x);
            if(this._movableV) pos.y += (d.y != 0 ? y * 0.33 / ELASTICITY_COEFFICIENT : y);
            // 更新位置
            this._target.position = pos;
            // 通知观察者
            this.notify();
        }
    }

    private onTick(delta:number):void
    {
        // 进行合法性判断
        if(this._target["_destroyed"])
        {
            this._ticker.stop();
            this._direction = 0;
            return;
        }
        // 如果已经超出范围则直接复位，否则继续运动
        var d:{x:number, y:number} = this.getDelta(this._target.x, this._target.y);
        var doneX:boolean = false;
        var doneY:boolean = false;
        // 横向
        if(d.x != 0)
        {
            if(!this._options.damping)
            {
                // 不进行阻尼复位，瞬移复位
                this._target.x += d.x;
                this._speed.x = 0;
                doneX = true;
            }
            else if(this._speed.x != 0)
            {
                // 超出范围减速中
                this._target.x += this._speed.x * delta;
                var speedX:number = this._speed.x + d.x * ELASTICITY_COEFFICIENT * 0.01 * delta;
                // 如果速度反向了，则说明到头了，直接设为0
                this._speed.x = (speedX * this._speed.x < 0 ? 0 : speedX);
            }
            else
            {
                // 开始横向复位
                var moveX:number = d.x * delta * 0.07 * ELASTICITY_COEFFICIENT;
                if(moveX != 0) this._target.x += moveX;
            }
        }
        else if(!!this._options.damping)
        {
            if(this._speed.x != 0)
            {
                // 未超范围，阻尼减速
                this._target.x += this._speed.x * delta;
                this._speed.x = this._speed.x * (1 - FRICTION_COEFFICIENT);
                if(Math.abs(this._speed.x) < 0.5) this._speed.x = 0;
            }
            else
            {
                doneX = true;
            }
        }
        else
        {
            this._speed.x = 0;
            doneX = true;
        }
        // 纵向
        if(d.y != 0)
        {
            if(!this._options.damping)
            {
                // 不进行阻尼复位，瞬移复位
                this._target.y += d.y;
                this._speed.y = 0;
                doneY = true;
            }
            else if(this._speed.y != 0)
            {
                // 超出范围减速中
                this._target.y += this._speed.y * delta;
                var speedY:number = this._speed.y + d.y * ELASTICITY_COEFFICIENT * 0.01 * delta;
                // 如果速度反向了，则说明到头了，直接设为0
                this._speed.y = (speedY * this._speed.y < 0 ? 0 : speedY);
            }
            else
            {
                // 开始纵向复位
                var moveY:number = d.y * delta * 0.07 * ELASTICITY_COEFFICIENT;
                if(moveY != 0) this._target.y += moveY;
            }
        }
        else if(!!this._options.damping)
        {
            if(this._speed.y != 0)
            {
                // 未超范围，阻尼减速
                this._target.y += this._speed.y * delta;
                this._speed.y = this._speed.y * (1 - FRICTION_COEFFICIENT);
                if(Math.abs(this._speed.y) < 0.5) this._speed.y = 0;
            }
            else
            {
                doneY = true;
            }
        }
        else
        {
            this._speed.y = 0;
            doneY = true;
        }
        // 通知观察者
        this.notify();
        // 停止tick
        if(doneX && doneY)
        {
            this._ticker.stop();
            // 重置方向
            this._direction = 0;
        }
    }

    /**
     * 获取全局范围
     * @return 全局范围
     */
    private getGlocalBounds():PIXI.Rectangle
    {
        var pos:PIXI.Point = this._target.parent.getGlobalPosition();
        var bounds:PIXI.Rectangle = this._viewPort.clone();
        bounds.x += (pos.x - this._target.x);
        bounds.y += (pos.y - this._target.y);
        return bounds;
    }

    private notify():void
    {
        // 这里通知所有观察者位置变更
        for(var i:number = 0, len:number = this._observers.length; i < len; i++)
        {
            var observer:ViewPortObserver = this._observers[i];
            if(observer) observer(this);
        }
    }

    /**
     * 观察移动
     * @param observer 观察者
     */
    public observe(observer:ViewPortObserver):void
    {
        if(this._observers.indexOf(observer) < 0)
            this._observers.push(observer);
    }

    /**
     * 停止观察移动
     * @param observer 观察者
     */
    public unobserve(observer:ViewPortObserver):void
    {
        var index:number = this._observers.indexOf(observer);
        if(index >= 0) this._observers.splice(index, 1);
    }

    /**
     * 设置视点范围
     * @param x 视点横坐标
     * @param y 视点纵坐标
     * @param width 视点宽度
     * @param height 视点高度
     */
    public setViewPort(x:number, y:number, width:number, height:number):void
    {
        this._viewPort.x = x;
        this._viewPort.y = y;
        this._viewPort.width = width;
        this._viewPort.height = height;
        this._viewPortGlobal = this.getGlocalBounds();
        // 如果masker的父容器不是当前target的父容器则将masker移动过去
        if(this._masker.parent != this._target.parent && this._target.parent)
        {
            this._target.parent.addChild(this._masker);
        }
        // 绘制遮罩
        this._masker.clear();
        this._masker.beginFill(0);
        this._masker.drawRect(x, y, width, height);
        this._masker.endFill();
        // 瞬移归位
        this.homing(false);
        // 为当前显示对象设置viewport范围
        this._target["__ares_viewport__"] = this;
        // 通知观察者
        this.notify();
    }

    /**
     * 归位内容
     * @param tween 是否使用缓动归位，默认使用
     */
    public homing(tween:boolean):void
    {
        if(tween)
        {
            this._ticker.start();
        }
        else
        {
            var d:{x:number, y:number} = this.getDelta(this._target.x, this._target.y);
            this._target.x += d.x;
            this._target.y += d.y;
        }
    }
}