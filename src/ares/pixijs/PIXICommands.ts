/**
 * Created by Raykid on 2016/12/27.
 */
namespace ares.pixijs
{
    export interface Command
    {
        (context?:CommandContext):void;
    }

    export interface CommandContext
    {
        scope:any;
        target:PIXI.DisplayObject;
        subCmd:string;
        exp:string;
        compiler:Compiler;
        entity:IAres;
        [name:string]:any;
    }

    /**
     * 提供给外部的可以注入自定义命令的接口
     * @param name
     * @param command
     */
    export function addCommand(name:string, command:Command):void
    {
        if(!commands[name]) commands[name] = command;
    }

    /** 文本域命令 */
    export function textContent(context:CommandContext):void
    {
        context.entity.createWatcher(context.target, context.exp, context.scope, (value:string)=>
        {
            var text:PIXI.Text = context.target as PIXI.Text;
            text.text = value;
        });
    }

    export const commands:{[name:string]:Command} = {
        /** 修改任意属性命令 */
        prop: (context:CommandContext)=>
        {
            var target:PIXI.DisplayObject = context.target;
            context.entity.createWatcher(context.target, context.exp, context.scope, (value:any)=>
            {
                if(context.subCmd != "")
                {
                    // 子命令形式
                    target[context.subCmd] = value;
                }
                else
                {
                    // 集成形式，遍历所有value的key，如果其表达式值为true则添加其类型
                    for(var name in value)
                    {
                        target[name] = value[name];
                    }
                }
            });
        },
        /** 绑定事件 */
        on: (context:CommandContext)=>
        {
            if(context.subCmd != "")
            {
                var handler:Function = context.scope[context.exp] || window[context.exp];
                if(typeof handler == "function")
                {
                    // 是函数名形式
                    context.target.on(context.subCmd, handler, context.scope);
                }
                else
                {
                    // 是方法执行或者表达式方式
                    context.target.on(context.subCmd, (evt:Event)=>
                    {
                        // 创建一个临时的子域，用于保存参数
                        var scope:any = Object.create(context.scope);
                        scope.$event = evt;
                        scope.$target = context.target;
                        ares.utils.runExp(context.exp, scope);
                    });
                }
            }
        },
        /** if命令 */
        if: (context:CommandContext)=>
        {
            // 记录一个是否编译过的flag
            var compiled:boolean = false;
            // 插入一个占位元素
            var refNode:PIXI.DisplayObject = new PIXI.DisplayObject();
            refNode.interactive = refNode.interactiveChildren = false;
            var parent:PIXI.Container = context.target.parent;
            var index:number = parent.getChildIndex(context.target);
            parent.addChildAt(refNode, index);
            // 只有在条件为true时才启动编译
            context.entity.createWatcher(context.target, context.exp, context.scope, (value:boolean)=>
            {
                if(value == true)
                {
                    // 启动编译
                    if(!compiled)
                    {
                        context.compiler.compile(context.target, context.scope);
                        compiled = true;
                    }
                    // 插入节点
                    if(!context.target.parent)
                    {
                        var index:number = refNode.parent.getChildIndex(refNode);
                        refNode.parent.addChildAt(context.target, index);
                    }
                }
                else
                {
                    // 移除元素
                    if(context.target.parent)
                    {
                        context.target.parent.removeChild(context.target);
                    }
                }
            });
        },
        /** for命令 */
        for: (context:CommandContext)=>
        {
            // 解析表达式
            var reg:RegExp = /^\s*(\S+)\s+in\s+(\S+)\s*$/;
            var res:RegExpExecArray = reg.exec(context.exp);
            if(!res)
            {
                console.error("for命令表达式错误：" + context.exp);
                return;
            }
            var itemName:string = res[1];
            var arrName:string = res[2];
            var parent:PIXI.Container = context.target.parent;
            var sNode:PIXI.DisplayObject = new PIXI.DisplayObject();
            sNode.interactive = sNode.interactiveChildren = false;
            var eNode:PIXI.DisplayObject = new PIXI.DisplayObject();
            eNode.interactive = eNode.interactiveChildren = false;
            // 替换原始模板
            var index:number = parent.getChildIndex(context.target);
            parent.addChildAt(sNode, index);
            parent.addChildAt(eNode, index + 1);
            parent.removeChild(context.target);
            // 添加订阅
            context.entity.createWatcher(context.target, arrName, context.scope, (value:any)=>{
                // 清理原始显示
                var bIndex:number = parent.getChildIndex(sNode);
                var eIndex:number = parent.getChildIndex(eNode);
                for(var i:number = bIndex + 1; i < eIndex; i++)
                {
                    parent.removeChildAt(i).destroy();
                }
                // 如果是数字，构建一个数字列表
                if(typeof value == "number")
                {
                    var temp:number[] = [];
                    for(var i:number = 0; i < value; i++)
                    {
                        temp.push(i);
                    }
                    value = temp;
                }
                // 开始遍历
                var curIndex:number = 0;
                for(var key in value)
                {
                    // 拷贝一个target
                    var newNode:PIXI.DisplayObject = cloneObject(context.target);
                    // 添加到显示里
                    parent.addChildAt(newNode, (bIndex + 1) + curIndex);
                    // 生成子域
                    var newScope:any = Object.create(context.scope);
                    newScope.$index = key;
                    newScope[itemName] = value[key];
                    // 开始编译新节点
                    context.compiler.compile(newNode, newScope);
                    // 索引自增1
                    curIndex ++;
                }
            });
        }
    };

    function cloneObject<T>(target:T):T
    {
        if(!target || typeof target != "object") return target;
        // 如果对象有clone方法则直接调用clone方法
        if(typeof target["clone"] == "function") return target["clone"]();
        var cls:any = (target.constructor || Object);
        try
        {
            var result:T = new cls();
        }
        catch(err)
        {
            return null;
        }
        var keys:string[] = Object.keys(target);
        for(var i in keys)
        {
            var key:string = keys[i];
            // parent属性不复制
            if(key == "parent") continue;
            // Text组件不能复制_texture属性
            if(key == "_texture" && target instanceof PIXI.Text) continue;
            // children属性要特殊处理
            if(key == "children")
            {
                var children:PIXI.DisplayObject[] = target["children"];
                for(var j in children)
                {
                    var child:PIXI.DisplayObject = cloneObject(children[j]);
                    result["addChild"](child);
                }
            }
            else
            {
                var value:any = cloneObject(target[key]);
                if(value !== null) result[key] = value;
            }
        }
        return result;
    }
}