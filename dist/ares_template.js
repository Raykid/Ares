/**
 * Created by Raykid on 2017/3/17.
 */
var ares;
(function (ares) {
    var template;
    (function (template) {
        function getChildrenString(node) {
            var result = "";
            var children = node.children;
            if (children) {
                for (var i = 0, len = children.length; i < len; i++) {
                    result += children[i].value;
                }
            }
            return result;
        }
        template.getChildrenString = getChildrenString;
        function compileChildren(node, scope, compiler) {
            node.children.forEach(function (child) {
                compiler.compile(child, scope);
            }, this);
        }
        template.compileChildren = compileChildren;
        /**
         * 提供给外部的可以注入自定义命令的接口
         * @param name
         * @param command
         */
        function addCommand(name, command) {
            if (!template.commands[name])
                template.commands[name] = command;
        }
        template.addCommand = addCommand;
        template.commands = {
            /** text命令 */
            text: function (context) {
                // 直接储存结果
                context.node.value = context.node.exp;
            },
            /** exp命令 */
            exp: function (context) {
                context.entity.createWatcher(context.node, context.node.exp, context.scope, function (value) {
                    // 更新显示
                    context.node.value = value + "";
                });
            },
            /** if命令 */
            if: function (context) {
                context.entity.createWatcher(context.node, context.node.exp, context.scope, function (value) {
                    if (value) {
                        // 判断为真，编译子节点并显示
                        compileChildren(context.node, context.scope, context.compiler);
                        // 更新值
                        context.node.value = getChildrenString(context.node);
                    }
                    else {
                        // 判断为假，啥也不显示
                        context.node.value = "";
                    }
                });
            },
            /** for命令 */
            for: function (context) {
                var reg = /^\s*(\S+)\s+in\s+(\S+)\s*$/;
                var res = reg.exec(context.node.exp);
                if (!res) {
                    console.error("for命令表达式错误：" + context.node.exp);
                    return;
                }
                context.entity.createWatcher(context.node, res[2], context.scope, function (value) {
                    var result = "";
                    if (value) {
                        for (var key in value) {
                            // 生成子域
                            var newScope = Object.create(context.scope);
                            // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响context.scope
                            Object.defineProperty(newScope, "$index", {
                                configurable: true,
                                enumerable: false,
                                value: (value instanceof Array ? parseInt(key) : key),
                                writable: false
                            });
                            Object.defineProperty(newScope, res[1], {
                                configurable: true,
                                enumerable: true,
                                value: value[key],
                                writable: false
                            });
                            // 编译子节点并显示
                            compileChildren(context.node, newScope, context.compiler);
                            // 更新值
                            result += getChildrenString(context.node);
                        }
                    }
                    context.node.value = result;
                });
            }
        };
    })(template = ares.template || (ares.template = {}));
})(ares || (ares = {}));
/// <reference path="TemplateCommands.ts"/>
/// <reference path="../../../dist/ares.d.ts"/>
/**
 * Created by Raykid on 2017/3/17.
 */
