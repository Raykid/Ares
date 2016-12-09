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
        private _dirtyMap:{[name:string]:any} = {};
        private _dirtyId:number = 0;
        private _forceUpdate:boolean = false;

        public constructor(data:any, element:HTMLElement)
        {
            this._element = element;
            this._data = data;
            // 向data中加入$data、$parent和$root参数，都是data本身，用以构建一个Scope对象
            var func:()=>any = ()=>data;
            Object.defineProperties(data, {
                $data: {get: func},
                $parent: {get: func},
                $root: {get: func},
                $path: {get: ()=>""}
            });
            // 生成一个data的浅层拷贝对象，作为data原始值的保存
            this.proxyData(data);
            // 开始解析整个element，用整个data作为当前词法作用域
            this._updaters = this.compile(element, data);
            // 进行一次全局更新
            this.update(true);
        }

        /**
         * 为对象安插代理，会篡改对象中的实例为getter和setter，并且返回原始对象的副本
         * @param data 要篡改的对象
         */
        private proxyData(data:any):void
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
                                get: this.getProxy.bind(this, data, key),
                                set: this.setProxy.bind(this, data, key)
                            });
                            // 篡改数组的特定方法
                            var self:AresEntity = this;
                            AresEntity._arrayMethods.map((method:string)=>{
                                value[method] = function()
                                {
                                    // 调用原始方法
                                    Array.prototype[method].apply(this, arguments);
                                    // 更新
                                    self.setDirty(data.$path, key);
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
                                get: this.getProxy.bind(this, data, key),
                                set: this.setProxy.bind(this, data, key)
                            });
                        }
                        else
                        {
                            // 复杂类型，需要递归
                            Object.defineProperties(value, {
                                $data: {get: ()=>value},
                                $parent: {get: ()=>data},
                                $root: {get: ()=>data.$root},
                                $path: {get: ()=>(data === data.$root ? key : data.$path + "." + key)}
                            });
                            original[key] = this.proxyData(value);
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
                            get: this.getProxy.bind(this, data, key),
                            set: this.setProxy.bind(this, data, key)
                        });
                        break;
                }
            }
            Object.defineProperty(data, "$original", {get: ()=>original});
        }

        private getProxy(scope:Scope, key:string):any
        {
            return scope.$original[key];
        }

        private setProxy(scope:Scope, key:string, value:any):void
        {
            // 相等的话则不进行任何处理
            if(value == scope.$original[key]) return;
            scope.$original[key] = value;
            this.setDirty(scope.$path, key);
        }

        private setDirty(path:string, name:string):void
        {
            if(path != "") name = path + "." + name;
            this._dirtyMap[name] = true;
            // 计划渲染
            if(this._dirtyId == 0) this._dirtyId = setTimeout(this.render, 0, this);
        }

        private render(entity:AresEntity):void
        {
            entity._dirtyId = 0;
            entity.update();
        }

        private update(force?:boolean):void
        {
            this._forceUpdate = (force == true);
            var updaters:Updater[] = this._updaters;
            for(var i:number = 0, len:number = updaters.length; i < len; i++)
            {
                updaters[i].update(this);
            }
            // 清空dirtyMap
            for(var key in this._dirtyMap)
            {
                delete this._dirtyMap[key];
            }
            this._forceUpdate = false;
        }

        /**
         * 判断依赖项是否脏了
         * @param names 依赖项名字数组
         * @returns {boolean} 是否脏了
         */
        public dependDirty(names:string[]):boolean
        {
            if(this._forceUpdate) return true;
            for(var i:number = 0, len:number = names.length; i < len; i++)
            {
                if(this._dirtyMap[names[i]]) return true;
            }
            return false;
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
                    var cmdName:string = name.substring(bIndex, eIndex);
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
                var updater:Updater = bundle.cmd.exec(element, bundle.attr.value, scope, bundle.subCmd);
                updaters.push(updater);
                // 从DOM节点上移除属性
                if(bundle.attr) bundle.attr.ownerElement.removeAttributeNode(bundle.attr);
            }
            // 判断是否停止编译
            if(!stopCompile)
            {
                // 执行文本域命令
                var tcCmd:TextContentCmd = TextContentCmd.getInstance();
                if(tcCmd.needParse(element))
                {
                    // 添加文本域命令
                    updaters.push(tcCmd.exec(element, element.innerHTML, scope));
                }
                // 遍历子节点
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