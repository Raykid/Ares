/**
 * Created by Raykid on 2016/12/28.
 */
declare module ares.pixijs
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

    export interface PIXIBindConfig
    {
        [name:string]:PIXIBindConfigCommands
    }

    export interface PIXIBindConfigCommands
    {
        [cmd:string]:any;
    }

    /**
     * 提供给外部的可以注入自定义命令的接口
     * @param name
     * @param command
     */
    export function addCommand(name:string, command:Command):void;

    export class PIXICompiler
    {
        constructor(root:PIXI.DisplayObject, config?:PIXIBindConfig);
        compile(node:PIXI.DisplayObject, scope:any):void;
        init(entity:IAres):void;
    }
}

declare module "ares.pixijs"
{
    export = ares.pixijs;
}