var ares;
(function (ares) {
    var template;
    (function (template_1) {
        var TemplateCompiler = (function () {
            /**
             * 创建模板绑定
             * @param template 模板字符串
             * @param onUpdate 当文本有更新时调用，传入最新文本
             * @param config 绑定数据
             */
            function TemplateCompiler(template, onUpdate, config) {
                this._template = template;
                this._onUpdate = onUpdate;
                this._config = config;
            }
            Object.defineProperty(TemplateCompiler.prototype, "root", {
                get: function () {
                    return this._root;
                },
                enumerable: true,
                configurable: true
            });
            TemplateCompiler.prototype.init = function (entity) {
                this._entity = entity;
                // 将整个模板文本编译为节点
                this._root = this.transformToNode(this._template);
                // 开始编译根节点
                this.compile(this._root, entity.data);
                // 更新首次显示
                this.update();
                // 将所有node节点的value变为getter、setter
                this.mutateValue(this._root);
            };
            TemplateCompiler.prototype.compile = function (node, scope) {
                this._scope = scope;
                // 如果节点的cmd不认识，则不编译该节点，仅编译其子节点
                var cmd = template_1.commands[node.cmd];
                if (cmd) {
                    var ctx = {
                        node: node,
                        scope: scope,
                        compiler: this,
                        entity: this._entity
                    };
                    cmd(ctx);
                }
                // 开始递归编译子节点，但if或者for不编译
                if (node.children && node.cmd != "if" && node.cmd != "for") {
                    template_1.compileChildren(node, scope, this);
                }
            };
            TemplateCompiler.prototype.update = function () {
                var text = template_1.getChildrenString(this._root);
                this._onUpdate(text);
            };
            TemplateCompiler.prototype.mutateValue = function (node) {
                var value = node.value;
                var self = this;
                Object.defineProperty(node, "value", {
                    configurable: true,
                    enumerable: true,
                    get: function () {
                        return value;
                    },
                    set: function (v) {
                        value = v;
                        // 更新显示
                        self.update();
                    }
                });
                // 递归子对象
                if (node.children) {
                    node.children.forEach(this.mutateValue, this);
                }
            };
            TemplateCompiler.prototype.getEndIndex = function (str, startIndex) {
                var startIcons = ["{", "\"", "'", "`", "(", "["];
                var endIcons = ["}", "\"", "'", "`", ")", "]"];
                var stack = [0];
                for (var i = startIndex, len = str.length; i < len; i++) {
                    var tempChar = str.charAt(i);
                    var startIndex = startIcons.indexOf(tempChar);
                    var endIndex = endIcons.indexOf(tempChar);
                    // 如果是终结符号且当前栈顶是对应起始符号，则出栈
                    if (endIndex >= 0 && stack[stack.length - 1] == endIndex)
                        stack.pop();
                    else if (startIndex >= 0)
                        stack.push(startIndex);
                    // 如果stack已经空了，则立即返回当前字符的下一个索引
                    if (stack.length <= 0)
                        return (i + 1);
                }
                return -1;
            };
            TemplateCompiler.prototype.transformToNode = function (str) {
                var regAres = /\$a\-\{/g;
                var regTrim = /^\s*([\s\S]*)\s*$/;
                var regCmd = /^\s*([a-zA-Z0-9_]+?)\s*:\s*(.+?)\s*$/;
                var regEnd = /^\s*end\s+([a-zA-Z0-9_]+?)\s*$/;
                // 遍历整个str，使用ares命令将其分隔成数组
                var nodes = [];
                var index = 0;
                var length = str.length;
                var cmdStack = [];
                var eatCount;
                for (var resAres = regAres.exec(str); resAres != null; resAres = regAres.exec(str)) {
                    var endIndex = this.getEndIndex(str, resAres.index + resAres[0].length);
                    if (endIndex < 0) {
                        console.error("\u6307\u4EE4\u6CA1\u6709\u7ED3\u675F" + str.substr(resAres.index));
                        return null;
                    }
                    regAres.lastIndex = endIndex;
                    var whole = str.substring(resAres.index, endIndex);
                    var content = whole.substring(resAres[0].length, whole.length - 1);
                    eatCount = 0;
                    // 把ares命令前面的部分以简单文本形式推入数组（如果有的话）
                    if (resAres.index > index) {
                        nodes.push({
                            cmd: "text",
                            exp: str.substring(index, resAres.index)
                        });
                    }
                    // 把ares命令部分推入数组
                    var resEnd = regEnd.exec(content);
                    if (resEnd != null) {
                        // 是命令的终结指令，需要清除节点两侧的空白符
                        clearNode();
                        // 弹出一个命令
                        var start = cmdStack.pop();
                        // 判断正确性
                        if (start == null) {
                            console.error("\u7EC8\u7ED3\u6307\u4EE4(" + resEnd[1] + ")\u6CA1\u6709\u5BF9\u5E94\u7684\u8D77\u59CB\u6307\u4EE4");
                            return null;
                        }
                        if (start.cmd != resEnd[1]) {
                            console.error("\u8D77\u59CB\u6307\u4EE4(" + start.cmd + ")\u4E0E\u7EC8\u7ED3\u6307\u4EE4(" + resEnd[1] + ")\u4E0D\u5339\u914D");
                            return null;
                        }
                        // 将起始指令与终结指令之间所有节点放入该命令内部
                        var startIndex = nodes.indexOf(start);
                        start.children = nodes.splice(startIndex + 1);
                    }
                    else {
                        // 不是终结指令
                        var resCmd = regCmd.exec(content);
                        if (resCmd != null) {
                            // 是起始命令，需要清除节点两侧的空白符
                            clearNode();
                            // 生成命令节点
                            var node = {
                                cmd: resCmd[1],
                                exp: resCmd[2]
                            };
                            nodes.push(node);
                            // 推入命令栈
                            cmdStack.push(node);
                        }
                        else if (content == "") {
                            // 是占位符，需要清除节点两侧的空白符
                            clearNode();
                        }
                        else {
                            // 只是简单的表达式
                            nodes.push({
                                cmd: "exp",
                                exp: content
                            });
                        }
                    }
                    // 修改index指向
                    index = resAres.index + whole.length + eatCount;
                }
                if (index < length) {
                    // 把最后一点字符推入数组
                    nodes.push({
                        cmd: "text",
                        exp: str.substr(index)
                    });
                }
                // 如果命令栈不为空，则表示起始指令没有终结指令
                if (cmdStack.length > 0) {
                    console.error("\u8D77\u59CB\u6307\u4EE4" + cmdStack[0].cmd + "\u6CA1\u6709\u5BF9\u5E94\u7684\u7EC8\u7ED3\u6307\u4EE4");
                    return null;
                }
                // 返回结果
                return {
                    cmd: null,
                    exp: null,
                    children: nodes
                };
                function clearNode() {
                    var regBlankBefore = /[ \f\t\v]*/;
                    var regBlankAfter = /([ \f\t\v]*((\r\n)|[\r\n]))|([ \f\t\v]*)/g;
                    var lastNode = nodes[nodes.length - 1];
                    if (lastNode && lastNode.cmd == "text") {
                        // 将上一条换行符后面的空白符吃掉
                        var index = Math.max(lastNode.exp.lastIndexOf("\r"), lastNode.exp.lastIndexOf("\n"));
                        lastNode.exp = lastNode.exp.substring(0, index + 1) + lastNode.exp.substr(index + 1).replace(regBlankBefore, "");
                    }
                    // 再把本行直到换行符为止的空白符都吃掉
                    regBlankAfter.lastIndex = resAres.index + whole.length;
                    var resBlank = regBlankAfter.exec(str);
                    if (resBlank)
                        eatCount = resBlank[0].length;
                }
            };
            return TemplateCompiler;
        }());
        template_1.TemplateCompiler = TemplateCompiler;
    })(template = ares.template || (ares.template = {}));
})(ares || (ares = {}));
// 为了nodejs模块
var module = module || {};
module.exports = ares.template;
//# sourceMappingURL=ares_template.js.map