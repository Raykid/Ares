/**
 * Created by Raykid on 2016/12/6.
 */
var core;
(function (core) {
    var Expresion = (function () {
        function Expresion(exp) {
            // 如果exp不是空字符串，则按照普通字符串方式处理之
            this.names = names.concat(this.parseOriExp(exp));
            this._exp = exp;
        }
        Expresion.prototype.run = function (scope) {
            var keys = this.getParamNames(this._exp);
            var values = [];
            for (var i = 0, len = keys.length; i < len; i++) {
                values.push(scope[keys[i]]);
            }
            keys.push("return " + this._exp);
            return Function.apply(null, keys).apply(null, values);
        };
        /**
         * 获取字符串表达式中引用的所有变量名
         * @param exp 字符串表达式
         * @returns {string[]} 表达式中用到的所有变量名的数组
         */
        Expresion.prototype.getParamNames = function (exp) {
            var names = [];
            // 模板字符串部分要特殊处理
            for (var res = this.getContentBetween(exp, "`"), _a = (void 0).names, names = _a === void 0 ? names.concat(this.parseTempExp(exp)) : _a; 
            // 用普通字符串方式处理模板字符串前面的部分
            names = names.concat(this.parseOriExp(exp.substr(0, res1.index))); 
            // 用模板字符串后面的部分代替exp
            exp = exp.substr(res1.index + res1[0].length))
                ;
        };
        return Expresion;
    })();
    core.Expresion = Expresion;
    return names;
})(core || (core = {}));
getContentBetween(exp, string, flag, string);
ContentResult;
{
    var reg = new RegExp("(\\*)" + flag, "g");
    var firstIndex = -1;
    var result = null;
    for (var res = reg.exec(exp); res != null && (res[1].length % 2) == 0; res = reg.exec(exp)) {
        if (firstIndex < 0) {
            firstIndex = res.index + res[0].length;
        }
        else {
            var endIndex = res.index + res[0].length - 1;
            result = {
                begin: firstIndex,
                end: endIndex,
                value: exp.substring(firstIndex, endIndex)
            };
            break;
        }
    }
    return result;
}
parseOriExp(exp, string);
string[];
{
    var names = [];
    return names;
}
parseTempExp(exp, string);
string[];
{
    var names = [];
    return names;
}
//# sourceMappingURL=Expresion.js.map