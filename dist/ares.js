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
            var keys = Object.keys(scope);
            var values = [];
            for (var i = 0, len = keys.length; i < len; i++) {
                values.push(scope[keys[i]]);
            }
            keys.push("return " + this._exp);
            return Function.apply(null, keys).apply(null, values);
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
        TextCmd.prototype.exec = function (target, exp, scope) {
            var expresion = new core.Expresion(exp);
            return {
                update: function () {
                    // 更新target节点的innerText
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
        HtmlCmd.prototype.exec = function (target, exp, scope) {
            var expresion = new core.Expresion(exp);
            return {
                update: function () {
                    // 更新target节点的innerHTML
                    target.innerHTML = expresion.run(scope);
                }
            };
        };
        return HtmlCmd;
    })();
    core.HtmlCmd = HtmlCmd;
    /** visible命令 */
    var VisibleCmd = (function () {
        function VisibleCmd() {
        }
        VisibleCmd.prototype.exec = function (target, exp, scope) {
            var expresion = new core.Expresion(exp);
            return {
                update: function () {
                    var condition = expresion.run(scope);
                    target.style.display = (condition ? "" : "none");
                }
            };
        };
        return VisibleCmd;
    })();
    core.VisibleCmd = VisibleCmd;
    /** for命令 */
    var ForCmd = (function () {
        function ForCmd() {
        }
        Object.defineProperty(ForCmd.prototype, "compileChildren", {
            get: function () {
                // for命令需要将所有子节点延迟到更新时再编译
                return false;
            },
            enumerable: true,
            configurable: true
        });
        ForCmd.prototype.exec = function (target, exp, scope) {
            var _this = this;
            var targets = [];
            return {
                update: function (entity) {
                    // 首先清空当前已有的对象节点
                    var len = targets.length;
                    while (len--) {
                        var child = targets.pop();
                        child.parentElement.removeChild(child);
                    }
                    // 生成新对象
                    var parent = target.parentElement;
                    var list = new core.Expresion(exp).run(scope);
                    for (var i = 0, len = list.length; i < len; i++) {
                        // 构造一个新作用域
                        var item = list[i];
                        var subScope = {
                            $data: null,
                            $parent: scope,
                            $root: scope.$root,
                            $original: item
                        };
                        // 如果是复杂类型，则需要将所有子对象赋值过来
                        for (var key in item) {
                            subScope[key] = item[key];
                        }
                        subScope.$data = subScope;
                        // 构造一个新的节点，如果是第一个元素则直接使用target作为目标节点
                        var newTarget = target.cloneNode(true);
                        parent.appendChild(newTarget);
                        targets.push(newTarget);
                        // 用新的作用域遍历新节点
                        var updaters = entity.compile(newTarget, subScope);
                        // 立即更新
                        updaters.map(function (updater) { return updater.update(entity); }, _this);
                    }
                }
            };
        };
        return ForCmd;
    })();
    core.ForCmd = ForCmd;
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
            html: new core.HtmlCmd(),
            visible: new core.VisibleCmd(),
            for: new core.ForCmd()
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
            this._element = element;
            this._data = data;
            // 生成一个data的浅层拷贝对象，作为data原始值的保存
            this.proxyData(data, []);
            // 向data中加入$data、$parent和$root参数，都是data本身，用以构建一个Scope对象
            data.$data = data.$parent = data.$root = data;
            // 开始解析整个element，用整个data作为当前词法作用域
            this._updaters = this.compile(element, data);
            // 进行一次全局更新
            this.update();
        }
        /**
         * 为对象安插代理，会篡改对象中的实例为getter和setter，并且返回原始对象的副本
         * @param data 要篡改的对象
         * @param path 当前路径数组
         */
        AresEntity.prototype.proxyData = function (data, path) {
            var original = {};
            // 记录当前层次所有的属性，如果有复杂类型对象则递归之
            var keys = Object.keys(data);
            for (var i = 0, len = keys.length; i < len; i++) {
                var key = keys[i];
                var value = data[key];
                switch (typeof value) {
                    case "object":
                        if (value instanceof Array) {
                            // 是数组，对于其自身要和简单类型一样处理
                            original[key] = value;
                            Object.defineProperty(data, key, {
                                configurable: true,
                                enumerable: true,
                                get: this.getProxy.bind(this, original, key),
                                set: this.setProxy.bind(this, original, key)
                            });
                            // 篡改数组的特定方法
                            var self = this;
                            AresEntity._arrayMethods.map(function (method) {
                                value[method] = function () {
                                    // 调用原始方法
                                    Array.prototype[method].apply(this, arguments);
                                    // 更新
                                    self.update();
                                };
                            }, this);
                        }
                        else {
                            // 复杂类型，需要递归
                            var temp = path.concat();
                            temp.push(key);
                            original[key] = this.proxyData(value, temp);
                        }
                        break;
                    case "function":
                        // 是方法，直接记录之
                        original[key] = value;
                        break;
                    default:
                        // 简单类型，记录一个默认值
                        original[key] = value;
                        // 篡改为getter和setter
                        Object.defineProperty(data, key, {
                            configurable: true,
                            enumerable: true,
                            get: this.getProxy.bind(this, original, key),
                            set: this.setProxy.bind(this, original, key)
                        });
                        break;
                }
            }
            data.$original = original;
        };
        AresEntity.prototype.getProxy = function (original, key) {
            return original[key];
        };
        AresEntity.prototype.setProxy = function (original, key, value) {
            original[key] = value;
            this.update();
        };
        AresEntity.prototype.update = function () {
            // TODO Raykid 现在是全局更新，要改为条件更新
            for (var i = 0, len = this._updaters.length; i < len; i++) {
                this._updaters[i].update(this);
            }
        };
        AresEntity.prototype.compile = function (element, scope) {
            var updaters = [];
            // 检查节点上面以data-a-或者a-开头的属性，将其认为是绑定属性
            var attrs = element.attributes;
            var compileChildren = true;
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
                        // 更新编译子节点的属性
                        if (cmd.compileChildren == false)
                            compileChildren = false;
                        // 取到命令表达式
                        var cmdExp = attr.value;
                        // 生成一个更新项
                        var updater = cmd.exec(element, cmdExp, scope);
                        // TODO Raykid 现在是全局更新，要改为条件更新
                        updaters.push(updater);
                        // 从DOM节点上移除属性
                        attr.ownerElement.removeAttributeNode(attr);
                        i--;
                        len--;
                    }
                }
            }
            // 遍历子节点
            if (compileChildren) {
                var children = element.children;
                for (var i = 0, len = children.length; i < len; i++) {
                    var child = children[i];
                    var temp = this.compile(child, scope);
                    updaters = updaters.concat(temp);
                }
            }
            // 返回Updater
            return updaters;
        };
        AresEntity._arrayMethods = [
            'push',
            'pop',
            'shift',
            'unshift',
            'splice',
            'sort',
            'reverse'
        ];
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