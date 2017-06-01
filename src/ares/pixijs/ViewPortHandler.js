"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var THRESHOLD_DRAGGING = 3;
var ELASTICITY_COEFFICIENT = 1;
var FRICTION_COEFFICIENT = 0.01;
function shifting(to, from) {
    var x = to.x - from.x;
    var y = to.y - from.y;
    return {
        x: x,
        y: y,
        distance: Math.sqrt(x * x + y * y)
    };
}
var ViewPortHandler = (function () {
    function ViewPortHandler(target, options) {
        this._movableH = false;
        this._movableV = false;
        this._dragging = false;
        this._direction = 0;
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
    ViewPortHandler.prototype.onPointerDown = function (evt) {
        if (!this._downTarget) {
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
    };
    ViewPortHandler.prototype.onPointerMove = function (evt) {
        if (this._downTarget) {
            // 计算位移
            var nowPoint = evt.data.global.clone();
            var s = shifting(nowPoint, this._lastPoint);
            // 如果移动距离超过THRESHOLD_DRAGGING像素则认为是移动了
            if (!this._dragging && shifting(nowPoint, this._downPoint).distance > THRESHOLD_DRAGGING) {
                this._dragging = true;
            }
            // 判断移动方向
            if (this._direction == 0 && s.distance > 0) {
                if (this._options && this._options.oneway) {
                    if (Math.abs(s.x) > Math.abs(s.y))
                        this._direction = ViewPortHandler.DIRECTION_H;
                    else
                        this._direction = ViewPortHandler.DIRECTION_V;
                }
                else {
                    this._direction = ViewPortHandler.DIRECTION_H | ViewPortHandler.DIRECTION_V;
                }
            }
            var dirH = (this._direction & ViewPortHandler.DIRECTION_H) > 0;
            var dirV = (this._direction & ViewPortHandler.DIRECTION_V) > 0;
            // 移动物体
            var sx = 0, sy = 0;
            if (dirH)
                sx = s.x;
            if (dirV)
                sy = s.y;
            this.moveTarget(sx, sy);
            // 记录本次坐标
            this._lastPoint = nowPoint;
            // 计算运动速度
            var nowTime = Date.now();
            var deltaTime = nowTime - this._lastTime;
            this._speed.set(dirH && this._movableH ? s.x / deltaTime * 5 : 0, dirV && this._movableV ? s.y / deltaTime * 5 : 0);
            // 记录最后时刻
            this._lastTime = nowTime;
        }
    };
    ViewPortHandler.prototype.onPointerUp = function (evt) {
        if (this._downTarget) {
            // 移除抬起监听
            this._downTarget.off("mouseup", this.onPointerUp, this);
            this._downTarget.off("mouseupoutside", this.onPointerUp, this);
            this._downTarget.off("pointerup", this.onPointerUp, this);
            this._downTarget.off("pointerupoutside", this.onPointerUp, this);
            // 如果按下时有移动，则禁止抬起事件继续向下传递
            if (this._dragging)
                evt.stopPropagation();
            // 重置状态
            this._downTarget = null;
            this._dragging = false;
            // 开始缓动
            this._ticker.start();
        }
    };
    ViewPortHandler.prototype.getContentBounds = function (targetX, targetY) {
        var bounds = this._target.getLocalBounds();
        bounds.x += targetX;
        bounds.y += targetY;
        return bounds;
    };
    ViewPortHandler.prototype.getDelta = function (targetX, targetY) {
        var bounds = this.getContentBounds(targetX, targetY);
        // 计算横向偏移
        var deltaX = 0;
        if (bounds.right < this._viewPort.right)
            deltaX = this._viewPort.right - bounds.right;
        else if (bounds.left > this._viewPort.left)
            deltaX = this._viewPort.left - bounds.left;
        // 计算纵向偏移
        var deltaY = 0;
        if (bounds.bottom < this._viewPort.bottom)
            deltaY = this._viewPort.bottom - bounds.bottom;
        else if (bounds.top > this._viewPort.top)
            deltaY = this._viewPort.top - bounds.top;
        // 返回结果
        return { x: Math.round(deltaX), y: Math.round(deltaY) };
    };
    ViewPortHandler.prototype.moveTarget = function (x, y) {
        if (this._movableH || this._movableV) {
            // 停止归位缓动
            this._ticker.stop();
            // 如果超过范围则需要进行阻尼递减
            var d = this.getDelta(this._target.x, this._target.y);
            // 开始移动
            var pos = this._target.position;
            if (this._movableH)
                pos.x += (d.x != 0 ? x * 0.33 / ELASTICITY_COEFFICIENT : x);
            if (this._movableV)
                pos.y += (d.y != 0 ? y * 0.33 / ELASTICITY_COEFFICIENT : y);
            this._target.position = pos;
        }
    };
    ViewPortHandler.prototype.onTick = function (delta) {
        // 如果已经超出范围则直接复位，否则继续运动
        var d = this.getDelta(this._target.x, this._target.y);
        var doneX = false;
        var doneY = false;
        // 横向
        if (d.x != 0) {
            if (this._speed.x != 0) {
                // 超出范围减速中
                this._target.x += this._speed.x * delta;
                var speedX = this._speed.x + d.x * ELASTICITY_COEFFICIENT * 0.01 * delta;
                // 如果速度反向了，则说明到头了，直接设为0
                this._speed.x = (speedX * this._speed.x < 0 ? 0 : speedX);
            }
            else {
                // 开始横向复位
                var moveX = d.x * delta * 0.07 * ELASTICITY_COEFFICIENT;
                if (moveX != 0)
                    this._target.x += moveX;
            }
        }
        else {
            if (this._speed.x != 0) {
                // 未超范围，阻尼减速
                this._target.x += this._speed.x * delta;
                this._speed.x = this._speed.x * (1 - FRICTION_COEFFICIENT);
                if (Math.abs(this._speed.x) < 0.5)
                    this._speed.x = 0;
            }
            else {
                doneX = true;
            }
        }
        // 纵向
        if (d.y != 0) {
            if (this._speed.y != 0) {
                // 超出范围减速中
                this._target.y += this._speed.y * delta;
                var speedY = this._speed.y + d.y * ELASTICITY_COEFFICIENT * 0.01 * delta;
                // 如果速度反向了，则说明到头了，直接设为0
                this._speed.y = (speedY * this._speed.y < 0 ? 0 : speedY);
            }
            else {
                // 开始横向复位
                var moveY = d.y * delta * 0.07 * ELASTICITY_COEFFICIENT;
                if (moveY != 0)
                    this._target.y += moveY;
            }
        }
        else {
            if (this._speed.y != 0) {
                // 未超范围，阻尼减速
                this._target.y += this._speed.y * delta;
                this._speed.y = this._speed.y * (1 - FRICTION_COEFFICIENT);
                if (Math.abs(this._speed.y) < 0.5)
                    this._speed.y = 0;
            }
            else {
                doneY = true;
            }
        }
        // 停止tick
        if (doneX && doneY) {
            this._ticker.stop();
            // 重置方向
            this._direction = 0;
        }
    };
    /**
     * 设置视点范围
     * @param x 视点横坐标
     * @param y 视点纵坐标
     * @param width 视点宽度
     * @param height 视点高度
     */
    ViewPortHandler.prototype.setViewPort = function (x, y, width, height) {
        this._viewPort.x = x;
        this._viewPort.y = y;
        this._viewPort.width = width;
        this._viewPort.height = height;
        // 如果masker的父容器不是当前target的父容器则将masker移动过去
        if (this._masker.parent != this._target.parent && this._target.parent) {
            this._target.parent.addChild(this._masker);
        }
        // 绘制遮罩
        this._masker.clear();
        this._masker.beginFill(0);
        this._masker.drawRect(x, y, width, height);
        this._masker.endFill();
        // 归位
        this._ticker.start();
    };
    return ViewPortHandler;
}());
ViewPortHandler.DIRECTION_H = 1;
ViewPortHandler.DIRECTION_V = 2;
exports.ViewPortHandler = ViewPortHandler;
//# sourceMappingURL=ViewPortHandler.js.map