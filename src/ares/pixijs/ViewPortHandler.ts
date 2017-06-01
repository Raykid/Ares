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
}

export class ViewPortHandler
{
    private static DIRECTION_H:number = 1;
    private static DIRECTION_V:number = 2;

    private _target:PIXI.DisplayObject;
    private _viewPort:PIXI.Rectangle;
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

    public constructor(target:PIXI.DisplayObject, options:ViewPortHandlerOptions)
    {
        this._target = target;
        this._options = options;
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
        target.on("pointerup", this.onPointerUp, this);
        target.on("pointerupoutside", this.onPointerUp, this);
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
            this._movableH = (this._target["width"] || 0) > this._viewPort.width;
            this._movableV = (this._target["height"] || 0) > this._viewPort.height;
            // 记录最后点位置
            this._downPoint = this._lastPoint = evt.data.global.clone();
            // 记录最后时刻
            this._lastTime = Date.now();
            // 对目标对象实施抬起监听
            this._downTarget.on("mouseup", this.onPointerUp, this);
            this._downTarget.on("mouseupoutside", this.onPointerUp, this);
            this._downTarget.on("pointerup", this.onPointerUp, this);
            this._downTarget.on("pointerupoutside", this.onPointerUp, this);
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
                    if(Math.abs(s.x) > Math.abs(s.y)) this._direction = ViewPortHandler.DIRECTION_H;
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
    
    private onPointerUp(evt:PIXI.interaction.InteractionEvent):void
    {
        if(this._downTarget)
        {
            // 移除抬起监听
            this._downTarget.off("mouseup", this.onPointerUp, this);
            this._downTarget.off("mouseupoutside", this.onPointerUp, this);
            this._downTarget.off("pointerup", this.onPointerUp, this);
            this._downTarget.off("pointerupoutside", this.onPointerUp, this);
            // 如果按下时有移动，则禁止抬起事件继续向下传递
            if(this._dragging) evt.stopPropagation();
            // 重置状态
            this._downTarget = null;
            this._dragging = false;
            // 开始缓动
            this._ticker.start();
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
        if(bounds.right < this._viewPort.right) deltaX = this._viewPort.right - bounds.right;
        else if(bounds.left > this._viewPort.left) deltaX = this._viewPort.left - bounds.left;
        // 计算纵向偏移
        var deltaY:number = 0;
        if(bounds.bottom < this._viewPort.bottom) deltaY = this._viewPort.bottom - bounds.bottom;
        else if(bounds.top > this._viewPort.top) deltaY = this._viewPort.top - bounds.top;
        // 返回结果
        return {x: Math.round(deltaX), y: Math.round(deltaY)};
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
            this._target.position = pos;
        }
    }

    private onTick(delta:number):void
    {
        // 如果已经超出范围则直接复位，否则继续运动
        var d:{x:number, y:number} = this.getDelta(this._target.x, this._target.y);
        var doneX:boolean = false;
        var doneY:boolean = false;
        // 横向
        if(d.x != 0)
        {
            if(this._speed.x != 0)
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
        else
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
        // 纵向
        if(d.y != 0)
        {
            if(this._speed.y != 0)
            {
                // 超出范围减速中
                this._target.y += this._speed.y * delta;
                var speedY:number = this._speed.y + d.y * ELASTICITY_COEFFICIENT * 0.01 * delta;
                // 如果速度反向了，则说明到头了，直接设为0
                this._speed.y = (speedY * this._speed.y < 0 ? 0 : speedY);
            }
            else
            {
                // 开始横向复位
                var moveY:number = d.y * delta * 0.07 * ELASTICITY_COEFFICIENT;
                if(moveY != 0) this._target.y += moveY;
            }
        }
        else
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
        // 停止tick
        if(doneX && doneY)
        {
            this._ticker.stop();
            // 重置方向
            this._direction = 0;
        }
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
        // 归位
        this._ticker.start();
    }
}