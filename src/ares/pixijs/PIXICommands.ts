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
        /** 文本命令 */
        text: (context:CommandContext)=>
        {
            context.entity.createWatcher(context.exp, context.scope, (value:string)=>
            {
                var text:PIXI.Text = context.target as PIXI.Text;
                text.text = value;
            });
        }
    }
}