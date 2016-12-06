/**
 * Created by Raykid on 2016/12/6.
 */
var core;
(function (core) {
    class Dependent {
    }
    core.Dependent = Dependent; /** 依赖字典，key是命令名，值是Dependent实例 */
    var dependentMap = {
        text: TextDep
    };
})(core || (core = {}));
class BaseDep {
    depend(exp) {
        // 留待子类扩展
        return null;
    }
}
/** 以下是默认的命令实现 */
class TextDep extends BaseDep {
}
//# sourceMappingURL=Dependent.js.map