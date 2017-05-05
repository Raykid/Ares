"use strict";
/**
 * Created by Raykid on 2016/12/16.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Mutator_1 = require("./Mutator");
var Watcher_1 = require("./Watcher");
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
    return Ares;
}());
exports.Ares = Ares;
//# sourceMappingURL=Ares.js.map