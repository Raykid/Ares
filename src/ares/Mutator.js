/**
 * Created by Raykid on 2016/12/22.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Watcher_1 = require("./Watcher");
var Dep_1 = require("./Dep");
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
    return Mutator;
}());
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
exports.Mutator = Mutator;
//# sourceMappingURL=Mutator.js.map