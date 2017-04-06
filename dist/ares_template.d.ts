/**
 * Created by Raykid on 2016/12/28.
 */
declare module ares.template
{
    export interface TemplateNode
    {
        cmd:string;
        exp:string;
        children?:TemplateNode[];
    }

    export interface CommandContext
    {
        node:TemplateNode;
        scope:any;
        compiler:Compiler;
        entity:IAres;
    }

    export interface Command
    {
        (context?:CommandContext):void;
    }

    export interface PIXIBindConfig
    {
        [name:string]:PIXIBindConfigCommands
    }

    export interface PIXIBindConfigCommands
    {
        [cmd:string]:any;
    }

    export function getChildrenString(node:TemplateNode):string;

    export function compileChildren(node:TemplateNode, scope:any, compiler:Compiler):void;

    /**
     * 提供给外部的可以注入自定义命令的接口
     * @param name
     * @param command
     */
    export function addCommand(name:string, command:Command):void;

    export class TemplateCompiler
    {
        root:TemplateNode;
        constructor(template:string, onUpdate:(text:string)=>void, config?:PIXIBindConfig);
        compile(node:TemplateNode, scope:any):void;
        init(entity:IAres):void;
    }
}

declare module "ares.template"
{
    export = ares.template;
}