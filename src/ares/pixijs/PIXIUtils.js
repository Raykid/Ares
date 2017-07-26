"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 求两个矩形的相交矩形，并将结果放到第一个矩形中
 * @param rect1 第一个矩形
 * @param rect2 第二个矩形
 * @return {PIXI.Rectangle} 相交后的矩形
 */
function rectCross(rect1, rect2) {
    var left = Math.max(rect1.x, rect2.x);
    var right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    var width = right - left;
    if (width < 0)
        width = 0;
    var top = Math.max(rect1.y, rect2.y);
    var bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    var height = bottom - top;
    if (height < 0)
        height = 0;
    return new PIXI.Rectangle(left, top, width, height);
}
exports.rectCross = rectCross;
/**
 * 赋值pixi对象（包括显示对象）
 * @param target 原始对象
 * @param deep 是否深度复制（复制子对象）
 * @return 复制对象
 */
function cloneObject(target, deep) {
    var result;
    // 基础类型直接返回
    if (!target || typeof target != "object")
        return target;
    // ObservablePoint类型对象需要特殊处理
    if (target instanceof PIXI.ObservablePoint) {
        return new PIXI.ObservablePoint(target["cb"], target["scope"]["__ares_cloning__"], target["x"], target["y"]);
    }
    // 如果对象有clone方法则直接调用clone方法
    if (typeof target["clone"] == "function")
        return target["clone"]();
    // 浅表复制单独处理
    if (!deep) {
        result = Object.create(target["__proto__"] || null);
        for (var k in target) {
            result[k] = target[k];
        }
        return result;
    }
    // 下面是深表复制了
    var cls = (target.constructor || Object);
    try {
        result = new cls();
    }
    catch (err) {
        return null;
    }
    // 打个标签
    target["__ares_cloning__"] = result;
    for (var key in target) {
        // 标签不复制
        if (key == "__ares_cloning__")
            continue;
        // 非属性方法不复制
        if (typeof target[key] == "function" && !target.hasOwnProperty(key))
            continue;
        // Text的_texture属性不复制
        if (key == "_texture" && target instanceof PIXI.Text)
            continue;
        // 显示对象的parent属性要特殊处理
        if (key == "parent" && target instanceof PIXI.DisplayObject) {
            if (target["parent"] && target["parent"]["__ares_cloning__"]) {
                // 如果target的parent正在被复制，则使用复制后的parent
                result["parent"] = target["parent"]["__ares_cloning__"];
            }
            else {
                // 如果target的parent没有被复制，则直接使用当前parent
                result["parent"] = target["parent"];
            }
            continue;
        }
        // EventEmitter的_events属性要进行浅表复制
        if (key == "_events" && target instanceof PIXI.utils.EventEmitter) {
            result["_events"] = cloneObject(target["_events"], false);
            // 如果target的某个监听里的context就是target本身，则将result的context改为result本身
            for (var k in target["_events"]) {
                var temp = target["_events"][k];
                result["_events"][k] = cloneObject(temp, false);
                if (temp.context == target) {
                    result["_events"][k].context = result;
                }
            }
            continue;
        }
        // 容器对象的children属性要特殊处理
        if (key == "children" && target instanceof PIXI.Container) {
            // 首先要清除已有的显示对象（例如原始对象在构造函数中添加了显示对象的话，再经过复制会产生重复对象）
            var children = result["children"];
            for (var j = 0, lenJ = children.length; j < lenJ; j++) {
                result["removeChildAt"](0).destroy();
            }
            // 开始复制子对象
            children = target["children"];
            for (var j = 0, lenJ = children.length; j < lenJ; j++) {
                var child = cloneObject(children[j], true);
                result["addChild"](child);
            }
            continue;
        }
        // Sprite的vertexData属性需要特殊处理
        if (key == "vertexData" && target instanceof PIXI.Sprite) {
            result[key] = target[key]["slice"]();
            continue;
        }
        // 通用处理
        var oriValue = target[key];
        if (oriValue && oriValue["__ares_cloning__"]) {
            // 已经复制过的对象不再复制，直接使用之
            result[key] = oriValue["__ares_cloning__"];
        }
        else {
            // 还没复制过的对象，复制之
            var value = cloneObject(oriValue, true);
            if (value != null) {
                try {
                    // 这里加try catch是为了防止给只读属性赋值时报错
                    result[key] = value;
                }
                catch (err) { }
            }
        }
    }
    // 移除标签
    delete target["__ares_cloning__"];
    return result;
}
exports.cloneObject = cloneObject;
/**
 * 获取当前显示对象所属的ViewPortHandler
 * @param target 当前显示对象
 * @return {ViewPortHandler|null} 当前显示对象所属ViewPortHandler，如果没有设定范围则返回null
 */
function getViewportHandler(target) {
    for (; target; target = target.parent) {
        var temp = target["__ares_viewport__"];
        if (temp)
            return temp;
    }
    return null;
}
exports.getViewportHandler = getViewportHandler;
//# sourceMappingURL=PIXIUtils.js.map