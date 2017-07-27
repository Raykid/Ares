define("src/ares/Interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/ares/Utils", ["require", "exports"], function (require, exports) {
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
});
define("src/ares/Watcher", ["require", "exports", "src/ares/Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
/**
 * Created by Raykid on 2016/12/22.
 */
define("src/ares/Dep", ["require", "exports"], function (require, exports) {
    "use strict";
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
});
/**
 * Created by Raykid on 2016/12/22.
 */
define("src/ares/Mutator", ["require", "exports", "src/ares/Watcher", "src/ares/Dep"], function (require, exports, Watcher_1, Dep_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
/**
 * Created by Raykid on 2017/7/19.
 */
define("src/ares/Commands", ["require", "exports", "src/ares/Utils"], function (require, exports, Utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.commands = {
        /** 一次性设置变量命令，在数据中插入一个变量 */
        set: function (context) {
            // 设置变量值
            Utils_2.runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
            return context.target;
        },
        /** 绑定设置变量命令，在数据中插入一个变量（如果不提供子命令则不插入变量），并根据表达式的值同步更新变量的值 */
        bind: function (context) {
            // 创建订阅器，监听表达式值变化
            context.entity.createWatcher(context.target, context.data.exp, context.scope, function (value) {
                // 如果子命令不为空，则更新变量值
                if (context.data.subCmd)
                    Utils_2.runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
            });
            return context.target;
        }
    };
});
/**
 * Created by Raykid on 2016/12/16.
 */
define("src/ares/Ares", ["require", "exports", "src/ares/Mutator", "src/ares/Watcher", "src/ares/Commands"], function (require, exports, Mutator_1, Watcher_2, Commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            return new Watcher_2.Watcher(this, target, exp, scope, callback);
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
});
/**
 * Created by Raykid on 2016/12/22.
 */
define("src/ares/html/HTMLCommands", ["require", "exports", "src/ares/Utils"], function (require, exports, Utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                        Utils_3.runExp(cmdData.exp, scope);
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
});
/**
 * Created by Raykid on 2016/12/22.
 */
define("src/ares/html/HTMLCompiler", ["require", "exports", "src/ares/html/HTMLCommands"], function (require, exports, HTMLCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
define("src/ares/pixijs/ViewPortHandler", ["require", "exports"], function (require, exports) {
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
});
define("src/ares/pixijs/PIXIUtils", ["require", "exports"], function (require, exports) {
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
});
define("src/ares/pixijs/PIXICommands", ["require", "exports", "src/ares/pixijs/PIXICompiler", "src/ares/Utils", "src/ares/pixijs/ViewPortHandler", "src/ares/pixijs/PIXIUtils"], function (require, exports, PIXICompiler_1, Utils_4, ViewPortHandler_1, PIXIUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            var options = Utils_4.evalExp(cmdData.subCmd, context.scope);
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
                        Utils_4.runExp(cmdData.exp, scope);
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
            var options = Utils_4.evalExp(cmdData.subCmd, context.scope) || {};
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
});
/// <reference path="pixi.js.d.ts"/>
define("src/ares/pixijs/PIXICompiler", ["require", "exports", "src/ares/pixijs/PIXICommands"], function (require, exports, PIXICommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
define("src/ares/template/TemplateCommands", ["require", "exports"], function (require, exports) {
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
});
define("src/ares/template/TemplateCompiler", ["require", "exports", "src/ares/template/TemplateCommands"], function (require, exports, TemplateCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
/// <reference path="../src/ares/pixijs/pixi.js.d.ts"/>
// / <reference path="../dist/ares.d.ts"/>
// / <reference path="../dist/ares_html.d.ts"/>
// / <reference path="../dist/ares_pixijs.d.ts"/>
// / <reference path="../dist/ares_template.d.ts"/>
define("test/test", ["require", "exports", "src/ares/Ares", "src/ares/html/HTMLCompiler", "src/ares/pixijs/PIXICompiler", "src/ares/template/TemplateCompiler"], function (require, exports, ares, ares_html, ares_pixijs, ares_template) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Created by Raykid on 2016/12/23.
     */
    if (document.body) {
        go();
    }
    else {
        window.onload = go;
    }
    function go() {
        var renderer = PIXI.autoDetectRenderer(800, 600, { backgroundColor: 0xeeeeee });
        document.getElementById("div_root").appendChild(renderer.view);
        var stage = new PIXI.Container();
        render();
        function render() {
            try {
                // 渲染Stage
                renderer.render(stage);
            }
            catch (err) {
                console.error(err.toString());
            }
            // 计划下一次渲染
            requestAnimationFrame(render);
        }
        PIXI.loader.add("test.png");
        PIXI.loader.load(function () {
            var testSkin = new PIXI.Container();
            stage.addChild(testSkin);
            var testContainer = new PIXI.Container();
            testContainer.y = 100;
            testSkin.addChild(testContainer);
            var testSprite = new PIXI.Sprite();
            testSprite.texture = PIXI.Texture.fromImage("test.png");
            testSprite.width = testSprite.height = 200;
            testSprite.interactive = true;
            testSprite["a-on:click"] = "testFunc";
            testSprite["a-for${page:3}"] = "item in testFor";
            testSprite["a-y"] = "$target.y + $index * 200";
            testSprite["a-viewport"] = "$target.x, $target.y, $target.width - 100, $target.height * 2";
            testSprite.x = 200;
            testContainer.addChild(testSprite);
            var testText = new PIXI.Text("text: {{text}}");
            testText["a-tplName"] = "testTpl";
            testText["a-tplGlobal"] = "true";
            testText.y = 300;
            testSkin.addChild(testText);
            var testTpl = new PIXI.Sprite();
            testTpl["a-tpl"] = "testTpl";
            testTpl["a-for"] = "item in testFor";
            testTpl["a-x"] = "$index * 200";
            testTpl["a_y"] = "$target.y + $index * 100";
            testSkin.addChild(testTpl);
            var data = {
                text: "text",
                testNum: 1,
                testFor: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
                testFunc: function (evt) {
                    this.text = "Fuck!!!";
                }
            };
            ares.bind(data, new ares_pixijs.PIXICompiler(testSkin, renderer));
            ares.bind(data, new ares_html.HTMLCompiler("#div_root"));
            ares.bind(data, new ares_template.TemplateCompiler("abc$a-{for: i in 10}'$a-{i}'$a-{end for}def", function (text) {
                console.log(text);
            }));
            var testSkin2 = new PIXI.Container();
            testSkin2["a-tpl"] = "testTpl";
            testSkin2["a-y"] = 100;
            stage.addChild(testSkin2);
            ares.bind(data, new ares_pixijs.PIXICompiler(testSkin2, renderer));
            // setTimeout(()=>{
            //     data.testFor = [3, "jasdf"];
            // }, 2000);
            // setTimeout(()=>{
            //     data.testFor = ["kn", "j111", "14171a"];
            // }, 4000);
        });
    }
});
//# sourceMappingURL=test.js.map