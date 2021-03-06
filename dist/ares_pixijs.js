(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ares_pixijs"] = factory();
	else
		root["ares_pixijs"] = factory();
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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* 1 */,
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/// <reference path="pixi.js.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
var PIXICommands_1 = __webpack_require__(6);
var _tplDict = {};
/**
 * 获取全局模板对象，该模板在任何地方都生效
 * @param name 模板名称
 * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
 */
function getTemplate(name) {
    return _tplDict[name];
}
exports.getTemplate = getTemplate;
/**
 * 设置全局模板对象，该模板在任何地方都生效
 * @param name 模板名称
 * @param tpl 模板对象
 * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
 */
function setTemplate(name, tpl) {
    // 非空判断
    if (!name || !tpl)
        return null;
    // 如果已经有了模板定义则返回null
    if (_tplDict[name])
        return null;
    // 添加模板定义
    _tplDict[name] = tpl;
    // 返回模板对象
    return tpl;
}
exports.setTemplate = setTemplate;
var PIXICompiler = (function () {
    /**
     * 创建PIXI绑定
     * @param root 根显示对象，从这里传入的绑定数据属性名必须以“a_”开头
     * @param renderer PIXI渲染器
     * @param config 绑定数据，从这里传入的绑定数据属性名可以不以“a_”开头
     * @param tplDict 模板字典，可以在这里给出模板定义表
     */
    function PIXICompiler(root, renderer, config, tplDict) {
        this._nameDict = {};
        this._root = root;
        this._renderer = renderer;
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
    Object.defineProperty(PIXICompiler.prototype, "renderer", {
        /** 获取PIXI渲染器 */
        get: function () {
            return this._renderer;
        },
        enumerable: true,
        configurable: true
    });
    PIXICompiler.prototype.parseCmd = function (node) {
        // 取到属性列表
        var datas = [];
        var data;
        for (var t in node) {
            data = this._entity.parseCommand(t, node[t]);
            if (data)
                datas.push(data);
        }
        // 把配置中的属性推入属性列表中
        var conf = (this._config && this._config[node.name]);
        for (var t in conf) {
            if (t.indexOf("a-") != 0 && t.indexOf("a_") != 0)
                t = "a-" + t;
            data = this._entity.parseCommand(t, node[t]);
            if (data)
                datas.push(data);
        }
        // 开始遍历属性列表
        var cmdNameDict = {};
        for (var i = 0, len = datas.length; i < len; i++) {
            data = datas[i];
            // 填充字典
            if (!cmdNameDict[data.cmdName])
                cmdNameDict[data.cmdName] = [];
            cmdNameDict[data.cmdName].push(data);
        }
        return cmdNameDict;
    };
    PIXICompiler.prototype.parseTpl = function (node) {
        var tplName = node["a-tplName"] || node["a_tplName"];
        if (tplName) {
            var callback = function () {
                // 移除tpl相关属性
                delete node["a-tplName"];
                delete node["a_tplName"];
                delete node["a-tplGlobal"];
                delete node["a_tplGlobal"];
                // 将这个节点从显示列表中移除
                node.parent && node.parent.removeChild(node);
            };
            if (node["a-tplGlobal"] == "true" || node["a_tplGlobal"] == "true") {
                if (setTemplate(tplName, node)) {
                    callback();
                    return true;
                }
            }
            else {
                if (this.setTemplate(tplName, node)) {
                    callback();
                    return true;
                }
            }
        }
        return false;
    };
    PIXICompiler.prototype.init = function (entity) {
        this._entity = entity;
        // 开始编译root节点
        this.compile(this._root, entity.data);
    };
    PIXICompiler.prototype.compile = function (node, scope) {
        // 首先判断是否是模板，是的话就设置模板，但是不编译
        if (this.parseTpl(node))
            return;
        // 开始编译
        var hasLazyCompile = false;
        // 如果有名字就记下来
        var name = node.name;
        if (name)
            this._nameDict[name] = node;
        // 开始遍历属性列表
        var cmdDict = this.parseCmd(node);
        var cmdsToCompile = [];
        // 设置label，以便跳出双重循环
        flag: for (var cmdName in cmdDict) {
            var cmdDatas = cmdDict[cmdName];
            for (var i = 0, len = cmdDatas.length; i < len; i++) {
                var cmdData = cmdDatas[i];
                var isCommonCmd = this._entity.testCommand(cmdData);
                // 用命令名取到Command
                var cmd = PIXICommands_1.commands[cmdName];
                // 如果没有找到命令，则认为是自定义命令，套用prop命令
                if (!isCommonCmd && !cmd) {
                    cmdData.cmdName = "prop";
                    cmdData.subCmd = cmdName || "";
                    cmd = PIXICommands_1.commands[cmdData.cmdName];
                }
                // 推入数组
                var cmdToCompile = {
                    propName: cmdData.propName,
                    cmd: cmd,
                    ctx: {
                        scope: scope,
                        target: node,
                        compiler: this,
                        entity: this._entity,
                        cmdData: cmdData,
                        cmdDict: cmdDict
                    }
                };
                // 如果是tpl命令则需要提前
                if (cmdData.cmdName == "tpl")
                    cmdsToCompile.unshift(cmdToCompile);
                else
                    cmdsToCompile.push(cmdToCompile);
                // 如果是for或者if则设置懒编译
                if (cmdData.cmdName == "if" || cmdData.cmdName == "for") {
                    hasLazyCompile = true;
                    // 清空数组，仅留下自身的编译
                    cmdsToCompile.splice(0, cmdsToCompile.length - 1);
                    // 跳出双重循环
                    break flag;
                }
            }
        }
        // 开始编译当前节点外部结构
        for (var i = 0, len = cmdsToCompile.length; i < len; i++) {
            var cmdToCompile = cmdsToCompile[i];
            // 更新target属性
            cmdToCompile.ctx.target = node;
            // 移除属性
            delete cmdToCompile.ctx.target[cmdToCompile.propName];
            // 开始编译，首先尝试执行通用命令
            var isCommonCmd = this._entity.execCommand(cmdToCompile.ctx.cmdData, node, scope);
            // 如果是通用命令则不再继续执行，否则按照特殊命令执行
            if (!isCommonCmd)
                node = cmdToCompile.cmd(cmdToCompile.ctx);
        }
        // 如果没有懒编译则编译内部结构
        if (!hasLazyCompile) {
            // 如果是文本对象，则进行文本内容编译
            if (node instanceof PIXI.Text) {
                this.compileTextContent(node, scope, cmdDict);
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
     * 获取模板对象，该模板只在该PIXICompiler内部生效
     * @param name 模板名称
     * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
     */
    PIXICompiler.prototype.getTemplate = function (name) {
        return this._tplDict[name];
    };
    /**
     * 设置模板，该模板只在该PIXICompiler内部生效
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
    PIXICompiler.prototype.compileTextContent = function (text, scope, cmdDict) {
        var value = text.text;
        if (PIXICompiler._textRegExp.test(value)) {
            var exp = this.parseTextExp(value);
            PIXICommands_1.textContent({
                scope: scope,
                target: text,
                compiler: this,
                entity: this._entity,
                cmdData: {
                    cmdName: "textContent",
                    subCmd: "",
                    propName: "",
                    exp: exp
                },
                cmdDict: cmdDict
            });
        }
    };
    PIXICompiler.prototype.parseTextExp = function (exp) {
        var reg = PIXICompiler._textRegExp;
        for (var result = reg.exec(exp); result != null; result = reg.exec(exp)) {
            exp = result[1] + "${" + result[2] + "}" + result[3];
        }
        return "`" + exp + "`";
    };
    PIXICompiler._textRegExp = /(.*?)\{\{(.*?)\}\}(.*)/;
    return PIXICompiler;
}());
exports.PIXICompiler = PIXICompiler;


/***/ }),
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var PIXICompiler_1 = __webpack_require__(2);
var Utils_1 = __webpack_require__(0);
var ViewPortHandler_1 = __webpack_require__(12);
var PIXIUtils_1 = __webpack_require__(11);
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


/***/ }),
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

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
 * 判断两个矩形是否相等
 * @param rect1 矩形1
 * @param rect2 矩形2
 * @return {boolean} 是否相等
 */
function rectEquals(rect1, rect2) {
    return (rect1.x == rect2.x &&
        rect1.y == rect2.y &&
        rect1.width == rect2.width &&
        rect1.height == rect2.height);
}
exports.rectEquals = rectEquals;
/**
 * 判断矩形范围是否为0
 * @param rect 矩形
 * @return {boolean} 矩形范围是否为0（宽度或高度为0）
 */
function rectEmpty(rect) {
    return (rect.width <= 0 || rect.height <= 0);
}
exports.rectEmpty = rectEmpty;
/**
 * 获取显示对象的全局范围
 * @param target 显示对象
 * @return {PIXI.Rectangle} 显示对象的全局范围
 */
function getGlobalBounds(target) {
    var bounds = target.getLocalBounds(new PIXI.Rectangle());
    var pos = target.getGlobalPosition(new PIXI.Point());
    bounds.x += pos.x;
    bounds.y += pos.y;
    return bounds;
}
exports.getGlobalBounds = getGlobalBounds;
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
            result[key] = new Float32Array(target[key]);
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


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THRESHOLD_DRAGGING = 3;
var ELASTICITY_COEFFICIENT = 1;
var FRICTION_COEFFICIENT = 0.01;
function shifting(to, from) {
    var x = to.x - from.x;
    var y = to.y - from.y;
    return {
        x: x,
        y: y,
        distance: Math.sqrt(x * x + y * y)
    };
}
var ViewPortHandler = (function () {
    function ViewPortHandler(target, options) {
        this._movableH = false;
        this._movableV = false;
        this._dragging = false;
        this._direction = 0;
        this._observers = [];
        this._target = target;
        this._options = options || {};
        this._viewPort = new PIXI.Rectangle();
        this._ticker = new PIXI.ticker.Ticker();
        this._ticker.add(this.onTick, this);
        this._speed = new PIXI.Point();
        // 生成一个遮罩物体
        this._masker = new PIXI.Graphics();
        target.mask = this._masker;
        // 添加监听
        target.interactive = true;
        target.on("pointerdown", this.onPointerDown, this);
        target.on("pointermove", this.onPointerMove, this);
        // 记录绑定this的引用
        this._onPointerUp = this.onPointerUp.bind(this);
    }
    Object.defineProperty(ViewPortHandler.prototype, "viewportGlobal", {
        /** 获取全局视窗范围 */
        get: function () {
            return this._viewPortGlobal;
        },
        enumerable: true,
        configurable: true
    });
    ViewPortHandler.prototype.onPointerDown = function (evt) {
        if (!this._downTarget) {
            // 初始化状态
            this._downTarget = evt.target;
            this._dragging = false;
            this._direction = 0;
            this._speed.set(0, 0);
            // 设置移动性
            this._movableH = !this._options.lockV && (this._target["width"] || 0) > this._viewPort.width;
            this._movableV = !this._options.lockH && (this._target["height"] || 0) > this._viewPort.height;
            // 记录最后点位置
            this._downPoint = this._lastPoint = evt.data.global.clone();
            // 记录最后时刻
            this._lastTime = Date.now();
            // 对目标对象实施抬起监听
            this._downTarget.on("mouseup", this.onTargetPointerUp, this);
            this._downTarget.on("mouseupoutside", this.onTargetPointerUp, this);
            this._downTarget.on("pointerup", this.onTargetPointerUp, this);
            this._downTarget.on("pointerupoutside", this.onTargetPointerUp, this);
            window.addEventListener("mouseup", this._onPointerUp, true);
            window.addEventListener("touchend", this._onPointerUp, true);
        }
    };
    ViewPortHandler.prototype.onPointerMove = function (evt) {
        if (this._downTarget) {
            // 计算位移
            var nowPoint = evt.data.global.clone();
            var s = shifting(nowPoint, this._lastPoint);
            // 如果移动距离超过THRESHOLD_DRAGGING像素则认为是移动了
            if (!this._dragging && shifting(nowPoint, this._downPoint).distance > THRESHOLD_DRAGGING) {
                this._dragging = true;
            }
            // 判断移动方向
            if (this._direction == 0 && s.distance > 0) {
                if (this._options && this._options.oneway) {
                    if (!this._movableV || (this._movableH && Math.abs(s.x) > Math.abs(s.y)))
                        this._direction = ViewPortHandler.DIRECTION_H;
                    else
                        this._direction = ViewPortHandler.DIRECTION_V;
                }
                else {
                    this._direction = ViewPortHandler.DIRECTION_H | ViewPortHandler.DIRECTION_V;
                }
            }
            var dirH = (this._direction & ViewPortHandler.DIRECTION_H) > 0;
            var dirV = (this._direction & ViewPortHandler.DIRECTION_V) > 0;
            // 移动物体
            var sx = 0, sy = 0;
            if (dirH)
                sx = s.x;
            if (dirV)
                sy = s.y;
            this.moveTarget(sx, sy);
            // 记录本次坐标
            this._lastPoint = nowPoint;
            // 计算运动速度
            var nowTime = Date.now();
            var deltaTime = nowTime - this._lastTime;
            this._speed.set(dirH && this._movableH ? s.x / deltaTime * 5 : 0, dirV && this._movableV ? s.y / deltaTime * 5 : 0);
            // 记录最后时刻
            this._lastTime = nowTime;
        }
    };
    ViewPortHandler.prototype.onTargetPointerUp = function (evt) {
        if (this._downTarget) {
            // 移除抬起监听
            this._downTarget.off("mouseup", this.onTargetPointerUp, this);
            this._downTarget.off("mouseupoutside", this.onTargetPointerUp, this);
            this._downTarget.off("pointerup", this.onTargetPointerUp, this);
            this._downTarget.off("pointerupoutside", this.onTargetPointerUp, this);
            // 如果按下时有移动，则禁止抬起事件继续向下传递
            if (this._dragging)
                evt.stopPropagation();
        }
    };
    ViewPortHandler.prototype.onPointerUp = function (evt) {
        if (this._downTarget) {
            // 移除抬起监听
            window.removeEventListener("mouseup", this._onPointerUp, true);
            window.removeEventListener("touchend", this._onPointerUp, true);
            // 如果按下时有移动，则禁止抬起事件继续向下传递
            if (this._dragging)
                evt.stopPropagation();
            // 重置状态
            this._downTarget = null;
            this._dragging = false;
            // 开始缓动
            this.homing(true);
        }
    };
    ViewPortHandler.prototype.getContentBounds = function (targetX, targetY) {
        var bounds = this._target.getLocalBounds();
        bounds.x += targetX;
        bounds.y += targetY;
        return bounds;
    };
    ViewPortHandler.prototype.getDelta = function (targetX, targetY) {
        var bounds = this.getContentBounds(targetX, targetY);
        // 计算横向偏移
        var deltaX = 0;
        if (bounds.left > this._viewPort.left)
            deltaX = this._viewPort.left - bounds.left;
        else if (bounds.left < this._viewPort.left && bounds.right < this._viewPort.right)
            deltaX = Math.min(this._viewPort.left - bounds.left, this._viewPort.right - bounds.right);
        // 计算纵向偏移
        var deltaY = 0;
        if (bounds.top > this._viewPort.top)
            deltaY = this._viewPort.top - bounds.top;
        else if (bounds.top < this._viewPort.top && bounds.bottom < this._viewPort.bottom)
            deltaY = Math.min(this._viewPort.top - bounds.top, this._viewPort.bottom - bounds.bottom);
        // 返回结果
        return { x: deltaX, y: deltaY };
    };
    ViewPortHandler.prototype.moveTarget = function (x, y) {
        if (this._movableH || this._movableV) {
            // 停止归位缓动
            this._ticker.stop();
            // 如果超过范围则需要进行阻尼递减
            var d = this.getDelta(this._target.x, this._target.y);
            // 开始移动
            var pos = this._target.position;
            if (this._movableH)
                pos.x += (d.x != 0 ? x * 0.33 / ELASTICITY_COEFFICIENT : x);
            if (this._movableV)
                pos.y += (d.y != 0 ? y * 0.33 / ELASTICITY_COEFFICIENT : y);
            // 更新位置
            this._target.position = pos;
            // 通知观察者
            this.notify();
        }
    };
    ViewPortHandler.prototype.onTick = function (delta) {
        // 进行合法性判断
        if (this._target["_destroyed"]) {
            this._ticker.stop();
            this._direction = 0;
            return;
        }
        // 如果已经超出范围则直接复位，否则继续运动
        var d = this.getDelta(this._target.x, this._target.y);
        var doneX = false;
        var doneY = false;
        // 横向
        if (d.x != 0) {
            if (!this._options.damping) {
                // 不进行阻尼复位，瞬移复位
                this._target.x += d.x;
                this._speed.x = 0;
                doneX = true;
            }
            else if (this._speed.x != 0) {
                // 超出范围减速中
                this._target.x += this._speed.x * delta;
                var speedX = this._speed.x + d.x * ELASTICITY_COEFFICIENT * 0.01 * delta;
                // 如果速度反向了，则说明到头了，直接设为0
                this._speed.x = (speedX * this._speed.x < 0 ? 0 : speedX);
            }
            else {
                // 开始横向复位
                var moveX = d.x * delta * 0.07 * ELASTICITY_COEFFICIENT;
                if (moveX != 0)
                    this._target.x += moveX;
            }
        }
        else if (!!this._options.damping) {
            if (this._speed.x != 0) {
                // 未超范围，阻尼减速
                this._target.x += this._speed.x * delta;
                this._speed.x = this._speed.x * (1 - FRICTION_COEFFICIENT);
                if (Math.abs(this._speed.x) < 0.5)
                    this._speed.x = 0;
            }
            else {
                doneX = true;
            }
        }
        else {
            this._speed.x = 0;
            doneX = true;
        }
        // 纵向
        if (d.y != 0) {
            if (!this._options.damping) {
                // 不进行阻尼复位，瞬移复位
                this._target.y += d.y;
                this._speed.y = 0;
                doneY = true;
            }
            else if (this._speed.y != 0) {
                // 超出范围减速中
                this._target.y += this._speed.y * delta;
                var speedY = this._speed.y + d.y * ELASTICITY_COEFFICIENT * 0.01 * delta;
                // 如果速度反向了，则说明到头了，直接设为0
                this._speed.y = (speedY * this._speed.y < 0 ? 0 : speedY);
            }
            else {
                // 开始纵向复位
                var moveY = d.y * delta * 0.07 * ELASTICITY_COEFFICIENT;
                if (moveY != 0)
                    this._target.y += moveY;
            }
        }
        else if (!!this._options.damping) {
            if (this._speed.y != 0) {
                // 未超范围，阻尼减速
                this._target.y += this._speed.y * delta;
                this._speed.y = this._speed.y * (1 - FRICTION_COEFFICIENT);
                if (Math.abs(this._speed.y) < 0.5)
                    this._speed.y = 0;
            }
            else {
                doneY = true;
            }
        }
        else {
            this._speed.y = 0;
            doneY = true;
        }
        // 通知观察者
        this.notify();
        // 停止tick
        if (doneX && doneY) {
            this._ticker.stop();
            // 重置方向
            this._direction = 0;
        }
    };
    /**
     * 获取全局范围
     * @return 全局范围
     */
    ViewPortHandler.prototype.getGlocalBounds = function () {
        var pos = this._target.parent.getGlobalPosition();
        var bounds = this._viewPort.clone();
        bounds.x += (pos.x - this._target.x);
        bounds.y += (pos.y - this._target.y);
        return bounds;
    };
    ViewPortHandler.prototype.notify = function () {
        // 这里通知所有观察者位置变更
        for (var i = 0, len = this._observers.length; i < len; i++) {
            var observer = this._observers[i];
            if (observer)
                observer(this);
        }
    };
    /**
     * 观察移动
     * @param observer 观察者
     */
    ViewPortHandler.prototype.observe = function (observer) {
        if (this._observers.indexOf(observer) < 0)
            this._observers.push(observer);
    };
    /**
     * 停止观察移动
     * @param observer 观察者
     */
    ViewPortHandler.prototype.unobserve = function (observer) {
        var index = this._observers.indexOf(observer);
        if (index >= 0)
            this._observers.splice(index, 1);
    };
    /**
     * 设置视点范围
     * @param x 视点横坐标
     * @param y 视点纵坐标
     * @param width 视点宽度
     * @param height 视点高度
     */
    ViewPortHandler.prototype.setViewPort = function (x, y, width, height) {
        this._viewPort.x = x;
        this._viewPort.y = y;
        this._viewPort.width = width;
        this._viewPort.height = height;
        this._viewPortGlobal = this.getGlocalBounds();
        // 如果masker的父容器不是当前target的父容器则将masker移动过去
        if (this._masker.parent != this._target.parent && this._target.parent) {
            this._target.parent.addChild(this._masker);
        }
        // 绘制遮罩
        this._masker.clear();
        this._masker.beginFill(0);
        this._masker.drawRect(x, y, width, height);
        this._masker.endFill();
        // 瞬移归位
        this.homing(false);
        // 为当前显示对象设置viewport范围
        this._target["__ares_viewport__"] = this;
        // 通知观察者
        this.notify();
    };
    /**
     * 归位内容
     * @param tween 是否使用缓动归位，默认使用
     */
    ViewPortHandler.prototype.homing = function (tween) {
        if (tween) {
            this._ticker.start();
        }
        else {
            var d = this.getDelta(this._target.x, this._target.y);
            this._target.x += d.x;
            this._target.y += d.y;
        }
    };
    ViewPortHandler.DIRECTION_H = 1;
    ViewPortHandler.DIRECTION_V = 2;
    return ViewPortHandler;
}());
exports.ViewPortHandler = ViewPortHandler;


/***/ })
/******/ ]);
});