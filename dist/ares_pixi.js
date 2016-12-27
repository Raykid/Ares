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
 * Created by Raykid on 2016/12/27.
 */
var ares;
(function (ares) {
    var pixijs;
    (function (pixijs) {
        /** 文本域命令 */
        function textContent(context) {
            context.entity.createWatcher(context.exp, context.scope, function (value) {
                var text = context.target;
                text.text = value;
            });
        }
        pixijs.textContent = textContent;
        pixijs.commands = {
            /** 修改任意属性命令 */
            prop: function (context) {
                var target = context.target;
                context.entity.createWatcher(context.exp, context.scope, function (value) {
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
            }
        };
    })(pixijs = ares.pixijs || (ares.pixijs = {}));
})(ares || (ares = {}));
/// <reference path="../Interfaces.ts"/>
/// <reference path="../Utils.ts"/>
/// <reference path="PIXICommands.ts"/>
/// <reference path="pixi.js.d.ts"/>
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
             */
            function PIXICompiler(root, config) {
                this._nameDict = {};
                this._root = root;
                this._config = config;
            }
            PIXICompiler.prototype.init = function (entity) {
                this._entity = entity;
                // 开始编译root节点
                this.compile(this._root, entity.data);
            };
            PIXICompiler.prototype.compile = function (node, scope) {
                var hasLazyCompile = false;
                // 如果有名字就记下来
                var name = node.name;
                if (name)
                    this._nameDict[name] = node;
                // 取到属性列表
                var keys = Object.keys(node);
                // 把配置中的属性推入属性列表中
                var conf = (this._config && this._config[name]);
                for (var t in conf) {
                    if (t.indexOf("a_") != 0)
                        t = "a_" + t;
                    keys.push(t);
                }
                // 开始遍历属性列表
                var cmdsToCompile = [];
                for (var i = 0, len = keys.length; i < len; i++) {
                    // 首先解析当前节点上面以a_开头的属性，将其认为是绑定属性
                    var key = keys[i];
                    if (key.indexOf("a_") == 0) {
                        var bIndex = 2;
                        var eIndex = key.indexOf("$");
                        if (eIndex < 0)
                            eIndex = key.length;
                        // 取到命令名
                        var cmdName = key.substring(bIndex, eIndex);
                        // 取到子命令名
                        var subCmd = key.substr(eIndex + 1);
                        // 取到命令字符串
                        var exp;
                        if (conf)
                            exp = conf[key] || conf[cmdName] || node[key];
                        else
                            exp = node[key];
                        // 用命令名取到Command
                        var cmd = pixijs.commands[cmdName];
                        // 如果没有找到命令，则认为是自定义命令，套用prop命令
                        if (!cmd) {
                            cmd = pixijs.commands["prop"];
                            subCmd = cmdName || "";
                        }
                        // 推入数组
                        cmdsToCompile.push({
                            cmdName: cmdName,
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
                // 开始编译当前节点外部结构
                for (var i = 0, len = cmdsToCompile.length; i < len; i++) {
                    var cmdToCompile = cmdsToCompile[i];
                    // 移除属性
                    delete cmdToCompile.ctx.target[cmdToCompile.cmdName];
                    // 开始编译
                    cmdToCompile.cmd(cmdToCompile.ctx);
                }
                // 如果没有懒编译则编译内部结构
                if (!hasLazyCompile && Array.isArray(node["children"])) {
                    // 如果是文本对象，则进行文本内容编译
                    if (node instanceof PIXI.Text) {
                        this.compileTextContent(node, scope);
                    }
                    // 然后递归解析子节点
                    var children = node.children;
                    for (var i = 0, len = children.length; i < len; i++) {
                        var child = children[i];
                        this.compile(child, scope);
                    }
                }
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
                    exp = "`" + result[1] + "${" + result[2] + "}" + result[3] + "`";
                }
                return exp;
            };
            PIXICompiler._textExpReg = /(.*?)\{\{(.*?)\}\}(.*)/;
            return PIXICompiler;
        })();
        pixijs.PIXICompiler = PIXICompiler;
    })(pixijs = ares.pixijs || (ares.pixijs = {}));
})(ares || (ares = {}));
//# sourceMappingURL=ares_pixi.js.map