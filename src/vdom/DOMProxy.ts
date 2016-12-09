/**
 * Created by Raykid on 2016/12/9.
 */
namespace vdom
{
    export class DOMProxy
    {
        private _target:HTMLElement;

        public constructor(target:HTMLElement)
        {
            this._target = target;
            // 代理目标
            this.proxyNode(target);
            // 代理所有的子对象

        }

        private proxyNode(node:any):void
        {
            // 先遍历当前节点的所有属性和方法
            for(var name in node)
            {
                var value:any = this._target[name];
                if(typeof value == "function") this.proxyMethod(name, value);
                else this.proxyProperty(name, value);
            }
            // 递归遍历原型节点
            if(node.__proto__) this.proxyNode(node.__proto__);
        }

        private proxyProperty(name:string, value:any):void
        {
            if(this.hasOwnProperty(name)) return;
            Object.defineProperty(this, name, {
                get: ()=>value,
                set: v=>{
                    this._target[name] = v;
                    // Do something
                }
            });
        }

        private proxyMethod(name:string, value:any):void
        {
            if(this.hasOwnProperty(name)) return;
            this[name] = function()
            {
                value.call(this._target, arguments);
                // Do something
            };
        }
    }
}