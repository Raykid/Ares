/**
 * Created by Raykid on 2016/12/6.
 */
var core;
(function (core) {
    var Expresion = (function () {
        function Expresion(exp) {
            this._exp = exp;
        }
        Expresion.prototype.run = function (scope) {
            return new Function("$data", "$parent", "$root", "return " + this._exp)(scope, scope.$parent, scope.$root);
        };
        return Expresion;
    })();
    core.Expresion = Expresion;
})(core || (core = {}));
/**
 * Created by Raykid on 2016/12/6.
 */
var core;
(function (core) {
    /** 文本命令 */
    var TextCmd = (function () {
        function TextCmd() {
        }
        Object.defineProperty(TextCmd.prototype, "subScope", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        TextCmd.prototype.exec = function (target, exp, scope) {
            var expresion = new core.Expresion(exp);
            return {
                update: function () {
                    // 更新target节点的textContent
                    target.innerText = expresion.run(scope);
                }
            };
        };
        return TextCmd;
    })();
    core.TextCmd = TextCmd;
    /** HTML文本命令 */
    var HtmlCmd = (function () {
        function HtmlCmd() {
        }
        Object.defineProperty(HtmlCmd.prototype, "subScope", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        HtmlCmd.prototype.exec = function (target, exp, scope) {
            var expresion = new core.Expresion(exp);
            return {
                update: function () {
                    // 更新target节点的textContent
                    target.innerHTML = expresion.run(scope);
                }
            };
        };
        return HtmlCmd;
    })();
    core.HtmlCmd = HtmlCmd;
})(core || (core = {}));
/// <reference path="Expresion.ts"/>
/// <reference path="SystemCmd.ts"/>
/**
 * Created by Raykid on 2016/12/6.
 */
var core;
(function (core) {
    var Command = (function () {
        function Command() {
        }
        /** 获取命令对象 */
        Command.getCmd = function (name) {
            // 优先查找系统命令，找不到再去自定义命令表查找
            return (Command._depMap[name] ||
                Command._customCmdMap[name]);
        };
        /**
         * 添加命令对象
         * @param name 命令对象名字
         * @param dep 命令对象实现对象
         */
        Command.addCmd = function (name, dep) {
            Command._customCmdMap[name] = dep;
        };
        /**
         * 移除命令对象
         * @param name 命令对象名字
         * @returns {Cmd} 被移除的命令对象
         */
        Command.removeCmd = function (name) {
            var dep = Command._customCmdMap[name];
            delete Command._customCmdMap[name];
            return dep;
        };
        // 自定义的命令表
        Command._customCmdMap = {};
        // 系统默认的命令表
        Command._depMap = {
            text: new core.TextCmd(),
            html: new core.HtmlCmd()
        };
        return Command;
    })();
    core.Command = Command;
})(core || (core = {}));
/// <reference path="Command.ts"/>
/**
 * Created by Raykid on 2016/12/5.
 */
var core;
(function (core) {
    var AresEntity = (function () {
        function AresEntity(data, element) {
            this._updaters = [];
            this._element = element;
            this._data = data;
            // 生成一个data的浅层拷贝对象，作为data原始值的保存
            this._record = this.proxyData(data, []);
            // 向data中加入$parent和$root参数，都是data本身，用以构建一个Scope对象
            data.$parent = data.$root = data;
            // 开始解析整个element，用整个data作为当前词法作用域
            this.walkThrough(element, data);
            // 进行一次全局更新
            this.update();
        }
        /**
         * 为对象安插代理，会篡改对象中的实例为getter和setter，并且返回原始对象的副本
         * @param data 要篡改的对象
         * @param path 当前路径数组
         * @returns {any} 篡改前的对象副本
         */
        AresEntity.prototype.proxyData = function (data, path) {
            var result = {};
            // 记录当前层次所有的属性，如果有复杂类型对象则递归之
            var keys = Object.keys(data);
            for (var i = 0, len = keys.length; i < len; i++) {
                var key = keys[i];
                var value = data[key];
                switch (typeof value) {
                    case "object":
                        // 复杂类型，需要递归
                        var temp = path.concat();
                        temp.push(key);
                        result[key] = this.proxyData(value, temp);
                        break;
                    case "function":
                        // 是方法，直接记录之
                        result[key] = data[key];
                        break;
                    default:
                        // 简单类型，记录一个默认值
                        result[key] = data[key];
                        // 篡改为getter和setter
                        Object.defineProperty(data, key, {
                            configurable: true,
                            enumerable: true,
                            get: this.getProxy.bind(this, result, key),
                            set: this.setProxy.bind(this, result, key)
                        });
                        break;
                }
            }
            return result;
        };
        AresEntity.prototype.getProxy = function (result, key) {
            return result[key];
        };
        AresEntity.prototype.setProxy = function (result, key, value) {
            result[key] = value;
            this.update();
        };
        AresEntity.prototype.walkThrough = function (element, curScope) {
            // 检查节点上面以data-a-或者a-开头的属性，将其认为是绑定属性
            var attrs = element.attributes;
            for (var i = 0, len = attrs.length; i < len; i++) {
                var attr = attrs[i];
                var name = attr.name;
                // 所有ares属性必须以data-a-或者a-开头
                if (name.indexOf("a-") == 0 || name.indexOf("data-a-") == 0) {
                    var index = name.indexOf("a-") + 2;
                    // 取到命令名
                    var cmdName = name.substr(index);
                    // 用命令名取到命令依赖对象
                    var cmd = core.Command.getCmd(cmdName);
                    if (cmd) {
                        // 取到命令表达式
                        var cmdExp = attr.value;
                        // 看是否需要生成子域
                        if (cmd.subScope) {
                            curScope = {
                                $parent: curScope,
                                $root: curScope.$root
                            };
                        }
                        // 生成一个更新项
                        var updater = cmd.exec(element, cmdExp, curScope);
                        // TODO Raykid 现在是全局更新，要改为条件更新
                        this._updaters.push(updater);
                        // 从DOM节点上移除属性
                        attr.ownerElement.removeAttributeNode(attr);
                    }
                }
            }
            // 遍历子节点
            var children = element.children;
            for (var i = 0, len = children.length; i < len; i++) {
                var child = children[i];
                this.walkThrough(child, curScope);
            }
        };
        AresEntity.prototype.update = function () {
            // TODO Raykid 现在是全局更新，要改为条件更新
            for (var i = 0, len = this._updaters.length; i < len; i++) {
                this._updaters[i].update();
            }
        };
        return AresEntity;
    })();
    core.AresEntity = AresEntity;
})(core || (core = {}));
/// <reference path="core/AresEntity.ts"/>
/**
 * Created by Raykid on 2016/12/5.
 */
var Ares = (function () {
    function Ares() {
    }
    /**
     * 创建一个数据绑定
     * @param viewModel 要绑定的数据对象
     * @param nameOrElement 要绑定到的DOM节点的名字或者引用
     * @param options 额外参数，参考AresOptions接口
     */
    Ares.create = function (viewModel, nameOrElement, options) {
        if (document.body) {
            doCreate();
        }
        else {
            window.onload = doCreate;
        }
        function doCreate() {
            var el;
            if (typeof nameOrElement == "string") {
                el = document.getElementById(nameOrElement);
            }
            else {
                el = nameOrElement;
            }
            // 生成一个Entity
            new core.AresEntity(viewModel, el);
            // 调用回调
            if (options && options.initialized)
                options.initialized(viewModel);
        }
    };
    return Ares;
})();
//# sourceMappingURL=ares.js.map