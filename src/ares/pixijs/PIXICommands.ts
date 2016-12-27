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

    export const commands:{[name:string]:Command} = {
        /** 文本域命令 */
        textContent: (context:CommandContext)=>
        {
            context.entity.createWatcher(context.exp, context.scope, (value:string)=>
            {
                var text:PIXI.Text = context.target as PIXI.Text;
                text.text = value;
            });
        },
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
        }
    }
}