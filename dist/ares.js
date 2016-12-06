/**
 * Created by Raykid on 2016/12/5.
 */
var core;
(function (core) {
    class AresEntity {
        constructor(data, element) {
            //private _depMap:{[path:string]:Dep} = {};
            this._depList = [];
            this._element = element;
            this._data = data;
            // 生成一个data的浅层拷贝对象，作为data原始值的保存
            this._record = this.proxyData(data, []);
            // 开始解析整个element
            this.walkThrough(element);
            // 更新依赖
            this.updateDeps();
        }
        /**
         * 为对象安插代理，会篡改对象中的实例为getter和setter，并且返回原始对象的副本
         * @param data 要篡改的对象
         * @param path 当前路径数组
         * @returns {any} 篡改前的对象副本
         */
        proxyData(data, path) {
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
                            set: this.setProxy.bind(this, result, key, path)
                        });
                        break;
                }
            }
            return result;
        }
        getProxy(result, key) {
            return result[key];
        }
        setProxy(result, key, path, value) {
            result[key] = value;
            // 设置了一个属性，去寻找对应的依赖
            this.updateDeps();
        }
        updateDeps() {
            //var depKey:string = `${path.join(".")}.${key}`;
            for (var i = 0, len = this._depList.length; i < len; i++) {
                var dep = this._depList[i];
                if (dep) {
                    var result = dep.exp;
                    var reg = /\{\{(.*?)\}\}/;
                    for (var temp = reg.exec(result); temp != null; temp = reg.exec(result)) {
                        // 获取表达式
                        var exp = temp[1];
                        // 计算表达式的值
                        var value = this.runExp(exp, this._data);
                        result = result.substr(0, temp.index) + value + result.substr(temp.index + temp.input.length);
                    }
                    // 设置依赖对象的属性
                    dep.target[dep.key] = result;
                }
            }
        }
        walkThrough(element) {
            // 创建依赖
            var dep = {
                target: element,
                key: "textContent",
                exp: element.textContent,
                scope: this._data
            };
            this._depList.push(dep);
        }
        runExp(exp, scope) {
            return new Function("$data", "$parent", "$root", "return " + exp)(scope, scope.$parent ? scope.$parent : this._data, this._data);
        }
    }
    core.AresEntity = AresEntity;
})(core || (core = {}));
/// <reference path="core/AresEntity.ts"/>
/**
 * Created by Raykid on 2016/12/5.
 */
class Ares {
    /**
     * 创建一个数据绑定
     * @param viewModel 要绑定的数据对象
     * @param nameOrElement 要绑定到的DOM节点的名字或者引用
     * @param options 额外参数，参考AresOptions接口
     */
    static create(viewModel, nameOrElement, options) {
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
    }
}
//# sourceMappingURL=ares.js.map