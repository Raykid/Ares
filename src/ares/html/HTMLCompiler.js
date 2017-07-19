"use strict";
/**
 * Created by Raykid on 2016/12/22.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var HTMLCommands_1 = require("./HTMLCommands");
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
//# sourceMappingURL=HTMLCompiler.js.map