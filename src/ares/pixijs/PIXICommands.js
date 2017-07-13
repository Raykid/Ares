"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PIXICompiler_1 = require("./PIXICompiler");
var Utils_1 = require("../Utils");
var ViewPortHandler_1 = require("./ViewPortHandler");
/**
 * 提供给外部的可以注入自定义命令的接口
 * @param name
 * @param command
 */
function addCommand(name, command) {
    if (!exports.commands[name])
        exports.commands[name] = command;
}
exports.addCommand = addCommand;
/** 文本域命令 */
function textContent(context) {
    context.entity.createWatcher(context.target, context.cmdData.exp, context.scope, function (value) {
        var text = context.target;
        text.text = value;
    });
}
exports.textContent = textContent;
exports.commands = {
    /** 视点命令 */
    viewport: function (context) {
        var cmdData = context.cmdData;
        var target = context.target;
        var exp = "[" + cmdData.exp + "]";
        // 生成处理器
        var options = Utils_1.evalExp(cmdData.subCmd, context.scope);
        var handler = new ViewPortHandler_1.ViewPortHandler(target, options);
        // 设置监视，这里的target要优先使用$forTarget，因为在for里面的$target属性应该指向原始显示对象
        context.entity.createWatcher(context.scope.$forTarget || target, exp, context.scope, function (value) {
            var x = value[0] || 0;
            var y = value[1] || 0;
            var width = value[2] || 0;
            var height = value[3] || 0;
            // 设置视点范围
            handler.setViewPort(x, y, width, height);
        });
        return target;
    },
    /** 模板替换命令 */
    tpl: function (context) {
        var cmdData = context.cmdData;
        // 优先从本地模板库取到模板对象
        var template = context.compiler.getTemplate(cmdData.exp);
        // 本地模板库没有找到，去全局模板库里取
        if (!template)
            template = PIXICompiler_1.getTemplate(cmdData.exp);
        // 仍然没有找到，放弃
        if (!template)
            return context.target;
        // 拷贝模板
        template = cloneObject(template, true);
        // 使用模板添加到与目标相同的位置
        var target = context.target;
        var parent = target.parent;
        parent.addChildAt(template, parent.getChildIndex(target));
        // 移除并销毁目标，清理内存
        parent.removeChild(target);
        target.destroy();
        // 启动编译
        context.compiler.compile(template, context.scope);
        // 返回替换节点
        return template;
    },
    /** 修改任意属性命令 */
    prop: function (context) {
        var cmdData = context.cmdData;
        var target = context.target;
        context.entity.createWatcher(target, cmdData.exp, context.scope, function (value) {
            if (cmdData.subCmd != "") {
                // 子命令形式
                target[cmdData.subCmd] = value;
            }
            else {
                // 集成形式，遍历所有value的key，如果其表达式值为true则添加其类型
                for (var name in value) {
                    target[name] = value[name];
                }
            }
        });
        // 返回节点
        return target;
    },
    /** 绑定事件 */
    on: function (context) {
        var cmdData = context.cmdData;
        if (cmdData.subCmd != "") {
            var handler = context.scope[cmdData.exp] || window[context.cmdData.exp];
            if (typeof handler == "function") {
                // 是函数名形式
                context.target.on(cmdData.subCmd, function () {
                    handler.apply(this, arguments);
                }, context.scope);
            }
            else {
                // 是方法执行或者表达式方式
                context.target.on(cmdData.subCmd, function (evt) {
                    // 创建一个临时的子域，用于保存参数
                    var scope = Object.create(context.scope);
                    scope.$event = evt;
                    scope.$target = context.target;
                    Utils_1.runExp(cmdData.exp, scope);
                });
            }
        }
        // 返回节点
        return context.target;
    },
    /** if命令 */
    if: function (context) {
        var cmdData = context.cmdData;
        // 记录一个是否编译过的flag
        var compiled = false;
        // 插入一个占位元素
        var refNode = new PIXI.Container();
        refNode.interactive = refNode.interactiveChildren = false;
        var parent = context.target.parent;
        var index = parent.getChildIndex(context.target);
        parent.addChildAt(refNode, index);
        // 只有在条件为true时才启动编译
        var watcher = context.entity.createWatcher(context.target, cmdData.exp, context.scope, function (value) {
            // 如果refNode被从显示列表移除了，则表示该if指令要作废了
            if (!refNode.parent) {
                watcher.dispose();
                return;
            }
            if (value == true) {
                // 启动编译
                if (!compiled) {
                    context.compiler.compile(context.target, context.scope);
                    compiled = true;
                }
                // 插入节点
                if (!context.target.parent) {
                    var index = refNode.parent.getChildIndex(refNode);
                    refNode.parent.addChildAt(context.target, index);
                }
            }
            else {
                // 移除元素
                if (context.target.parent) {
                    context.target.parent.removeChild(context.target);
                }
            }
        });
        // 返回节点
        return context.target;
    },
    /** for命令 */
    for: function (context) {
        var cmdData = context.cmdData;
        // 解析表达式
        var reg = /^\s*(\S+)\s+in\s+([\s\S]+?)\s*$/;
        var res = reg.exec(cmdData.exp);
        if (!res) {
            console.error("for命令表达式错误：" + cmdData.exp);
            return;
        }
        var itemName = res[1];
        var arrName = res[2];
        // 生成一个容器替换原始模板
        var index = context.target.parent.getChildIndex(context.target);
        var parent = new PIXI.Container();
        context.target.parent.addChildAt(parent, index);
        context.target.parent.removeChild(context.target);
        // 生成一个新的scope，要向其中添加属性
        var forScope = Object.create(context.scope);
        Object.defineProperty(forScope, "$forTarget", {
            configurable: true,
            enumerable: false,
            value: context.target,
            writable: false
        });
        // 如果有viewport命令，则将其转移至容器上
        var viewportCmds = context.cmdDict["viewport"];
        if (viewportCmds) {
            var viewportCmd = viewportCmds[0];
            if (viewportCmd) {
                parent[viewportCmd.propName] = viewportCmd.exp;
                delete context.target[viewportCmd.propName];
            }
        }
        // 添加订阅
        var watcher = context.entity.createWatcher(context.target, arrName, forScope, function (value) {
            // 如果refNode被从显示列表移除了，则表示该if指令要作废了
            if (!parent.parent) {
                watcher.dispose();
                return;
            }
            // 清理原始显示
            for (var i = parent.children.length - 1; i >= 0; i--) {
                parent.removeChildAt(i).destroy();
            }
            // 如果是数字，构建一个数字列表
            if (typeof value == "number") {
                var temp = [];
                for (var i = 0; i < value; i++) {
                    temp.push(i);
                }
                value = temp;
            }
            // 开始遍历
            var lastNode = null;
            var arrLength = (value instanceof Array ? value.length : -1);
            for (var key in value) {
                // 拷贝一个target
                var newNode = cloneObject(context.target, true);
                // 添加到显示里
                parent.addChild(newNode);
                // 生成子域
                var newScope = Object.create(forScope);
                // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响forScope
                Object.defineProperty(newScope, "$index", {
                    configurable: true,
                    enumerable: false,
                    value: (value instanceof Array ? parseInt(key) : key),
                    writable: false
                });
                // 注入上一个显示节点
                Object.defineProperty(newScope, "$last", {
                    configurable: true,
                    enumerable: false,
                    value: lastNode,
                    writable: false
                });
                // 如果是数组再添加一个数组长度
                if (arrLength >= 0) {
                    Object.defineProperty(newScope, "$length", {
                        configurable: true,
                        enumerable: false,
                        value: arrLength,
                        writable: false
                    });
                }
                // 注入遍历名
                Object.defineProperty(newScope, itemName, {
                    configurable: true,
                    enumerable: true,
                    value: value[key],
                    writable: false
                });
                // 开始编译新节点
                context.compiler.compile(newNode, newScope);
                // 赋值上一个节点
                lastNode = newNode;
            }
        });
        // 使用原始显示对象编译一次parent
        context.compiler.compile(parent, forScope);
        // 返回节点
        return context.target;
    }
};
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
            var children = target["children"];
            for (var j in children) {
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
//# sourceMappingURL=PIXICommands.js.map