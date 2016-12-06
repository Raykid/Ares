/**
 * Created by Raykid on 2016/12/5.
 */
namespace core
{
    export class AresEntity
    {
        private _record:any;
        private _data:any;
        private _element:HTMLElement;

        //private _depMap:{[path:string]:Dep} = {};
        private _depList:Dep[] = [];

        public constructor(data:any, element:HTMLElement)
        {
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
        private proxyData(data:any, path:string[]):any
        {
            var result:any = {};
            // 记录当前层次所有的属性，如果有复杂类型对象则递归之
            var keys:string[] = Object.keys(data);
            for(var i:number = 0, len:number = keys.length; i < len; i++)
            {
                var key:string = keys[i];
                var value:any = data[key];
                switch(typeof value)
                {
                    case "object":
                        // 复杂类型，需要递归
                        var temp:string[] = path.concat();
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

        private getProxy(result:any, key:string):void
        {
            return result[key];
        }

        private setProxy(result:any, key:string, path:string[], value:any):void
        {
            result[key] = value;
            // 设置了一个属性，去寻找对应的依赖
            this.updateDeps();
        }

        private updateDeps():void
        {
            //var depKey:string = `${path.join(".")}.${key}`;
            for(var i:number = 0, len:number = this._depList.length; i < len; i++)
            {
                var dep:Dep = this._depList[i];
                if(dep)
                {
                    var result:any = dep.exp;
                    var reg:RegExp = /\{\{(.*?)\}\}/;
                    for(var temp:RegExpExecArray = reg.exec(result); temp != null; temp = reg.exec(result))
                    {
                        // 获取表达式
                        var exp:string = temp[1];
                        // 计算表达式的值
                        var value:any = this.runExp(exp, this._data);
                        result = result.substr(0, temp.index) + value + result.substr(temp.index + temp.input.length);
                    }
                    // 设置依赖对象的属性
                    dep.target[dep.key] = result;
                }
            }
        }

        private walkThrough(element:HTMLElement):void
        {
            // 创建依赖
            var dep:Dep = {
                target: element,
                key: "textContent",
                exp: element.textContent,
                scope: this._data
            };
            this._depList.push(dep);
        }

        private runExp(exp:string, scope:any):any
        {
            return new Function(
                "$data",
                "$parent",
                "$root",
                "return " + exp)
            (
                scope,
                scope.$parent ? scope.$parent : this._data,
                this._data
            );
        }
    }

    interface Dep
    {
        /** 依赖的目标节点对象 */
        target:any;
        /** 依赖的属性名 */
        key:string;
        /** 依赖的表达式 */
        exp:string;
        /** 依赖所在的词法作用域 */
        scope:any;
    }
}