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

    /** 文本域命令 */
    export function textContent(context:CommandContext):void
    {
        context.entity.createWatcher(context.exp, context.scope, (value:string)=>
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
            context.entity.createWatcher(context.exp, context.scope, (value:any)=>
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
            context.entity.createWatcher(context.exp, context.scope, (value:boolean)=>
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
        }
    }
}