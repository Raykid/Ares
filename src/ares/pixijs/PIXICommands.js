"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PIXICompiler_1 = require("./PIXICompiler");
var Utils_1 = require("../Utils");
var ViewPortHandler_1 = require("./ViewPortHandler");
var PIXIUtils_1 = require("./PIXIUtils");
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
        template = PIXIUtils_1.cloneObject(template, true);
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
                // 插入节点
                if (!context.target.parent) {
                    var index = refNode.parent.getChildIndex(refNode);
                    refNode.parent.addChildAt(context.target, index);
                }
                // 启动编译
                if (!compiled) {
                    context.compiler.compile(context.target, context.scope);
                    compiled = true;
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
        var options = Utils_1.evalExp(cmdData.subCmd, context.scope) || {};
        var page = (options.page || Number.MAX_VALUE);
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
        // 使用原始显示对象编译一次parent
        context.compiler.compile(parent, forScope);
        // 获取窗口显示范围
        var viewportHandler = PIXIUtils_1.getViewportHandler(parent);
        // 声明闭包数据
        var isArray;
        var curList;
        var curIndex;
        var lastNode;
        // 添加订阅
        var watcher = context.entity.createWatcher(context.target, arrName, forScope, function (value) {
            // 如果refNode被从显示列表移除了，则表示该for指令要作废了
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
            // 如果不是数组，而是字典，则转换为数组，方便中断遍历
            isArray = (value instanceof Array);
            var list;
            if (isArray) {
                list = value;
            }
            else {
                list = [];
                for (var key in value) {
                    list.push({
                        key: key,
                        value: value[key]
                    });
                }
            }
            // 初始化数据
            curList = list;
            curIndex = 0;
            lastNode = null;
            // 添加监听
            if (viewportHandler)
                viewportHandler.observe(updateView);
            // 显示首页内容
            showNextPage();
        });
        // 进行一次瞬移归位
        if (viewportHandler)
            viewportHandler.homing(false);
        // 返回节点
        return context.target;
        function updateView() {
            // 如果已经生成完毕则停止
            if (curIndex >= curList.length) {
                if (viewportHandler)
                    viewportHandler.unobserve(updateView);
                return;
            }
            // 判断当前最后一个生成的节点是否进入视窗范围内，如果是则生成下一页内容
            var viewportGlobal = (viewportHandler.viewportGlobal || context.compiler.renderer.screen);
            var lastBounds = PIXIUtils_1.getGlobalBounds(lastNode);
            var crossRect = PIXIUtils_1.rectCross(viewportGlobal, lastBounds);
            if (!PIXIUtils_1.rectEmpty(crossRect)) {
                // 进入了，显示下一页
                showNextPage();
            }
        }
        function showNextPage() {
            // 开始遍历
            for (var end = Math.min(curIndex + page, curList.length); curIndex < end; curIndex++) {
                // 拷贝一个target
                var newNode = PIXIUtils_1.cloneObject(context.target, true);
                // 添加到显示里
                parent.addChild(newNode);
                // 生成子域
                var newScope = Object.create(forScope);
                // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响forScope
                Object.defineProperty(newScope, "$index", {
                    configurable: true,
                    enumerable: false,
                    value: curIndex,
                    writable: false
                });
                // 如果是字典则额外注入一个$key
                if (!isArray) {
                    Object.defineProperty(newScope, "$key", {
                        configurable: true,
                        enumerable: true,
                        value: curList[curIndex].key,
                        writable: false
                    });
                }
                // 注入上一个显示节点
                Object.defineProperty(newScope, "$last", {
                    configurable: true,
                    enumerable: false,
                    value: lastNode,
                    writable: false
                });
                // 添加长度
                Object.defineProperty(newScope, "$length", {
                    configurable: true,
                    enumerable: false,
                    value: curList.length,
                    writable: false
                });
                // 注入遍历名
                Object.defineProperty(newScope, itemName, {
                    configurable: true,
                    enumerable: true,
                    value: (isArray ? curList[curIndex] : curList[curIndex].value),
                    writable: false
                });
                // 开始编译新节点
                context.compiler.compile(newNode, newScope);
                // 赋值上一个节点
                lastNode = newNode;
            }
            // 继续判断
            updateView();
        }
    }
};
//# sourceMappingURL=PIXICommands.js.map