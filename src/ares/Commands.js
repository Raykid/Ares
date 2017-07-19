"use strict";
/**
 * Created by Raykid on 2017/7/19.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("./Utils");
exports.commands = {
    /** 一次性设置变量命令，在数据中插入一个变量 */
    set: function (context) {
        // 设置变量值
        Utils_1.runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
        return context.target;
    },
    /** 绑定设置变量命令，在数据中插入一个变量（如果不提供子命令则不插入变量），并根据表达式的值同步更新变量的值 */
    bind: function (context) {
        // 创建订阅器，监听表达式值变化
        context.entity.createWatcher(context.target, context.data.exp, context.scope, function (value) {
            // 如果子命令不为空，则更新变量值
            if (context.data.subCmd)
                Utils_1.runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
        });
        return context.target;
    }
};
//# sourceMappingURL=Commands.js.map