/**
 * Created by Raykid on 2016/12/6.
 */
var core;
(function (core) {
    var Expresion = (function () {
        function Expresion(exp) {
            var res = Expresion.changeParamNames(exp);
            this._exp = res.exp;
            this._names = res.names;
        }
        Object.defineProperty(Expresion.prototype, "names", {
            get: function () {
                return this._names;
            },
            enumerable: true,
            configurable: true
        });
        Expresion.prototype.run = function (scope) {
            return new Function("$data", "return " + this._exp)(scope);
        };
        Expresion.parseOriExp = function (exp) {
            var names = [];
            if (exp == "")
                return { exp: exp, names: names };
            // 分别将""和''找出来，然后将其两边的字符串递归处理，最后再用正则表达式匹配
            var first1 = Expresion.getFirst(exp, "'");
            var first2 = Expresion.getFirst(exp, '"');
            var first, second;
            if (!first1 && !first2) {
                var localVarMap = {};
                // 啥都没有，使用正则表达式匹配
                exp = exp.replace(/[a-z\$][\w\.\$]*/ig, function (str, index, exp) {
                    if (str.indexOf("$data.") != 0) {
                        // 如果前面4个字符是var或者let或const则作为局部变量，不进行替换
                        var tempVar = exp.substr(index - 4, 4);
                        if (tempVar == "var " || tempVar == "let " || exp.substr(index - 6, 6) == "const ") {
                            localVarMap[str] = true;
                            return str;
                        }
                        // 如果是局部变量则不进行替换
                        if (localVarMap[str])
                            return str;
                        // 如果str和冒号:之间都是空白字符或者没有字符，则不替换$data
                        var end = index + str.length;
                        var i = exp.indexOf(":", end);
                        if (i > index) {
                            var temp = exp.substring(end, i);
                            if (/^\s*$/.test(temp))
                                return str;
                        }
                        // 如果是)后面跟着个.则不替换，因为是方法执行后的取值操作
                        if (exp.substr(index - 2, 2) == ").")
                            return str;
                        // 如果是true或false则不进行替换
                        if (str == "true" || str == "false")
                            return str;
                        // 如果是js关键字则不替换
                        if (Expresion._keyWords[str])
                            return str;
                        // 如果是在catch括号内部的变量不替换
                        if (exp.substr(index - 6, 6) == "catch(")
                            return str;
                        // 如果是$data本身则不进行替换
                        if (str == "$data")
                            return str;
                        // 如果window下存在这个变量，则不进行替换
                        var iDot = str.indexOf(".");
                        if (iDot < 0)
                            iDot = str.length;
                        var argName = str.substr(0, iDot);
                        if (window[argName])
                            return str;
                        // 否则记录名字并添加$data前缀
                        names.push(str);
                        str = "$data." + str;
                    }
                    return str;
                });
            }
            else {
                if (first1 && first2)
                    if (first1.begin < first2.begin)
                        first = first1;
                    else
                        first = first2;
                else if (first1)
                    first = first1;
                else if (first2)
                    first = first2;
                second = Expresion.getFirst(exp, first.value, first.end);
                var part1 = Expresion.parseOriExp(exp.substr(0, first.begin));
                var part2 = exp.substring(first.begin, second.end);
                var part3 = Expresion.parseOriExp(exp.substr(second.end));
                exp = part1.exp + part2 + part3.exp;
                // 记录名字
                names.push.apply(names, part1.names);
                names.push.apply(names, part3.names);
            }
            return { exp: exp, names: names };
        };
        Expresion.parseTempExp = function (exp) {
            var names = [];
            if (exp == "")
                return { exp: exp, names: names };
            var res = Expresion.getContentBetween(exp, "\\$\\{", "\\}");
            if (res) {
                // ${}内部是正规的js表达式，所以用常规方式解析，左边直接截取即可，右面递归解析模板方式
                var part1 = exp.substr(0, res.begin);
                var part2 = Expresion.parseOriExp(res.value);
                var part3 = Expresion.parseTempExp(exp.substr(res.end + 1));
                exp = part1 + part2.exp + "}" + part3.exp;
                // 记录名字
                names.push.apply(names, part2.names);
                names.push.apply(names, part3.names);
            }
            return { exp: exp, names: names };
        };
        /**
         * 获取第一个出现的指定标识的数据
         * @param exp 原始表达式
         * @param flag 指定标识
         * @param from 起始索引
         * @returns {ContentResult} 在exp中首次出现flag的数据
         */
        Expresion.getFirst = function (exp, flag, from) {
            if (from === void 0) { from = 0; }
            var reg = new RegExp("(\\\\*)" + flag, "g");
            reg.lastIndex = from;
            for (var res = reg.exec(exp); res != null; res = reg.exec(exp)) {
                // 如果字符前面的\是奇数个，表示这个字符是被转义的，不是目标字符
                if (res[1].length % 2 == 0) {
                    return {
                        begin: res.index,
                        end: res.index + res[0].length,
                        value: res[0]
                    };
                }
            }
            return null;
        };
        /**
         * 获取flag表示的字符之间所有的字符，该字符前面如果有\则会当做普通字符，而不会作为flag字符
         * @param exp 原始表达式
         * @param begin 边界开始字符串
         * @param end 边界结束字符串
         * @returns {ContentResult} 内容结构体
         */
        Expresion.getContentBetween = function (exp, begin, end) {
            var bRes = Expresion.getFirst(exp, begin);
            if (!bRes)
                return null;
            var eRes = Expresion.getFirst(exp, end, bRes.end);
            if (!eRes)
                return null;
            return {
                begin: bRes.end,
                end: eRes.begin,
                value: exp.substring(bRes.end, eRes.begin)
            };
        };
        /**
         * 将表达式中所有不以$data.开头的变量都加上$data.，以防找不到变量
         * @param exp 字符串表达式
         * @returns {string} 处理后的表达式
         */
        Expresion.changeParamNames = function (exp) {
            var names = [];
            if (exp == null || exp == "")
                return { exp: exp, names: names };
            // 用普通字符串方式处理模板字符串前面的部分，用模板字符串方式处理模板字符串部分，然后递归处理剩余部分
            var res = Expresion.getContentBetween(exp, "`", "`");
            if (res) {
                var part1 = Expresion.parseOriExp(exp.substr(0, res.begin - 1));
                var part2 = Expresion.parseTempExp(res.value);
                var part3 = Expresion.changeParamNames(exp.substr(res.end + 1));
                exp = part1.exp + "`" + part2.exp + "`" + part3.exp;
                // 记录名字
                names.push.apply(names, part1.names);
                names.push.apply(names, part2.names);
                names.push.apply(names, part3.names);
            }
            else {
                var temp = Expresion.parseOriExp(exp);
                exp = temp.exp;
                // 记录名字
                names.push.apply(names, temp.names);
            }
            // 为names去重
            var tempMap = {};
            names = names.filter(function (name) {
                if (!tempMap[name]) {
                    tempMap[name] = true;
                    return true;
                }
                return false;
            }, this);
            return { exp: exp, names: names };
        };
        Expresion._keyWords = {
            "function": true,
            "var": true,
            "let": true,
            "const": true,
            "try": true,
            "catch": true,
            "return": true,
            "null": true
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
    /** 文本内容命令 */
    var TextContentCmd = (function () {
        function TextContentCmd() {
        }
        TextContentCmd.getInstance = function () {
            return TextContentCmd._instance;
        };
        TextContentCmd.getValidNodes = function (target) {
            // 取出target中所有的text节点
            var nodes = target.childNodes;
            var res = [];
            for (var i = 0, len = nodes.length; i < len; i++) {
                var node = nodes[i];
                if (node.nodeType == 3)
                    res.push(node);
            }
            return res;
        };
        TextContentCmd.prototype.exec = function (target, exp, scope) {
            var names;
            return {
                update: function (entity) {
                    var first = (names == null);
                    if (first || entity.dependDirty(names)) {
                        if (first)
                            names = [];
                        var nodes = TextContentCmd.getValidNodes(target);
                        for (var i = 0, len = nodes.length; i < len; i++) {
                            var node = nodes[i];
                            var temp = node.nodeValue;
                            var hasChange = false;
                            // 依序将{{}}计算出来
                            for (var res = core.Expresion.getContentBetween(temp, "{{", "}}"); res != null; res = core.Expresion.getContentBetween(temp, "{{", "}}")) {
                                var tempExp = new core.Expresion(res.value);
                                temp = temp.substr(0, res.begin - 2) + tempExp.run(scope) + temp.substr(res.end + 2);
                                if (first)
                                    names.push.apply(names, tempExp.names);
                                hasChange = true;
                            }
                            // 更新target节点的内容
                            if (hasChange) {
                                var newNode = node.cloneNode(false);
                                newNode.nodeValue = temp;
                                target.replaceChild(newNode, node);
                            }
                        }
                    }
                }
            };
        };
        TextContentCmd.prototype.needParse = function (target) {
            var nodes = TextContentCmd.getValidNodes(target);
            // 看看有没有被{{}}包围的内容
            for (var i = 0, len = nodes.length; i < len; i++) {
                var res = core.Expresion.getContentBetween(nodes[i].nodeValue, "{{", "}}");
                if (res != null)
                    return true;
            }
            return false;
        };
        TextContentCmd._instance = new TextContentCmd();
        return TextContentCmd;
    })();
    core.TextContentCmd = TextContentCmd;
    /** 文本命令 */
    var TextCmd = (function () {
        function TextCmd() {
        }
        TextCmd.prototype.exec = function (target, exp, scope) {
            var expresion = new core.Expresion(exp);
            return {
                update: function (entity) {
                    if (entity.dependDirty(expresion.names)) {
                        // 更新target节点的innerText
                        target.innerText = expresion.run(scope);
                    }
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
                update: function (entity) {
                    if (entity.dependDirty(expresion.names)) {
                        // 更新target节点的innerHTML
                        target.innerHTML = expresion.run(scope);
                    }
                }
            };
        };
        return HtmlCmd;
    })();
    core.HtmlCmd = HtmlCmd;
    /** CSS类型命令 */
    var CssCmd = (function () {
        function CssCmd() {
        }
        CssCmd.prototype.exec = function (target, exp, scope, subCmd) {
            var names = null;
            // 记录原始class值
            var oriCls = target.getAttribute("class");
            return {
                update: function (entity) {
                    var first = (names == null);
                    if (first || entity.dependDirty(names)) {
                        if (subCmd != "") {
                            // 子命令形式
                            var tempExp = new core.Expresion(exp);
                            if (first)
                                names = tempExp.names;
                            var match = tempExp.run(scope);
                            if (match == true) {
                                var newCls = subCmd;
                                if (oriCls)
                                    newCls = oriCls + " " + newCls;
                                // 更新target节点的class属性
                                target.setAttribute("class", newCls);
                            }
                        }
                        else {
                            var tempExp = new core.Expresion(exp);
                            if (first)
                                names = tempExp.names;
                            var params = tempExp.run(scope);
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
                        }
                    }
                }
            };
        };
        return CssCmd;
    })();
    core.CssCmd = CssCmd;
    /** 修改任意属性命令 */
    var AttrCmd = (function () {
        function AttrCmd() {
        }
        AttrCmd.prototype.exec = function (target, exp, scope, subCmd) {
            var names = null;
            return {
                update: function (entity) {
                    var first = (names == null);
                    if (first || entity.dependDirty(names)) {
                        if (subCmd != "") {
                            // 子命令形式
                            var tempExp = new core.Expresion(exp);
                            if (first)
                                names = tempExp.names;
                            var res = tempExp.run(scope);
                            target.setAttribute(subCmd, res);
                        }
                        else {
                            // 集成形式
                            var tempExp = new core.Expresion(exp);
                            if (first)
                                names = tempExp.names;
                            var params = tempExp.run(scope);
                            // 遍历所有params的key，如果其表达式值为true则添加其类型
                            for (var name in params) {
                                var value = params[name];
                                target.setAttribute(name, value);
                            }
                        }
                    }
                }
            };
        };
        return AttrCmd;
    })();
    core.AttrCmd = AttrCmd;
    /** 监听事件命令 */
    var OnCmd = (function () {
        function OnCmd() {
        }
        OnCmd.prototype.exec = function (target, exp, scope, subCmd) {
            var names = null;
            exp = this.transform(exp);
            // 外面包一层function，因为要的是方法引用，而不是直接执行方法
            exp = "function($data){" + exp + "}";
            return {
                update: function (entity) {
                    var first = (names == null);
                    if (first || entity.dependDirty(names)) {
                        if (subCmd != "") {
                            // 子命令形式
                            var tempExp = new core.Expresion(exp);
                            if (first)
                                names = tempExp.names;
                            target.addEventListener(subCmd, tempExp.run(scope).bind(null, scope));
                        }
                        else {
                            // 集成形式
                            var tempExp = new core.Expresion(exp);
                            if (first)
                                names = tempExp.names;
                            var params = tempExp.run(scope);
                            // 遍历所有params的key，在target上监听该事件
                            for (var name in params) {
                                target.addEventListener(name, params[name].bind(null, scope));
                            }
                        }
                    }
                }
            };
        };
        OnCmd.prototype.transform = function (exp) {
            var count = 0;
            var reg = /[\(\)]/g;
            var bIndex = -1;
            var eIndex = -1;
            for (var res = reg.exec(exp); res != null; res = reg.exec(exp)) {
                if (res[0] == "(") {
                    if (count == 0)
                        bIndex = res.index + 1;
                    count++;
                }
                else {
                    count--;
                    if (count == 0) {
                        eIndex = res.index;
                        break;
                    }
                }
            }
            if (bIndex >= 0 && eIndex >= 0) {
                // 递归处理参数部分和后面的部分
                var part2 = this.transform(exp.substring(bIndex, eIndex));
                var part3 = this.transform(exp.substr(eIndex + 1));
                // 处理方法名部分
                var part1 = exp.substr(0, bIndex - 1);
                var reg = /[\w\$][\w\$\.]+[\w\$]$/;
                var res = reg.exec(part1);
                if (res != null) {
                    var funcName = res[0];
                    var before = part1.substr(0, res.index);
                    // 用call方法将$data绑定到方法参数里
                    exp = before + "(function(){var temp = [" + part2 + "];try{return " + funcName + ".apply($data,temp)" + part3 + "}catch(err){return " + funcName + ".apply(null,temp)" + part3 + "}})()";
                }
                else {
                    exp = part1 + "(" + part2 + ")" + part3;
                }
            }
            return exp;
        };
        return OnCmd;
    })();
    core.OnCmd = OnCmd;
    /** if命令 */
    var IfCmd = (function () {
        function IfCmd() {
        }
        IfCmd.prototype.exec = function (target, exp, scope) {
            var expresion = new core.Expresion(exp);
            return {
                update: function (entity) {
                    if (entity.dependDirty(expresion.names)) {
                        var condition = expresion.run(scope);
                        target.style.display = (condition ? "" : "none");
                    }
                }
            };
        };
        return IfCmd;
    })();
    core.IfCmd = IfCmd;
    /** for命令 */
    var ForCmd = (function () {
        function ForCmd() {
            this._reg = /([\w\.\$]+)\s+in\s+([\w\.\$]+)/;
        }
        Object.defineProperty(ForCmd.prototype, "priority", {
            get: function () {
                return 1000;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ForCmd.prototype, "stopCompile", {
            get: function () {
                // for命令需要将所有子节点延迟到更新时再编译
                return true;
            },
            enumerable: true,
            configurable: true
        });
        ForCmd.prototype.exec = function (target, exp, scope) {
            var names = null;
            var subUpdaters = [];
            var next = target.nextElementSibling;
            var targets = [];
            var res = this._reg.exec(exp);
            var subName = res[1];
            var listName = res[2];
            var parent = target.parentElement;
            var firstElement = target;
            target = target.cloneNode(true);
            // 去掉target中的a-for属性
            target.removeAttribute("data-a-for");
            target.removeAttribute("a-for");
            // 记录下所有target剩余的属性，否则firstElement之后无法被正确编译，因为缺少属性
            var firstAttrs = target.attributes;
            return {
                update: function (entity) {
                    var first = (names == null);
                    if (first || entity.dependDirty(names)) {
                        // 首先清空当前已有的对象节点
                        var len = targets.length;
                        while (len--) {
                            var child = targets.pop();
                            child.parentElement.removeChild(child);
                        }
                        // 生成新对象
                        var tempExp = new core.Expresion(listName);
                        if (first)
                            names = tempExp.names;
                        var list = tempExp.run(scope);
                        if (typeof list == "number") {
                            for (var i = 0; i < list; i++) {
                                // 构造一个新作用域
                                var subScope = {};
                                subScope.__proto__ = scope;
                                subScope[subName] = i;
                                var tempUpdaters = update(i, entity, subScope, next);
                                subUpdaters.push.apply(subUpdaters, tempUpdaters);
                            }
                        }
                        else {
                            for (var i = 0, len = list.length; i < len; i++) {
                                // 构造一个新作用域
                                var subScope = {};
                                subScope.__proto__ = scope;
                                subScope[subName] = list[i];
                                var tempUpdaters = update(i, entity, subScope, next);
                                subUpdaters.push.apply(subUpdaters, tempUpdaters);
                            }
                        }
                    }
                    // 无论如何一定要更新一下子列表
                    for (var i = 0, len = subUpdaters.length; i < len; i++) {
                        subUpdaters[i].update(entity);
                    }
                }
            };
            function update(index, entity, subScope, next) {
                // 构造一个新的节点，如果是第一个元素则直接使用firstElement作为目标节点
                var newTarget;
                if (index == 0) {
                    newTarget = firstElement;
                    // 为首个节点赋属性值
                    for (var i = 0, len = firstAttrs.length; i < len; i++) {
                        var attr = firstAttrs[i];
                        firstElement.setAttribute(attr.name, attr.value);
                    }
                }
                else {
                    newTarget = target.cloneNode(true);
                }
                if (parent.contains(next))
                    parent.insertBefore(newTarget, next);
                else
                    parent.appendChild(newTarget);
                targets.push(newTarget);
                // 为for循环的scope添加$index属性
                subScope["$index"] = index;
                // 用新的作用域遍历新节点
                return entity.compile(newTarget, subScope);
            }
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
            return (Command._cmdMap[name] ||
                Command._customCmdMap[name]);
        };
        /**
         * 添加命令对象
         * @param name 命令对象名字
         * @param cmd 命令对象实现对象
         */
        Command.addCmd = function (name, cmd) {
            Command._customCmdMap[name] = cmd;
        };
        /**
         * 移除命令对象
         * @param name 命令对象名字
         * @returns {Cmd} 被移除的命令对象
         */
        Command.removeCmd = function (name) {
            var cmd = Command._customCmdMap[name];
            delete Command._customCmdMap[name];
            return cmd;
        };
        // 自定义的命令表
        Command._customCmdMap = {};
        // 系统默认的命令表
        Command._cmdMap = {
            text: new core.TextCmd(),
            html: new core.HtmlCmd(),
            css: new core.CssCmd(),
            attr: new core.AttrCmd(),
            on: new core.OnCmd(),
            if: new core.IfCmd(),
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
            this._dirtyMap = {};
            this._dirtyId = 0;
            this._forceUpdate = false;
            this._element = element;
            this._data = data;
            // 向data中加入$data、$parent和$root参数，都是data本身，用以构建一个Scope对象
            var func = function () { return data; };
            Object.defineProperties(data, {
                $data: { get: func },
                $parent: { get: func },
                $root: { get: func },
                $path: { get: function () { return ""; } }
            });
            // 生成一个data的浅层拷贝对象，作为data原始值的保存
            this.proxyData(data);
            // 开始解析整个element，用整个data作为当前词法作用域
            this._updaters = this.compile(element, data);
            // 进行一次全局更新
            this.update(true);
        }
        /**
         * 为对象安插代理，会篡改对象中的实例为getter和setter，并且返回原始对象的副本
         * @param data 要篡改的对象
         */
        AresEntity.prototype.proxyData = function (data) {
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
                                get: this.getProxy.bind(this, data, key),
                                set: this.setProxy.bind(this, data, key)
                            });
                            // 篡改数组的特定方法
                            var self = this;
                            AresEntity._arrayMethods.map(function (method) {
                                value[method] = function () {
                                    // 调用原始方法
                                    Array.prototype[method].apply(this, arguments);
                                    // 更新
                                    self.setDirty(data.$path, key);
                                };
                            }, this);
                        }
                        else if (value == null) {
                            // null和简单类型一样处理
                            original[key] = value;
                            // 篡改为getter和setter
                            Object.defineProperty(data, key, {
                                configurable: true,
                                enumerable: true,
                                get: this.getProxy.bind(this, data, key),
                                set: this.setProxy.bind(this, data, key)
                            });
                        }
                        else {
                            // 复杂类型，需要递归
                            Object.defineProperties(value, {
                                $data: { get: function () { return value; } },
                                $parent: { get: function () { return data; } },
                                $root: { get: function () { return data.$root; } },
                                $path: { get: function () { return (data === data.$root ? key : data.$path + "." + key); } }
                            });
                            original[key] = this.proxyData(value);
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
                            get: this.getProxy.bind(this, data, key),
                            set: this.setProxy.bind(this, data, key)
                        });
                        break;
                }
            }
            Object.defineProperty(data, "$original", { get: function () { return original; } });
        };
        AresEntity.prototype.getProxy = function (scope, key) {
            return scope.$original[key];
        };
        AresEntity.prototype.setProxy = function (scope, key, value) {
            // 相等的话则不进行任何处理
            if (value == scope.$original[key])
                return;
            scope.$original[key] = value;
            this.setDirty(scope.$path, key);
        };
        AresEntity.prototype.setDirty = function (path, name) {
            if (path != "")
                name = path + "." + name;
            this._dirtyMap[name] = true;
            // 计划渲染
            if (this._dirtyId == 0)
                this._dirtyId = setTimeout(this.render, 0, this);
        };
        AresEntity.prototype.render = function (entity) {
            entity._dirtyId = 0;
            entity.update();
        };
        AresEntity.prototype.update = function (force) {
            this._forceUpdate = (force == true);
            var updaters = this._updaters;
            for (var i = 0, len = updaters.length; i < len; i++) {
                updaters[i].update(this);
            }
            // 清空dirtyMap
            for (var key in this._dirtyMap) {
                delete this._dirtyMap[key];
            }
            this._forceUpdate = false;
        };
        /**
         * 判断依赖项是否脏了
         * @param names 依赖项名字数组
         * @returns {boolean} 是否脏了
         */
        AresEntity.prototype.dependDirty = function (names) {
            if (this._forceUpdate)
                return true;
            for (var i = 0, len = names.length; i < len; i++) {
                if (this._dirtyMap[names[i]])
                    return true;
            }
            return false;
        };
        AresEntity.prototype.compile = function (element, scope) {
            // 检查节点上面以data-a-或者a-开头的属性，将其认为是绑定属性
            var attrs = element.attributes;
            var bundles = [];
            var stopCompile = false;
            for (var i = 0, len = attrs.length; i < len; i++) {
                var attr = attrs[i];
                var name = attr.name;
                // 所有ares属性必须以data-a-或者a-开头
                if (name.indexOf("a-") == 0 || name.indexOf("data-a-") == 0) {
                    var bIndex = (name.charAt(0) == "d" ? 7 : 2);
                    var eIndex = name.indexOf(":");
                    if (eIndex < 0)
                        eIndex = name.length;
                    // 取到命令名
                    var cmdName = name.substring(bIndex, eIndex);
                    // 取到子命令名
                    var subCmd = name.substr(eIndex + 1);
                    // 用命令名取到命令依赖对象
                    var cmd = core.Command.getCmd(cmdName);
                    if (cmd) {
                        bundles.push({ cmd: cmd, attr: attr, subCmd: subCmd });
                        // 更新编译子节点的属性
                        if (cmd.stopCompile) {
                            stopCompile = true;
                            // 只剩下这一个命令
                            bundles.splice(0, bundles.length - 1);
                            break;
                        }
                    }
                }
            }
            // 排序cmd
            bundles.sort(function (a, b) { return (b.cmd.priority || 0) - (a.cmd.priority || 0); });
            // 开始执行cmd
            var updaters = [];
            for (var i = 0, len = bundles.length; i < len; i++) {
                var bundle = bundles[i];
                // 生成一个更新项
                var updater = bundle.cmd.exec(element, bundle.attr.value, scope, bundle.subCmd);
                updaters.push(updater);
                // 从DOM节点上移除属性
                if (bundle.attr)
                    bundle.attr.ownerElement.removeAttributeNode(bundle.attr);
            }
            // 判断是否停止编译
            if (!stopCompile) {
                // 执行文本域命令
                var tcCmd = core.TextContentCmd.getInstance();
                if (tcCmd.needParse(element)) {
                    // 添加文本域命令
                    updaters.push(tcCmd.exec(element, element.innerHTML, scope));
                }
                // 遍历子节点
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