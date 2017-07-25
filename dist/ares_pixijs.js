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
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
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
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
/**
 * Created by Raykid on 2016/12/22.
 * 数据更新订阅者，当依赖的数据有更新时会触发callback通知外面
 */
var Watcher = (function () {
    function Watcher(entity, target, exp, scope, callback) {
        this._disposed = false;
        // 记录entity
        this._entity = entity;
        // 生成一个全局唯一的ID
        this._uid = Watcher._uid++;
        // 记录作用目标、表达式和作用域
        this._target = target;
        this._exp = exp;
        this._scope = scope;
        // 将表达式和作用域解析为一个Function
        this._expFunc = Utils_1.createEvalFunc(exp);
        // 记录回调函数
        this._callback = callback;
        // 进行首次更新
        this.update();
    }
    Object.defineProperty(Watcher.prototype, "uid", {
        /** 获取Watcher的全局唯一ID */
        get: function () {
            return this._uid;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 获取到表达式当前最新值
     * @returns {any} 最新值
     */
    Watcher.prototype.getValue = function () {
        if (this._disposed)
            return null;
        var value = null;
        // 记录自身
        Watcher.updating = this;
        // 设置通用属性
        // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响context.scope
        Object.defineProperty(this._scope, "$root", {
            configurable: true,
            enumerable: false,
            value: this._entity.compiler.root,
            writable: false
        });
        // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响context.scope
        Object.defineProperty(this._scope, "$target", {
            configurable: true,
            enumerable: false,
            value: this._target,
            writable: false
        });
        // 表达式求值
        try {
            value = this._expFunc.call(this._scope, this._scope);
        }
        catch (err) {
            // 输出错误日志
            console.warn("表达式求值错误\nerr: " + err.toString() + "\nexp：" + this._exp + "，scope：" + JSON.stringify(this._scope));
        }
        // 移除通用属性
        delete this._scope["$root"];
        delete this._scope["$target"];
        // 移除自身记录
        Watcher.updating = null;
        return value;
    };
    /**
     * 当依赖的数据有更新时调用该方法
     * @param extra 可能的额外数据
     */
    Watcher.prototype.update = function (extra) {
        if (this._disposed)
            return;
        var value = this.getValue();
        if (!Watcher.isEqual(value, this._value)) {
            this._callback && this._callback(value, this._value, extra);
            this._value = Watcher.deepCopy(value);
        }
    };
    /** 销毁订阅者 */
    Watcher.prototype.dispose = function () {
        if (this._disposed)
            return;
        this._value = null;
        this._target = null;
        this._exp = null;
        this._scope = null;
        this._expFunc = null;
        this._callback = null;
        this._disposed = true;
    };
    /**
     * 是否相等，包括基础类型和对象/数组的对比
     */
    Watcher.isEqual = function (a, b) {
        return (a == b || (Watcher.isObject(a) && Watcher.isObject(b)
            ? JSON.stringify(a) == JSON.stringify(b)
            : false));
    };
    /**
     * 是否为对象(包括数组、正则等)
     */
    Watcher.isObject = function (obj) {
        return (obj && typeof obj == "object");
    };
    /**
     * 复制对象，若为对象则深度复制
     */
    Watcher.deepCopy = function (from) {
        if (Watcher.isObject(from)) {
            // 复杂类型对象，先字符串化，再对象化
            return JSON.parse(JSON.stringify(from));
        }
        else {
            // 基本类型对象，直接返回之
            return from;
        }
    };
    /** 记录当前正在执行update方法的Watcher引用 */
    Watcher.updating = null;
    Watcher._uid = 0;
    return Watcher;
}());
exports.Watcher = Watcher;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Created by Raykid on 2017/7/19.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
exports.commands = {
    /** 一次性设置变量命令，在数据中插入一个变量 */
    set: function (context) {
        // 设置变量值
        Utils_1.runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
        return context.target;
    },
    /** 绑定设置变量命令，在数据中插入一个变量（如果不提供子命令则不插入变量），并根据表达式的值同步更新变量的值 */
    bind: function (context) {
        // 创建订阅器，监听表达式值变化
        context.entity.createWatcher(context.target, context.data.exp, context.scope, function (value) {
            // 如果子命令不为空，则更新变量值
            if (context.data.subCmd)
                Utils_1.runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
        });
        return context.target;
    }
};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Created by Raykid on 2016/12/22.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Watcher_1 = __webpack_require__(1);
var Dep_1 = __webpack_require__(5);
var Mutator = (function () {
    function Mutator() {
    }
    /**
     * 将用户传进来的数据“变异”成为具有截获数据变更能力的数据
     * @param data 原始数据
     * @returns {any} 变异后的数据
     */
    Mutator.mutate = function (data) {
        // 如果是简单类型，则啥也不做
        if (!data || typeof data != "object")
            return;
        // 是个复杂类型对象，但是以前变异过了就不再重做一遍了
        if (!data.__ares_mutated__) {
            // 针对每个内部变量都进行一次变异
            for (var key in data) {
                Mutator.mutateObject(data, key, data[key]);
            }
            // 打一个标记表示已经变异过了
            Object.defineProperty(data, "__ares_mutated__", {
                value: true,
                writable: false,
                enumerable: false,
                configurable: false
            });
        }
        return data;
    };
    Mutator.mutateObject = function (data, key, value) {
        // 对每个复杂类型对象都要有一个对应的依赖列表
        var dep = new Dep_1.Dep();
        // 变异过程
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                // 如果Watcher.updating不是null，说明当前正在执行表达式，那么获取的变量自然是其需要依赖的
                var watcher = Watcher_1.Watcher.updating;
                if (watcher)
                    dep.watch(watcher);
                // 利用闭包保存原始值
                return value;
            },
            set: function (v) {
                if (v == value)
                    return;
                value = v;
                // 如果是数组就走专门的数组变异方法，否则递归变异对象
                if (Array.isArray(v))
                    Mutator.mutateArray(v, dep);
                else
                    Mutator.mutate(v);
                // 触发通知
                dep.notify();
            }
        });
        // 递归变异
        Mutator.mutate(value);
    };
    Mutator.mutateArray = function (arr, dep) {
        // 变异当前数组
        arr["__proto__"] = Mutator.defineReactiveArray(dep);
        // 遍历当前数组，将内容对象全部变异
        for (var i = 0, len = arr.length; i < len; i++) {
            Mutator.mutate(arr[i]);
        }
    };
    Mutator.defineReactiveArray = function (dep) {
        var proto = Array.prototype;
        var result = Object.create(proto);
        // 遍历所有方法，一个一个地变异
        Mutator._arrMethods.forEach(function (method) {
            // 利用闭包记录一个原始方法
            var oriMethod = proto[method];
            // 开始变异
            Object.defineProperty(result, method, {
                value: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    // 首先调用原始方法，获取返回值
                    var result = oriMethod.apply(this, args);
                    // 数组插入项
                    var inserted;
                    switch (method) {
                        case "push":
                        case "unshift":
                            inserted = args;
                            break;
                        case "splice":
                            inserted = args.slice(2);
                            break;
                    }
                    // 监视数组插入项，而不是重新监视整个数组
                    if (inserted && inserted.length) {
                        Mutator.mutateArray(inserted, dep);
                    }
                    // 触发更新
                    dep.notify({ method: args });
                    // 返回值
                    return result;
                }
            });
        });
        // 提供替换数组设置的方法，因为直接设置数组下标的方式无法变异
        Object.defineProperty(result, "$set", {
            value: function (index, value) {
                // 超出数组长度默认追加到最后
                if (index >= this.length)
                    index = this.length;
                return this.splice(index, 1, value)[0];
            }
        });
        // 提供替换数组移除的方法，因为直接移除的方式无法变异
        Object.defineProperty(result, "$remove", {
            value: function (item) {
                var index = this.indexOf(item);
                if (index > -1)
                    return this.splice(index, 1);
                return null;
            }
        });
        return result;
    };
    // 记录数组中会造成数据更新的所有方法名
    Mutator._arrMethods = [
        "push",
        "pop",
        "unshift",
        "shift",
        "splice",
        "sort",
        "reverse"
    ];
    return Mutator;
}());
exports.Mutator = Mutator;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Created by Raykid on 2016/12/16.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Mutator_1 = __webpack_require__(3);
var Watcher_1 = __webpack_require__(1);
var Commands_1 = __webpack_require__(2);
exports.defaultCmdRegExp = /^(data\-)?a[\-_](\w+)([:\$](.+))?$/;
/**
 * 将数据模型和视图进行绑定
 * @param model 数据模型
 * @param compiler 视图解析器，不同类型的视图需要使用不同的解析器解析后方可使用
 * @param options 一些额外参数
 * @returns {core.AresEntity} 绑定实体对象
 */
