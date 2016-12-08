/// <reference path="Command.ts"/>

/**
 * Created by Raykid on 2016/12/5.
 */
namespace core
{
    export class AresEntity
    {
        private static _arrayMethods:string[] = [
            'push',
            'pop',
            'shift',
            'unshift',
            'splice',
            'sort',
            'reverse'
        ];

        private _data:any;
        private _element:HTMLElement;

        private _updaters:Updater[];

        public constructor(data:any, element:HTMLElement)
        {
            this._element = element;
            this._data = data;
            // 生成一个data的浅层拷贝对象，作为data原始值的保存
            this.proxyData(data, []);
            // 向data中加入$data、$parent和$root参数，都是data本身，用以构建一个Scope对象
            data.$data = data.$parent = data.$root = data;
            // 开始解析整个element，用整个data作为当前词法作用域
            this._updaters = this.compile(element, data);
            // 进行一次全局更新
            this.update();
        }

        /**
         * 为对象安插代理，会篡改对象中的实例为getter和setter，并且返回原始对象的副本
         * @param data 要篡改的对象
         * @param path 当前路径数组
         */
        private proxyData(data:any, path:string[]):void
        {
            var original:any = {};
            // 记录当前层次所有的属性，如果有复杂类型对象则递归之
            var keys:string[] = Object.keys(data);
            for(var i:number = 0, len:number = keys.length; i < len; i++)
            {
                var key:string = keys[i];
                var value:any = data[key];
                switch(typeof value)
                {
                    case "object":
                        if(value instanceof Array)
                        {
                            // 是数组，对于其自身要和简单类型一样处理
                            original[key] = value;
                            Object.defineProperty(data, key, {
                                configurable: true,
                                enumerable: true,
                                get: this.getProxy.bind(this, original, key),
                                set: this.setProxy.bind(this, original, key)
                            });
                            // 篡改数组的特定方法
                            var self:AresEntity = this;
                            AresEntity._arrayMethods.map((method:string)=>{
                                value[method] = function()
                                {
                                    // 调用原始方法
                                    Array.prototype[method].apply(this, arguments);
                                    // 更新
                                    self.update();
                                };
                            }, this);
                        }
                        else if(value == null)
                        {
                            // null和简单类型一样处理
                            original[key] = value;
                            // 篡改为getter和setter
                            Object.defineProperty(data, key, {
                                configurable: true,
                                enumerable: true,
                                get: this.getProxy.bind(this, original, key),
                                set: this.setProxy.bind(this, original, key)
                            });
                        }
                        else
                        {
                            // 复杂类型，需要递归
                            var temp:string[] = path.concat();
                            temp.push(key);
                            original[key] = this.proxyData(value, temp);
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
                            get: this.getProxy.bind(this, original, key),
                            set: this.setProxy.bind(this, original, key)
                        });
                        break;
                }
            }
            data.$original = original;
        }

        private getProxy(original:any, key:string):any
        {
            return original[key];
        }

        private setProxy(original:any, key:string, value:any):void
        {
            original[key] = value;
            this.update();
        }

        private update():void
        {
            // TODO Raykid 现在是全局更新，要改为条件更新
            for(var i:number = 0, len:number = this._updaters.length; i < len; i++)
            {
                this._updaters[i].update(this);
            }
        }

        public compile(element:HTMLElement, scope:Scope):Updater[]
        {
            // 检查节点上面以data-a-或者a-开头的属性，将其认为是绑定属性
            var attrs:NamedNodeMap = element.attributes;
            var bundles:{cmd:Cmd, attr:Attr, subCmd:string}[] = [];
            var stopCompile:boolean = false;
            for(var i:number = 0, len:number = attrs.length; i < len; i++)
            {
                var attr:Attr = attrs[i];
                var name:string = attr.name;
                // 所有ares属性必须以data-a-或者a-开头
                if(name.indexOf("a-") == 0 || name.indexOf("data-a-") == 0)
                {
                    var bIndex:number = (name.charAt(0) == "d" ? 7 : 2);
                    var eIndex:number = name.indexOf(":");
                    if(eIndex < 0) eIndex = name.length;
                    // 取到命令名
                    var cmdName:string = name.substr(bIndex, eIndex);
                    // 取到子命令名
                    var subCmd:string = name.substr(eIndex + 1);
                    // 用命令名取到命令依赖对象
                    var cmd:Cmd = Command.getCmd(cmdName);
                    if(cmd)
                    {
                        bundles.push({cmd: cmd, attr: attr, subCmd: subCmd});
                        // 更新编译子节点的属性
                        if(cmd.stopCompile)
                        {
                            stopCompile = true;
                            // 只剩下这一个命令
                            bundles.splice(0, bundles.length - 1);
                            break;
                        }
                    }
                }
            }
            // 排序cmd
            bundles.sort((a:{cmd:Cmd, attr:Attr, subCmd:string}, b:{cmd:Cmd, attr:Attr, subCmd:string})=>(b.cmd.priority || 0) - (a.cmd.priority || 0));
            // 开始执行cmd
            var updaters:Updater[] = [];
            for(var i:number = 0, len:number = bundles.length; i < len; i++)
            {
                var bundle:{cmd:Cmd, attr:Attr, subCmd:string} = bundles[i];
                // 生成一个更新项
                var updater:Updater = bundle.cmd.exec(element, bundle.attr.value, scope, subCmd);
                // TODO Raykid 现在是全局更新，要改为条件更新
                updaters.push(updater);
                // 从DOM节点上移除属性
                bundle.attr.ownerElement.removeAttributeNode(attr);
            }
            // 遍历子节点
            if(!stopCompile)
            {
                var children:HTMLCollection = element.children;
                for(var i:number = 0, len:number = children.length; i < len; i++)
                {
                    var child:HTMLElement = children[i] as HTMLElement;
                    var temp:Updater[] = this.compile(child, scope);
                    updaters = updaters.concat(temp);
                }
            }
            // 返回Updater
            return updaters;
        }
    }
}