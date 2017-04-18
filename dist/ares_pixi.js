/**
 * Created by Raykid on 2016/12/27.
 */
var ares;
(function (ares) {
    var pixijs;
    (function (pixijs) {
        /**
         * 提供给外部的可以注入自定义命令的接口
         * @param name
         * @param command
         */
        function addCommand(name, command) {
            if (!pixijs.commands[name])
                pixijs.commands[name] = command;
        }
        pixijs.addCommand = addCommand;
        /** 文本域命令 */
        function textContent(context) {
            context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                var text = context.target;
                text.text = value;
            });
        }
        pixijs.textContent = textContent;
        pixijs.commands = {
            /** 模板替换命令 */
            tpl: function (context) {
                // 取到模板对象
                var template = context.compiler.getTemplate(context.exp);
                if (!template)
                    return;
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
                var target = context.target;
                context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                    if (context.subCmd != "") {
                        // 子命令形式
                        target[context.subCmd] = value;
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
                if (context.subCmd != "") {
                    var handler = context.scope[context.exp] || window[context.exp];
                    if (typeof handler == "function") {
                        // 是函数名形式
                        context.target.on(context.subCmd, handler, context.scope);
                    }
                    else {
                        // 是方法执行或者表达式方式
                        context.target.on(context.subCmd, function (evt) {
                            // 创建一个临时的子域，用于保存参数
                            var scope = Object.create(context.scope);
                            scope.$event = evt;
                            scope.$target = context.target;
                            ares.utils.runExp(context.exp, scope);
                        });
                    }
                }
                // 返回节点
                return context.target;
            },
            /** if命令 */
            if: function (context) {
                // 记录一个是否编译过的flag
                var compiled = false;
                // 插入一个占位元素
                var refNode = new PIXI.DisplayObject();
                refNode.interactive = refNode.interactiveChildren = false;
                var parent = context.target.parent;
                var index = parent.getChildIndex(context.target);
                parent.addChildAt(refNode, index);
                // 只有在条件为true时才启动编译
                var watcher = context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
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
                // 解析表达式
                var reg = /^\s*(\S+)\s+in\s+(\S+)\s*$/;
                var res = reg.exec(context.exp);
                if (!res) {
                    console.error("for命令表达式错误：" + context.exp);
                    return;
                }
                var itemName = res[1];
                var arrName = res[2];
                var parent = context.target.parent;
                var sNode = new PIXI.DisplayObject();
                sNode.interactive = sNode.interactiveChildren = false;
                var eNode = new PIXI.DisplayObject();
                eNode.interactive = eNode.interactiveChildren = false;
                // 替换原始模板
                var index = parent.getChildIndex(context.target);
                parent.addChildAt(sNode, index);
                parent.addChildAt(eNode, index + 1);
                parent.removeChild(context.target);
                // 添加订阅
                var watcher = context.entity.createWatcher(context.target, arrName, context.scope, function (value) {
                    // 如果refNode被从显示列表移除了，则表示该if指令要作废了
                    if (!sNode.parent) {
                        watcher.dispose();
                        return;
                    }
                    // 清理原始显示
                    var bIndex = parent.getChildIndex(sNode);
                    var eIndex = parent.getChildIndex(eNode);
                    for (var i = eIndex - 1; i > bIndex; i--) {
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
                    var curIndex = 0;
                    for (var key in value) {
                        // 拷贝一个target
                        var newNode = cloneObject(context.target, true);
                        // 添加到显示里
                        parent.addChildAt(newNode, (bIndex + 1) + curIndex);
                        // 生成子域
                        var newScope = Object.create(context.scope);
                        // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响context.scope
                        Object.defineProperty(newScope, "$index", {
                            configurable: true,
                            enumerable: false,
                            value: (value instanceof Array ? parseInt(key) : key),
                            writable: false
                        });
                        Object.defineProperty(newScope, itemName, {
                            configurable: true,
                            enumerable: true,
                            value: value[key],
                            writable: false
                        });
                        // 开始编译新节点
                        context.compiler.compile(newNode, newScope);
                        // 索引自增1
                        curIndex++;
                    }
                });
                // 返回节点
                return context.target;
            }
        };
        function cloneObject(target, deep) {
            var result;
            // 基础类型直接返回
            if (!target || typeof target != "object")
                return target;
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
            var keys = Object.keys(target);
            for (var i in keys) {
                var key = keys[i];
                // 标签不复制
                if (key == "__ares_cloning__")
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
                        if (temp.context == target) {
                            result["_events"][k].context = result;
                        }
                    }
                    continue;
                }
                // 显示对象的children属性要特殊处理
                if (key == "children" && target instanceof PIXI.DisplayObject) {
                    var children = target["children"];
                    for (var j in children) {
                        var child = cloneObject(children[j], true);
                        result["addChild"](child);
                    }
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
                    if (value !== null)
                        result[key] = value;
                }
            }
            // 移除标签
            delete target["__ares_cloning__"];
            return result;
        }
    })(pixijs = ares.pixijs || (ares.pixijs = {}));
})(ares || (ares = {}));
/// <reference path="PIXICommands.ts"/>
/// <reference path="pixi.js.d.ts"/>
/// <reference path="../../../dist/ares.d.ts"/>
/**
 * Created by Raykid on 2016/12/27.
 */
