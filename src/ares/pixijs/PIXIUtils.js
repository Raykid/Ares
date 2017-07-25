"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Ares_1 = require("../Ares");
/**
 * Created by Raykid on 2017/7/20.
 */
var PIXIUtils = (function () {
    function PIXIUtils() {
    }
    /**
     * 租赁一个显示对象，如果对象池中有可用对象则返回该对象，否则创建一个新的
     * @param oriTarget 原始显示对象
     * @return 被租赁的对象
     */
    PIXIUtils.borrowObject = function (oriTarget) {
        // 如果是空，则原样返回
        if (oriTarget == null)
            return oriTarget;
        // 如果不是显示对象，则直接复制
        if (!(oriTarget instanceof PIXI.DisplayObject))
            return PIXIUtils.cloneObject(oriTarget, true);
        // 如果是显示对象，则放到对象池里
        var key = oriTarget.constructor.toString();
        var pool = PIXIUtils._objectPool[key];
        if (pool == null)
            PIXIUtils._objectPool[key] = pool = [];
        var target = null;
        while (!target) {
            if (pool.length > 0) {
                // 用shift以保证不会产生过于陈旧的对象
                target = pool.shift();
                // 如果已经销毁则继续生成
                if (target["_destroyed"])
                    continue;
                // 属性恢复
                restoreProp(oriTarget, target);
            }
            else {
                target = PIXIUtils.cloneObject(oriTarget, true);
            }
        }
        return target;
        function restoreProp(oriTarget, curTarget) {
            // 遍历当前节点，恢复所有Ares属性
            for (var propName in oriTarget) {
                if (Ares_1.defaultCmdRegExp.test(propName))
                    curTarget[propName] = oriTarget[propName];
            }
            // 恢复常用显示属性
            for (var i in PIXIUtils._commonDisplayProps) {
                var propName = PIXIUtils._commonDisplayProps[i];
                curTarget[propName] = oriTarget[propName];
            }
            // 递归子节点
            if (oriTarget instanceof PIXI.Container) {
                for (var i in oriTarget["children"]) {
                    restoreProp(oriTarget["children"][i], curTarget["children"][i]);
                }
            }
        }
    };
    /**
     * 归还被租赁的显示对象到对象池里
     * @param target 被归还的显示对象
     */
    PIXIUtils.returnObject = function (target) {
        if (target instanceof PIXI.DisplayObject) {
            // 清除所有事件监听
            target.removeAllListeners();
            // 如果没有移除显示，则移除之
            if (target.parent)
                target.parent.removeChild(target);
            // 执行回收
            var key = target.constructor.toString();
            var pool = PIXIUtils._objectPool[key];
            if (pool == null)
                PIXIUtils._objectPool[key] = pool = [];
            pool.push(target);
        }
    };
    /**
     * 求两个矩形的相交矩形，并将结果放到第一个矩形中
     * @param rect1 第一个矩形
     * @param rect2 第二个矩形
     * @return {PIXI.Rectangle} 相交后的矩形
     */
    PIXIUtils.rectCross = function (rect1, rect2) {
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
    };
    /**
     * 赋值pixi对象（包括显示对象）
     * @param target 原始对象
     * @param deep 是否深度复制（复制子对象）
     * @return 复制对象
     */
    PIXIUtils.cloneObject = function (target, deep) {
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
                result["_events"] = PIXIUtils.cloneObject(target["_events"], false);
                // 如果target的某个监听里的context就是target本身，则将result的context改为result本身
                for (var k in target["_events"]) {
                    var temp = target["_events"][k];
                    result["_events"][k] = PIXIUtils.cloneObject(temp, false);
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
                    var child = PIXIUtils.cloneObject(children[j], true);
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
                var value = PIXIUtils.cloneObject(oriValue, true);
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
    };
    /**
     * 获取当前显示对象所属的ViewPort数据
     * @param target 当前显示对象
     * @return {ViewPortData|null} 当前显示对象所属ViewPort数据，如果没有设定范围则返回null
     */
    PIXIUtils.getViewportData = function (target) {
        for (; target; target = target.parent) {
            var temp = target["__ares_viewport__"];
            if (temp)
                return temp;
        }
        return null;
    };
    PIXIUtils._objectPool = {};
    PIXIUtils._commonDisplayProps = ["position", "scale", "pivot", "skew", "rotation", "mask", "filters"];
    return PIXIUtils;
}());
exports.PIXIUtils = PIXIUtils;
//# sourceMappingURL=PIXIUtils.js.map