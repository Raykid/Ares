/**
 * Created by Raykid on 2016/12/22.
 */
var ares;
(function (ares) {
    var utils;
    (function (utils) {
        /**
         * 创建一个表达式求值方法，用于未来执行
         * @param exp 表达式
         * @returns {Function} 创建的方法
         */
        function createEvalFunc(exp) {
            return Function("scope", "with(scope){return " + exp + "}");
        }
        utils.createEvalFunc = createEvalFunc;
        /**
         * 表达式求值，无法执行多条语句
         * @param exp 表达式
         * @param scope 表达式的作用域
         * @returns {any} 返回值
         */
        function evalExp(exp, scope) {
            return createEvalFunc(exp)(scope);
        }
        utils.evalExp = evalExp;
        /**
         * 创建一个执行方法，用于未来执行
         * @param exp 表达式
         * @returns {Function} 创建的方法
         */
        function createRunFunc(exp) {
            return Function("scope", "with(scope){" + exp + "}");
        }
        utils.createRunFunc = createRunFunc;
        /**
         * 直接执行表达式，不求值。该方法可以执行多条语句
         * @param exp 表达式
         * @param scope 表达式的作用域
         */
        function runExp(exp, scope) {
            createRunFunc(exp)(scope);
        }
        utils.runExp = runExp;
    })(utils = ares.utils || (ares.utils = {}));
})(ares || (ares = {}));
/**
 * Created by Raykid on 2016/12/22.
 */
var ares;
(function (ares) {
    var html;
    (function (html) {
        /**
         * 提供给外部的可以注入自定义命令的接口
         * @param name
         * @param command
         */
        function addCommand(name, command) {
            if (!html.commands[name])
                html.commands[name] = command;
        }
        html.addCommand = addCommand;
        /** 文本域命令 */
        function textContent(context) {
            context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                context.target.nodeValue = value;
            });
        }
        html.textContent = textContent;
        html.commands = {
            /** 文本命令 */
            text: function (context) {
                context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                    context.target.textContent = value;
                });
            },
            /** HTML文本命令 */
            html: function (context) {
                context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                    var target = context.target;
                    target.innerHTML = value;
                    // 设置完成后需要重新编译一下当前节点的所有子节点
                    var children = target.childNodes;
                    for (var i = 0, len = children.length; i < len; i++) {
                        context.compiler.compile(children[i], context.scope);
                    }
                });
            },
            /** CSS类型命令 */
            css: function (context) {
                var target = context.target;
                // 记录原始class值
                var oriCls = target.getAttribute("class");
                // 生成订阅器
                context.entity.createWatcher(context.target, context.exp, context.scope, function (params) {
                    if (typeof params == "string") {
                        // 直接赋值形式
                        if (oriCls)
                            params = oriCls + " " + params;
                        // 更新target节点的class属性
                        target.setAttribute("class", params);
                    }
                    else {
                        // 集成形式
                        var arr = [];
                        if (oriCls)
                            arr.push(oriCls);
                        // 遍历所有params的key，如果其表达式值为true则添加其类型
                        for (var cls in params) {
                            if (params[cls] == true)
                                arr.push(cls);
                        }
                        // 更新target节点的class属性
                        if (arr.length > 0)
                            target.setAttribute("class", arr.join(" "));
                    }
                });
            },
            /** 修改任意属性命令 */
            attr: function (context) {
                var target = context.target;
                context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                    if (context.subCmd != "") {
                        // 子命令形式
                        target.setAttribute(context.subCmd, value);
                    }
                    else {
                        // 集成形式，遍历所有value的key，如果其表达式值为true则添加其类型
                        for (var name in value) {
                            var value = value[name];
                            target.setAttribute(name, value);
                        }
                    }
                });
            },
            /** 绑定事件 */
            on: function (context) {
                if (context.subCmd != "") {
                    var handler = context.scope[context.exp] || window[context.exp];
                    if (typeof handler == "function") {
                        // 是函数名形式
                        context.target.addEventListener(context.subCmd, handler.bind(context.scope));
                    }
                    else {
                        // 是方法执行或者表达式方式
                        context.target.addEventListener(context.subCmd, function (evt) {
                            // 创建一个临时的子域，用于保存参数
                            var scope = Object.create(context.scope);
                            scope.$event = evt;
                            scope.$target = context.target;
                            ares.utils.runExp(context.exp, scope);
                        });
                    }
                }
            },
            /** if命令 */
            if: function (context) {
                // 记录一个是否编译过的flag
                var compiled = false;
                // 插入一个占位元素
                var refNode = document.createTextNode("");
                context.target.parentNode.insertBefore(refNode, context.target);
                // 只有在条件为true时才启动编译
                context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                    if (value == true) {
                        // 启动编译
                        if (!compiled) {
                            context.compiler.compile(context.target, context.scope);
                            compiled = true;
                        }
                        // 插入节点
                        if (!context.target.parentNode) {
                            refNode.parentNode.insertBefore(context.target, refNode);
                        }
                    }
                    else {
                        // 移除元素
                        if (context.target.parentNode) {
                            context.target.parentNode.removeChild(context.target);
                        }
                    }
                });
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
                var pNode = context.target.parentNode;
                var sNode = document.createTextNode("");
                var eNode = document.createTextNode("");
                var range = document.createRange();
                // 替换原始模板
                pNode.replaceChild(eNode, context.target);
                pNode.insertBefore(sNode, eNode);
                // 添加订阅
                context.entity.createWatcher(context.target, arrName, context.scope, function (value) {
                    // 清理原始显示
                    range.setStart(sNode, 0);
                    range.setEnd(eNode, 0);
                    range.deleteContents();
                    // 如果是数字，构建一个数字列表
                    if (typeof value == "number") {
                        var temp = [];
                        for (var i = 0; i < value; i++) {
                            temp.push(i);
                        }
                        value = temp;
                    }
                    // 开始遍历
                    for (var key in value) {
                        // 拷贝一个target
                        var newNode = context.target.cloneNode(true);
                        // 添加到显示里
                        pNode.insertBefore(newNode, eNode);
                        // 生成子域
                        var newScope = Object.create(context.scope);
                        newScope.$index = key;
                        newScope[itemName] = value[key];
                        // 开始编译新节点
                        context.compiler.compile(newNode, newScope);
                    }
                });
            }
        };
    })(html = ares.html || (ares.html = {}));
})(ares || (ares = {}));
/// <reference path="../Interfaces.ts"/>
/// <reference path="../Utils.ts"/>
/// <reference path="HTMLCommands.ts"/>
/**
 * Created by Raykid on 2016/12/22.
 */
