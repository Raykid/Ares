(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ares_template"] = factory();
	else
		root["ares_template"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 13);
/******/ })
/************************************************************************/
/******/ ({

/***/ 13:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TemplateCommands_1 = __webpack_require__(7);
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
        if (node.cmd) {
            // 伪造一个合法的ares命令头
            var data = this._entity.parseCommand("a-" + node.cmd, node.exp);
            // 判断是否是通用命令，是通用命令就不再单独编译节点
            var isCommonCmd = this._entity.execCommand(data, node, scope);
            if (!isCommonCmd) {
                // 如果节点的cmd不认识，则不编译该节点，仅编译其子节点
                var cmd = TemplateCommands_1.commands[node.cmd];
                if (cmd) {
                    var ctx = {
                        node: node,
                        scope: scope,
                        compiler: this,
                        entity: this._entity
                    };
                    cmd(ctx);
                }
            }
        }
        // 开始递归编译子节点，但if或者for不编译
        if (node.children && node.cmd != "if" && node.cmd != "for") {
            TemplateCommands_1.compileChildren(node, scope, this);
        }
    };
    TemplateCompiler.prototype.update = function () {
        var text = TemplateCommands_1.getChildrenString(this._root);
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
exports.TemplateCompiler = TemplateCompiler;


/***/ }),

/***/ 7:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function getChildrenString(node) {
    var result = "";
    var children = node.children;
    if (children) {
        for (var i = 0, len = children.length; i < len; i++) {
            result += children[i].value || "";
        }
    }
    return result;
}
exports.getChildrenString = getChildrenString;
function compileChildren(node, scope, compiler) {
    node.children.forEach(function (child) {
        compiler.compile(child, scope);
    }, this);
}
exports.compileChildren = compileChildren;
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
exports.commands = {
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
        var reg = /^\s*(\S+)\s+in\s+([\s\S]+?)\s*$/;
        var res = reg.exec(context.node.exp);
        if (!res) {
            console.error("for命令表达式错误：" + context.node.exp);
            return;
        }
        context.entity.createWatcher(context.node, res[2], context.scope, function (value) {
            // 如果是数字，构建一个数字列表
            if (typeof value == "number") {
                var temp = [];
                for (var i = 0; i < value; i++) {
                    temp.push(i);
                }
                value = temp;
            }
            var result = "";
            if (value) {
                var arrLength = (value instanceof Array ? value.length : -1);
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


/***/ })

/******/ });
});