/// <reference path="Command.ts"/>

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

        private _updaters:Updater[] = [];

        public constructor(data:any, element:HTMLElement)
        {
            this._element = element;
            this._data = data;
            // 生成一个data的浅层拷贝对象，作为data原始值的保存
            this._record = this.proxyData(data, []);
            // 向data中加入$parent和$root参数，都是data本身，用以构建一个Scope对象
            data.$parent = data.$root = data;
            // 开始解析整个element，用整个data作为当前词法作用域
            this.walkThrough(element, data);
            // 进行一次全局更新
            this.update();
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
                            set: this.setProxy.bind(this, result, key)
                        });
                        break;
                }
            }
            return result;
        }

        private getProxy(result:any, key:string):any
        {
            return result[key];
        }

        private setProxy(result:any, key:string, value:any):void
        {
            result[key] = value;
            this.update();
        }

        private walkThrough(element:HTMLElement, curScope:Scope):void
        {
            // 检查节点上面以data-a-或者a-开头的属性，将其认为是绑定属性
            var attrs:NamedNodeMap = element.attributes;
            for(var i:number = 0, len:number = attrs.length; i < len; i++)
            {
                var attr:Attr = attrs[i];
                var name:string = attr.name;
                // 所有ares属性必须以data-a-或者a-开头
                if(name.indexOf("a-") == 0 || name.indexOf("data-a-") == 0)
                {
                    var index:number = name.indexOf("a-") + 2;
                    // 取到命令名
                    var cmdName:string = name.substr(index);
                    // 用命令名取到命令依赖对象
                    var cmd:Cmd = Command.getCmd(cmdName);
                    if(cmd)
                    {
                        // 取到命令表达式
                        var cmdExp:string = attr.value;
                        // 看是否需要生成子域
                        if(cmd.subScope)
                        {
                            curScope = {
                                $parent: curScope,
                                $root: curScope.$root
                            };
                        }
                        // 生成一个更新项
                        var updater:Updater = cmd.exec(element, cmdExp, curScope);
                        // TODO Raykid 现在是全局更新，要改为条件更新
                        this._updaters.push(updater);
                        // 从DOM节点上移除属性
                        attr.ownerElement.removeAttributeNode(attr);
                        i --;
                        len --;
                    }
                }
            }
            // 遍历子节点
            var children:HTMLCollection = element.children;
            for(var i:number = 0, len:number = children.length; i < len; i++)
            {
                var child:HTMLElement = children[i] as HTMLElement;
                this.walkThrough(child, curScope);
            }
        }

        private update():void
        {
            // TODO Raykid 现在是全局更新，要改为条件更新
            for(var i:number = 0, len:number = this._updaters.length; i < len; i++)
            {
                this._updaters[i].update();
            }
        }
    }
}