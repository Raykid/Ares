"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getChildrenString(node) {
    var result = "";
    var children = node.children;
    if (children) {
        for (var i = 0, len = children.length; i < len; i++) {
            result += children[i].value;
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
//# sourceMappingURL=TemplateCommands.js.map