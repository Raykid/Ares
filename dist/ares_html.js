(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ares_html"] = factory();
	else
		root["ares_html"] = factory();
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
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by Raykid on 2016/12/22.
 */
/**
 * 创建一个表达式求值方法，用于未来执行
 * @param exp 表达式
 * @returns {Function} 创建的方法
 */
function createEvalFunc(exp) {
    var func;
    try {
        func = Function("scope", "with(scope){return " + exp + "}");
    }
    catch (err) {
        // 可能是某些版本的解释器不认识模板字符串，将模板字符串变成普通字符串
        var sepStr = (exp.indexOf('"') < 0 ? '"' : "'");
        // 将exp中的·替换为'
        var reg = /([^\\]?)`/g;
        exp = exp.replace(reg, "$1" + sepStr);
        // 将exp中${...}替换为" + ... + "的形式
        reg = /\$\{(.*?)\}/g;
        exp = exp.replace(reg, sepStr + "+($1)+" + sepStr);
        // 重新生成方法并返回
        func = Function("scope", "with(scope){return " + exp + "}");
    }
    return func;
}
exports.createEvalFunc = createEvalFunc;
/**
 * 表达式求值，无法执行多条语句
 * @param exp 表达式
 * @param scope 表达式的作用域
 * @returns {any} 返回值
 */
function evalExp(exp, scope) {
    return createEvalFunc(exp)(scope);
}
exports.evalExp = evalExp;
/**
 * 创建一个执行方法，用于未来执行
 * @param exp 表达式
 * @returns {Function} 创建的方法
 */
function createRunFunc(exp) {
    return createEvalFunc("(function(){" + exp + "})()");
}
exports.createRunFunc = createRunFunc;
/**
 * 直接执行表达式，不求值。该方法可以执行多条语句
 * @param exp 表达式
 * @param scope 表达式的作用域
 */
function runExp(exp, scope) {
    createRunFunc(exp)(scope);
}
exports.runExp = runExp;


/***/ }),

/***/ 10:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Created by Raykid on 2016/12/22.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var HTMLCommands_1 = __webpack_require__(7);
var HTMLCompiler = (function () {
    function HTMLCompiler(selectorsOrElement) {
        this._selectorsOrElement = selectorsOrElement;
    }
    Object.defineProperty(HTMLCompiler.prototype, "root", {
        get: function () {
            return this._root;
        },
        enumerable: true,
        configurable: true
    });
    HTMLCompiler.prototype.init = function (entity) {
        if (typeof this._selectorsOrElement == "string")
            this._root = document.querySelector(this._selectorsOrElement);
        else
            this._root = this._selectorsOrElement;
        this._entity = entity;
        // 开始编译root节点
        this.compile(this._root, entity.data);
    };
    HTMLCompiler.prototype.compile = function (node, scope) {
        var cmdDict = {};
        if (node.nodeType == 3) {
            // 是个文本节点
            this.compileTextContent(node, scope, cmdDict);
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
                // 检测命令
                var data = this._entity.parseCommand(name, attr.value);
                if (data) {
                    // 判断是否是通用命令
                    var isCommonCmd = this._entity.testCommand(data);
                    // 用命令名取到Command
                    var cmd = HTMLCommands_1.commands[data.cmdName];
                    if (isCommonCmd || cmd) {
                        // 推入数组
                        cmdsToCompile.push({
                            attr: attr,
                            cmd: cmd,
                            ctx: {
                                scope: scope,
                                target: node,
                                compiler: this,
                                entity: this._entity,
                                cmdData: data,
                                cmdDict: cmdDict
                            }
                        });
                        // 如果是for或者if则设置懒编译
                        if (data.cmdName == "if" || data.cmdName == "for") {
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
                // 开始编译，优先通用命令
                var isCommonCmd = this._entity.execCommand(cmdToCompile.ctx.cmdData, cmdToCompile.ctx.target, cmdToCompile.ctx.scope);
                if (!isCommonCmd)
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
    HTMLCompiler.prototype.compileTextContent = function (node, scope, cmdDict) {
        if (HTMLCompiler._textRegExp.test(node.nodeValue)) {
            var exp = this.parseTextExp(node.nodeValue);
            HTMLCommands_1.textContent({
                scope: scope,
                target: node,
                compiler: this,
                entity: this._entity,
                cmdData: {
                    cmdName: "",
                    subCmd: "",
                    propName: "",
                    exp: exp
                },
                cmdDict: cmdDict
            });
        }
    };
    HTMLCompiler.prototype.parseTextExp = function (exp) {
        var reg = HTMLCompiler._textRegExp;
        for (var result = reg.exec(exp); result != null; result = reg.exec(exp)) {
            exp = result[1] + "${" + result[2] + "}" + result[3];
        }
        return "`" + exp + "`";
    };
    HTMLCompiler._textRegExp = /(.*?)\{\{(.*?)\}\}(.*)/;
    return HTMLCompiler;
}());
exports.HTMLCompiler = HTMLCompiler;


/***/ }),

/***/ 7:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Created by Raykid on 2016/12/22.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
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
        context.target.nodeValue = value;
    });
}
exports.textContent = textContent;
exports.commands = {
    /** 文本命令 */
    text: function (context) {
        context.entity.createWatcher(context.target, context.cmdData.exp, context.scope, function (value) {
            context.target.textContent = value;
        });
    },
    /** HTML文本命令 */
    html: function (context) {
        context.entity.createWatcher(context.target, context.cmdData.exp, context.scope, function (value) {
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
        context.entity.createWatcher(context.target, context.cmdData.exp, context.scope, function (params) {
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
        var cmdData = context.cmdData;
        var target = context.target;
        context.entity.createWatcher(context.target, cmdData.exp, context.scope, function (value) {
            if (cmdData.subCmd != "") {
                // 子命令形式
                target.setAttribute(cmdData.subCmd, value);
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
        var cmdData = context.cmdData;
        if (cmdData.subCmd != "") {
            var handler = context.scope[cmdData.exp] || window[context.cmdData.exp];
            if (typeof handler == "function") {
                // 是函数名形式
                context.target.addEventListener(cmdData.subCmd, handler.bind(context.scope));
            }
            else {
                // 是方法执行或者表达式方式
                context.target.addEventListener(cmdData.subCmd, function (evt) {
                    // 创建一个临时的子域，用于保存参数
                    var scope = Object.create(context.scope);
                    scope.$event = evt;
                    scope.$target = context.target;
                    Utils_1.runExp(cmdData.exp, scope);
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
        context.entity.createWatcher(context.target, context.cmdData.exp, context.scope, function (value) {
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
            var lastNode = null;
            var arrLength = (value instanceof Array ? value.length : -1);
            for (var key in value) {
                // 拷贝一个target
                var newNode = context.target.cloneNode(true);
                // 添加到显示里
                pNode.insertBefore(newNode, eNode);
                // 生成子域
                var newScope = Object.create(context.scope);
                // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响context.scope
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
    }
};


/***/ })

/******/ });
});