"use strict";
/**
 * Created by Raykid on 2016/12/16.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Mutator_1 = require("./Mutator");
var Watcher_1 = require("./Watcher");
var Commands_1 = require("./Commands");
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
        this._cmdRegExp = /^(data\-)?a[\-_](\w+)([:\$](.+))?$/;
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
     * @return {CommandData|null} 命令数据，如果不是命令则返回null
     */
    Ares.prototype.parseCommand = function (key, value) {
        var result = this._cmdRegExp.exec(key);
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
//# sourceMappingURL=Ares.js.map