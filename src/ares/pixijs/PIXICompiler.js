/// <reference path="pixi.js.d.ts"/>
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PIXICommands_1 = require("./PIXICommands");
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
    PIXICompiler.prototype.parseCmd = function (node) {
        // 取到属性列表
        var keys = [];
        for (var t in node) {
            if (t.indexOf("a-") == 0 || t.indexOf("a_") == 0) {
                keys.push(t);
            }
        }
        // 把配置中的属性推入属性列表中
        var conf = (this._config && this._config[node.name]);
        for (var t in conf) {
            if (t.indexOf("a-") != 0 && t.indexOf("a_") != 0)
                t = "a-" + t;
            keys.push(t);
        }
        // 开始遍历属性列表
        var cmdNameDict = {};
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
            // 填充字典
            cmdNameDict[cmdName] = {
                cmdName: cmdName,
                subCmd: subCmd,
                propName: key,
                exp: exp
            };
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
        for (var cmdName in cmdDict) {
            var cmdData = cmdDict[cmdName];
            // 取到子命令名
            var subCmd = cmdData.subCmd;
            // 取到命令字符串
            var exp = cmdData.exp;
            // 用命令名取到Command
            var cmd = PIXICommands_1.commands[cmdName];
            // 如果没有找到命令，则认为是自定义命令，套用prop命令
            if (!cmd) {
                cmd = PIXICommands_1.commands["prop"];
                subCmd = cmdName || "";
            }
            // 推入数组
            var cmdToCompile = {
                propName: cmdData.propName,
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
    PIXICompiler.prototype.compileTextContent = function (text, scope) {
        var value = text.text;
        if (PIXICompiler._textExpReg.test(value)) {
            var exp = this.parseTextExp(value);
            PIXICommands_1.textContent({
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
exports.PIXICompiler = PIXICompiler;
//# sourceMappingURL=PIXICompiler.js.map