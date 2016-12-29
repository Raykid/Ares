/**
 * Created by Raykid on 2016/12/23.
 */
declare module ares.html
{
    export interface Command
    {
        (context?:CommandContext):void;
    }

    export interface CommandContext
    {
        scope:any;
        target:Node;
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
    export function addCommand(name:string, command:Command):void;

    export class HTMLCompiler
    {
        constructor(selectorsOrElement:string|HTMLElement);
        compile(node:Node, scope:any):void;
        init(entity:IAres):void;
    }
}

declare module "ares.html"
{
    export = ares.html;
}