var ares;
(function (ares) {
    var pixijs;
    (function (pixijs) {
        var PIXICompiler = (function () {
            /**
             * 创建PIXI绑定
             * @param root 根显示对象，从这里传入的绑定数据属性名必须以“a_”开头
             * @param config 绑定数据，从这里传入的绑定数据属性名可以不以“a_”开头
             * @param tplDict 模板字典，可以在这里给出模板定义表
             */
            function PIXICompiler(root, config, tplDict) {
                this._nameDict = {};
                this._root = root;
                this._config = config;
                this._tplDict = tplDict || {};
            }
            Object.defineProperty(PIXICompiler.prototype, "root", {
                /** 获取根显示对象 */
                get: function () {
                    return this._root;
                },
                enumerable: true,
                configurable: true
            });
            PIXICompiler.prototype.init = function (entity) {
                this._entity = entity;
                // 开始编译root节点
                this.compile(this._root, entity.data);
            };
            PIXICompiler.prototype.compile = function (node, scope) {
                // 首先判断是否是模板，是的话就记下来，但是不编译
                var tplName = node["a-tplName"] || node["a_tplName"];
                if (tplName && this.setTemplate(tplName, node)) {
                    // 移除a-tpl和a_tpl属性
                    delete node["a-tplName"];
                    delete node["a_tplName"];
                    // 将这个节点从显示列表中移除
                    node.parent && node.parent.removeChild(node);
                    // 不编译，直接返回
                    return;
                }
                // 开始编译
                var hasLazyCompile = false;
                // 如果有名字就记下来
                var name = node.name;
                if (name)
                    this._nameDict[name] = node;
                // 取到属性列表
                var keys = [];
                for (var t in node) {
                    if (t.indexOf("a-") == 0 || t.indexOf("a_") == 0) {
                        keys.push(t);
                    }
                }
                // 把配置中的属性推入属性列表中
                var conf = (this._config && this._config[name]);
                for (var t in conf) {
                    if (t.indexOf("a-") != 0 && t.indexOf("a_") != 0)
                        t = "a-" + t;
                    keys.push(t);
                }
                // 开始遍历属性列表
                var cmdsToCompile = [];
                for (var i = 0, len = keys.length; i < len; i++) {
                    // 首先解析当前节点上面以a_开头的属性，将其认为是绑定属性
                    var key = keys[i];
                    var bIndex = 2;
                    var eIndex = key.indexOf(":");
                    if (eIndex < 0)
                        eIndex = key.indexOf("$");
                    if (eIndex < 0)
                        eIndex = key.length;
                    // 取到命令名
                    var cmdName = key.substring(bIndex, eIndex);
                    // 取到命令字符串
                    var exp;
                    if (conf)
                        exp = conf[key] || conf[cmdName] || node[key];
                    else
                        exp = node[key];
                    // 取到子命令名
                    var subCmd = key.substr(eIndex + 1);
                    // 用命令名取到Command
                    var cmd = pixijs.commands[cmdName];
                    // 如果没有找到命令，则认为是自定义命令，套用prop命令
                    if (!cmd) {
                        cmd = pixijs.commands["prop"];
                        subCmd = cmdName || "";
                    }
                    // 推入数组
                    var cmdToCompile = {
                        propName: key,
                        cmd: cmd,
                        ctx: {
                            scope: scope,
                            target: node,
                            subCmd: subCmd,
                            exp: exp,
                            compiler: this,
                            entity: this._entity
                        }
                    };
                    // 如果是tpl命令则需要提前
                    if (cmdName == "tpl")
                        cmdsToCompile.unshift(cmdToCompile);
                    else
                        cmdsToCompile.push(cmdToCompile);
                    // 如果是for或者if则设置懒编译
                    if (cmdName == "if" || cmdName == "for") {
                        hasLazyCompile = true;
                        // 清空数组，仅留下自身的编译
                        cmdsToCompile.splice(0, cmdsToCompile.length - 1);
                        break;
                    }
                }
                // 开始编译当前节点外部结构
                for (var i = 0, len = cmdsToCompile.length; i < len; i++) {
                    var cmdToCompile = cmdsToCompile[i];
                    // 更新target属性
                    cmdToCompile.ctx.target = node;
                    // 移除属性
                    delete cmdToCompile.ctx.target[cmdToCompile.propName];
                    // 开始编译
                    node = cmdToCompile.cmd(cmdToCompile.ctx);
                }
                // 如果没有懒编译则编译内部结构
                if (!hasLazyCompile) {
                    // 如果是文本对象，则进行文本内容编译
                    if (node instanceof PIXI.Text) {
                        this.compileTextContent(node, scope);
                    }
                    // 然后递归解析子节点
                    if (node instanceof PIXI.Container) {
                        var children = node.children;
                        var nextChild;
                        for (var i = 0, len = children.length; i < len; i++) {
                            var child = children[i];
                            // 记录下一个子节点
                            nextChild = children[i + 1];
                            // 开始编译
                            this.compile(child, scope);
                            // 重置索引值和长度值
                            var nextI = children.indexOf(nextChild);
                            if (nextI >= 0 && nextI != i + 1) {
                                i = nextI - 1;
                                len = children.length;
                            }
                        }
                    }
                }
            };
            /**
             * 获取模板对象
             * @param name 模板名称
             * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
             */
            PIXICompiler.prototype.getTemplate = function (name) {
                return this._tplDict[name];
            };
            /**
             * 设置模板
             * @param name 模板名称
             * @param tpl 模板对象
             * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
             */
            PIXICompiler.prototype.setTemplate = function (name, tpl) {
                // 非空判断
                if (!name || !tpl)
                    return null;
                // 如果已经有了模板定义则返回null
                if (this._tplDict[name])
                    return null;
                // 添加模板定义
                this._tplDict[name] = tpl;
                // 返回模板对象
                return tpl;
            };
            PIXICompiler.prototype.compileTextContent = function (text, scope) {
                var value = text.text;
                if (PIXICompiler._textExpReg.test(value)) {
                    var exp = this.parseTextExp(value);
                    pixijs.textContent({
                        scope: scope,
                        target: text,
                        subCmd: "",
                        exp: exp,
                        compiler: this,
                        entity: this._entity
                    });
                }
            };
            PIXICompiler.prototype.parseTextExp = function (exp) {
                var reg = PIXICompiler._textExpReg;
                for (var result = reg.exec(exp); result != null; result = reg.exec(exp)) {
                    exp = result[1] + "${" + result[2] + "}" + result[3];
                }
                return "`" + exp + "`";
            };
            return PIXICompiler;
        }());
        PIXICompiler._textExpReg = /(.*?)\{\{(.*?)\}\}(.*)/;
        pixijs.PIXICompiler = PIXICompiler;
    })(pixijs = ares.pixijs || (ares.pixijs = {}));
})(ares || (ares = {}));
// 为了nodejs模块
var module = module || {};
module.exports = ares.pixijs;
//# sourceMappingURL=ares_pixi.js.map