function bind(data, compiler, options) {
    return new Ares(data, compiler, options);
}
exports.bind = bind;
var Ares = (function () {
    function Ares(data, compiler, options) {
        // 记录变异对象
        this._data = Mutator_1.Mutator.mutate(data);
        this._compiler = compiler;
        this._options = options;
        // 初始化Compiler
        this._compiler.init(this);
        // 调用回调
        if (this._options && this._options.inited) {
            this._options.inited.call(this._data, this);
        }
    }
    Object.defineProperty(Ares.prototype, "data", {
        /** 获取ViewModel */
        get: function () {
            return this._data;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Ares.prototype, "compiler", {
        /** 获取编译器 */
        get: function () {
            return this._compiler;
        },
        enumerable: true,
        configurable: true
    });
    Ares.prototype.createWatcher = function (target, exp, scope, callback) {
        return new Watcher_1.Watcher(this, target, exp, scope, callback);
    };
    /**
     * 解析表达式成为命令数据
     * @param key 属性名，合法的属性名应以a-或a_开头，以:或$分隔主命令和子命令
     * @param value 属性值，如果属性名合法则会被用来作为表达式的字符串
     * @param cmdRegExp 可选，如果不传则使用默认的命令正则表达式解析命令
     * @return {CommandData|null} 命令数据，如果不是命令则返回null
     */
    Ares.prototype.parseCommand = function (key, value, cmdRegExp) {
        var result = (cmdRegExp || exports.defaultCmdRegExp).exec(key);
        if (!result)
            return null;
        // 取到key
        var key = result[0];
        // 取到命令名
        var cmdName = result[2];
        // 取到命令字符串
        var exp = value;
        // 取到子命令名
        var subCmd = result[4] || "";
        // 返回结构体
        return {
            cmdName: cmdName,
            subCmd: subCmd,
            propName: key,
            exp: exp
        };
    };
    /**
     * 测试是否是通用命令
     * @param data 命令数据
     * @return {boolean} 返回一个布尔值，表示该表达式是否是通用命令
     */
    Ares.prototype.testCommand = function (data) {
        // 非空判断
        if (!data)
            return false;
        // 取到通用命令
        var cmd = Commands_1.commands[data.cmdName];
        return (cmd != null);
    };
    /**
     * 执行通用命令，如果该表达式是通用命令则直接执行，否则什么都不做
     * @param data 命令数据
     * @param target 目标对象
     * @param scope 变量作用域
     * @return {boolean} 返回一个布尔值，表示该表达式是否是通用命令
     */
    Ares.prototype.execCommand = function (data, target, scope) {
        // 非空判断
        if (!data || !scope)
            return false;
        // 取到通用命令
        var cmd = Commands_1.commands[data.cmdName];
        // 没找到命令就返回false
        if (!cmd)
            return false;
        // 找到命令了，执行之
        cmd({
            target: target,
            scope: scope,
            entity: this,
            data: data
        });
        return true;
    };
    return Ares;
}());
exports.Ares = Ares;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Created by Raykid on 2016/12/22.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Dep = (function () {
    function Dep() {
        this._map = {};
    }
    /**
     * 添加数据变更订阅者
     * @param watcher 数据变更订阅者
     */
    Dep.prototype.watch = function (watcher) {
        if (!this._map[watcher.uid]) {
            this._map[watcher.uid] = watcher;
        }
    };
    /**
     * 数据变更，通知所有订阅者
     * @param extra 可能的额外数据
     */
    Dep.prototype.notify = function (extra) {
        for (var uid in this._map) {
            var watcher = this._map[uid];
            watcher.update(extra);
        }
    };
    return Dep;
}());
exports.Dep = Dep;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/// <reference path="pixi.js.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
var PIXICommands_1 = __webpack_require__(8);
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
/* 7 */,
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var PIXICompiler_1 = __webpack_require__(6);
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
        template = PIXIUtils_1.PIXIUtils.cloneObject(template, true);
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
        var options = Utils_1.evalExp(cmdData.subCmd, context.scope) || {};
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
        // 记录循环数据
        var forDatas = [];
        // 记录viewport数据
        var viewportData;
        // 记录viewport范围
        var globalRange;
        // 记录顺序窗口范围，左闭右开
        var orderRange;
        // 添加订阅
        var watcher = context.entity.createWatcher(context.target, arrName, forScope, function (value) {
            // 如果refNode被从显示列表移除了，则表示该for指令要作废了
            if (!parent.parent) {
                watcher.dispose();
                return;
            }
            // 如果是数字，构建一个数字列表
            if (typeof value == "number") {
                var temp = [];
                for (var i = 0; i < value; i++) {
                    temp.push(i);
                }
                value = temp;
            }
            // 清理循环数据，并回收显示对象
            for (var i = 0, len = forDatas.length; i < len; i++) {
                var forData = forDatas.pop();
                if (forData.target)
                    PIXIUtils_1.PIXIUtils.returnObject(forData.target);
            }
            // 获取隐藏背景，没有就创建一个
            var bg;
            if (parent.children.length == 1)
                bg = parent.getChildAt(0);
            else if (parent.children.length > 1)
                throw new Error("for容器里出现了不明对象");
            if (!bg) {
                bg = new PIXI.Graphics();
                parent.addChildAt(bg, 0);
            }
            // 记录viewport在本地的范围
            if (viewportData) {
                globalRange = viewportData.globalRange.clone();
            }
            else {
                globalRange = new PIXI.Rectangle(0, 0, context.compiler.renderer.width, context.compiler.renderer.height);
            }
            // 开始遍历，并记录最大显示范围
            var maxRange = null;
            var isArray = (value instanceof Array);
            var arrLength = (isArray ? value.length : -1);
            orderRange = (!options.chaos && isArray ? { begin: Number.MAX_VALUE, end: -1 } : null);
            forData = null;
            for (var key in value) {
                // 生成新节点
                var newOne = generateOne(key, value, arrLength, forData && forData.target);
                var newScope = newOne.scope;
                var newNode = newOne.node;
                // 更新最大范围
                var newRange = new PIXI.Rectangle(newNode.x, newNode.y, newNode["width"], newNode["height"]);
                maxRange ? maxRange.enlarge(newRange) : maxRange = newRange;
                // 如果上一个节点不在viewport范围内，则回收之
                testReturn(forData, orderRange);
                // 记录forData
                var forData = {
                    key: key,
                    value: value,
                    data: newScope,
                    bounds: new PIXI.Rectangle(),
                    parent: parent,
                    target: newNode
                };
                // 记录本地位置
                newNode.getBounds(null, forData.bounds);
                var parentGlobalPosition = parent.getGlobalPosition();
                forData.bounds.x -= parentGlobalPosition.x;
                forData.bounds.y -= parentGlobalPosition.y;
                forDatas.push(forData);
            }
            // 如果最后一个节点也不在viewport范围内，也要回收之
            testReturn(forData, orderRange);
            // 如果orderRange不合法，则设置为null
            if (orderRange && orderRange.begin >= orderRange.end)
                orderRange = null;
            // 更新背景范围
            bg.clear();
            if (maxRange) {
                bg.beginFill(0, 0);
                bg.drawRect(maxRange.x, maxRange.y, maxRange.width, maxRange.height);
                bg.endFill();
            }
        });
        // 使用原始显示对象编译一次parent
        context.compiler.compile(parent, forScope);
        // 记录viewport数据
        viewportData = PIXIUtils_1.PIXIUtils.getViewportData(parent);
        if (viewportData) {
            // 记录范围
            globalRange = viewportData.globalRange.clone();
            // 监听viewport滚动
            viewportData.observe(updateView);
        }
        // 返回节点
        return context.target;
        function generateOne(key, value, len, lastNode) {
            // 拷贝一个target
            var newNode = PIXIUtils_1.PIXIUtils.borrowObject(context.target);
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
            if (len >= 0) {
                Object.defineProperty(newScope, "$length", {
                    configurable: true,
                    enumerable: false,
                    value: len,
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
            // 返回
            return { scope: newScope, node: newNode };
        }
        function testInViewPort(forData) {
            var parentGlobalPosition = forData.parent.getGlobalPosition();
            var tempRect = forData.bounds.clone();
            tempRect.x += parentGlobalPosition.x;
            tempRect.y += parentGlobalPosition.y;
            tempRect = PIXIUtils_1.PIXIUtils.rectCross(tempRect, globalRange);
            return (tempRect.width * tempRect.height != 0);
        }
        function testReturn(forData, orderRange) {
            if (forData && forData.target) {
                var index = parseInt(forData.key);
                if (!testInViewPort(forData)) {
                    // 不在范围内，回收
                    PIXIUtils_1.PIXIUtils.returnObject(forData.target);
                    forData.target = null;
                    // 缩小窗口
                    if (index <= orderRange.begin)
                        orderRange.begin = index + 1;
                    else if (orderRange.end > index)
                        orderRange.end = index;
                }
                else {
                    // 在范围内，扩充窗口
                    if (orderRange) {
                        if (orderRange.begin > index)
                            orderRange.begin = index;
                        if (orderRange.end < index + 1)
                            orderRange.end = index + 1;
                    }
                }
            }
        }
        function updateView(viewport) {
            // 遍历forDatas，为没有target的生成target，并且测试回收
            var arrLength = forDatas.length;
            var curRange = { begin: 0, end: arrLength };
            if (orderRange) {
                curRange.begin = orderRange.begin;
                curRange.end = orderRange.end;
                // 首先反向扩充范围
                for (var i = orderRange.begin; i >= 0; i--) {
                    if (testInViewPort(forDatas[i]))
                        curRange.begin = i;
                    else
                        break;
                }
                // 然后正向扩充
                for (var i = orderRange.end, len = forDatas.length; i < len; i++) {
                    if (testInViewPort(forDatas[i]))
                        curRange.end = i + 1;
                    else
                        break;
                }
            }
            // 遍历所有窗口内对象
            for (var i = curRange.begin, end = curRange.end; i < end; i++) {
                var forData = forDatas[i];
                var lastForData = forDatas[i - 1];
                if (!forData.target) {
                    var newOne = generateOne(forData.key, forData.value, arrLength, lastForData && lastForData.target);
                    forData.target = newOne.node;
                }
                // 如果上一个节点不在viewport范围内，则回收之
                testReturn(lastForData, curRange);
            }
            // 如果最后一个节点也不在viewport范围内，也要回收之
            testReturn(forData, curRange);
            // 然后更新顺序范围
            if (orderRange) {
                // 单向滚动即使全部超出范围也不会造成扫描缺失，所以在超出范围时不更新下次扫描范围即可
                if (curRange.begin < curRange.end) {
                    // 没有全部超出范围
                    orderRange.begin = curRange.begin;
                    orderRange.end = curRange.end;
                }
                else if (viewportData.twowayMoving) {
                    // 全部超出范围了，并且是双向滚动，下次需要全扫描，防止有遗漏
                    orderRange.begin = 0;
                    orderRange.end = arrLength;
                }
            }
        }
    }
};


/***/ }),
/* 9 */,
/* 10 */,
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Ares_1 = __webpack_require__(4);
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
        target.on("pointerup", this.onPointerUp, this);
        target.on("pointerupoutside", this.onPointerUp, this);
        // 记录observe引用
        this._observe = this.observe.bind(this);
    }
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
            this._downTarget.on("mouseup", this.onPointerUp, this);
            this._downTarget.on("mouseupoutside", this.onPointerUp, this);
            this._downTarget.on("pointerup", this.onPointerUp, this);
            this._downTarget.on("pointerupoutside", this.onPointerUp, this);
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
    ViewPortHandler.prototype.onPointerUp = function (evt) {
        if (this._downTarget) {
            // 移除抬起监听
            this._downTarget.off("mouseup", this.onPointerUp, this);
            this._downTarget.off("mouseupoutside", this.onPointerUp, this);
            this._downTarget.off("pointerup", this.onPointerUp, this);
            this._downTarget.off("pointerupoutside", this.onPointerUp, this);
            // 如果按下时有移动，则禁止抬起事件继续向下传递
            if (this._dragging)
                evt.stopPropagation();
            // 重置状态
            this._downTarget = null;
            this._dragging = false;
            // 开始缓动
            this._ticker.start();
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
        return { x: Math.round(deltaX), y: Math.round(deltaY) };
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
            // 设置双向移动
            this._viewportData.twowayMoving = (this._target.position.x != pos.x && this._target.position.y != pos.y);
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
            if (this._speed.x != 0) {
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
        else {
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
        // 纵向
        if (d.y != 0) {
            if (this._speed.y != 0) {
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
        else {
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
        // 设置双向移动
        this._viewportData.twowayMoving = !(doneX || doneY);
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
    ViewPortHandler.prototype.observe = function (observer) {
        if (this._observers.indexOf(observer) < 0) {
            this._observers.push(observer);
        }
    };
    ViewPortHandler.prototype.notify = function () {
        // 这里通知所有观察者位置变更
        for (var i = 0, len = this._observers.length; i < len; i++) {
            var observer = this._observers[i];
            observer(this._viewPort);
        }
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
        var d = this.getDelta(this._target.x, this._target.y);
        this._target.x += d.x;
        this._target.y += d.y;
        // 为当前显示对象设置viewport范围
        this._target["__ares_viewport__"] = this._viewportData = {
            globalRange: this._viewPortGlobal,
            observe: this._observe,
            twowayMoving: false
        };
    };
    ViewPortHandler.DIRECTION_H = 1;
    ViewPortHandler.DIRECTION_V = 2;
    return ViewPortHandler;
}());
exports.ViewPortHandler = ViewPortHandler;


/***/ })
/******/ ]);
});