var ares;
(function (ares) {
    var html;
    (function (html) {
        var HTMLCompiler = (function () {
            function HTMLCompiler(idOrElement) {
                this._idOrElement = idOrElement;
            }
            HTMLCompiler.prototype.init = function (entity) {
                if (typeof this._idOrElement == "string")
                    this._root = document.getElementById(this._idOrElement) ||
                        document.getElementsByName(this._idOrElement)[0];
                else
                    this._root = this._idOrElement;
                this._entity = entity;
                // 开始编译root节点
                this.compile(this._root, entity.data);
            };
            HTMLCompiler.prototype.compile = function (node, scope) {
                if (node.nodeType == 3) {
                    // 是个文本节点
                    this.compileTextContent(node, scope);
                }
                else {
                    // 不是文本节点
                    var hasLazyCompile = false;
                    // 首先解析当前节点上面以data-a-或者a-开头的属性，将其认为是绑定属性
                    var attrs = node.attributes;
                    var cmdsToCompile = [];
                    for (var i = 0, len = attrs.length; i < len; i++) {
                        var attr = attrs[i];
                        var name = attr.name;
                        // 所有属性必须以data-a-或者a-开头
                        if (name.indexOf("a-") == 0 || name.indexOf("data-a-") == 0) {
                            var bIndex = (name.charAt(0) == "d" ? 7 : 2);
                            var eIndex = name.indexOf(":");
                            if (eIndex < 0)
                                eIndex = name.length;
                            // 取到命令名
                            var cmdName = name.substring(bIndex, eIndex);
                            // 用命令名取到Command
                            var cmd = html.commands[cmdName];
                            if (cmd) {
                                // 取到子命令名
                                var subCmd = name.substr(eIndex + 1);
                                // 取到命令字符串
                                var exp = attr.value;
                                // 推入数组
                                cmdsToCompile.push({
                                    attr: attr,
                                    cmd: cmd,
                                    ctx: {
                                        scope: scope,
                                        target: node,
                                        subCmd: subCmd,
                                        exp: exp,
                                        compiler: this,
                                        entity: this._entity
                                    }
                                });
                                // 如果是for或者if则设置懒编译
                                if (cmdName == "if" || cmdName == "for") {
                                    hasLazyCompile = true;
                                    // 清空数组，仅留下自身的编译
                                    cmdsToCompile.splice(0, cmdsToCompile.length - 1);
                                    break;
                                }
                            }
                        }
                    }
                    // 开始编译当前节点外部结构
                    for (var i = 0, len = cmdsToCompile.length; i < len; i++) {
                        var cmdToCompile = cmdsToCompile[i];
                        // 移除属性
                        cmdToCompile.attr.ownerElement.removeAttribute(cmdToCompile.attr.name);
                        // 开始编译
                        cmdToCompile.cmd(cmdToCompile.ctx);
                    }
                    // 如果没有懒编译则编译内部结构
                    if (!hasLazyCompile) {
                        // 然后递归解析子节点
                        var children = node.childNodes;
                        for (var i = 0, len = children.length; i < len; i++) {
                            var child = children[i];
                            this.compile(child, scope);
                        }
                    }
                }
            };
            HTMLCompiler.prototype.compileTextContent = function (node, scope) {
                if (HTMLCompiler._textExpReg.test(node.nodeValue)) {
                    var exp = this.parseTextExp(node.nodeValue);
                    html.textContent({
                        scope: scope,
                        target: node,
                        subCmd: "",
                        exp: exp,
                        compiler: this,
                        entity: this._entity
                    });
                }
            };
            HTMLCompiler.prototype.parseTextExp = function (exp) {
                var reg = HTMLCompiler._textExpReg;
                for (var result = reg.exec(exp); result != null; result = reg.exec(exp)) {
                    exp = result[1] + "${" + result[2] + "}" + result[3];
                }
                return "`" + exp + "`";
            };
            HTMLCompiler._textExpReg = /(.*?)\{\{(.*?)\}\}(.*)/;
            return HTMLCompiler;
        }());
        html.HTMLCompiler = HTMLCompiler;
    })(html = ares.html || (ares.html = {}));
})(ares || (ares = {}));
//# sourceMappingURL=ares_html.js.map