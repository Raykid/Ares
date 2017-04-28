/**
 * Created by Raykid on 2016/12/22.
 */
"use strict";
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
                    var cmd = HTMLCommands_1.commands[cmdName];
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
            HTMLCommands_1.textContent({
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
    return HTMLCompiler;
}());
HTMLCompiler._textExpReg = /(.*?)\{\{(.*?)\}\}(.*)/;
exports.HTMLCompiler = HTMLCompiler;
//# sourceMappingURL=HTMLCompiler.js.map