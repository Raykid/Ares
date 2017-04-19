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
    /**
     * 获取全局模板对象，该模板在任何地方都生效
     * @param name 模板名称
     * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
     */
    export function getTemplate(name:string):PIXI.DisplayObject;

    /**
     * 设置全局模板对象，该模板在任何地方都生效
     * @param name 模板名称
     * @param tpl 模板对象
     * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
     */
    export function setTemplate(name:string, tpl:PIXI.DisplayObject):PIXI.DisplayObject;

    export class PIXICompiler
    {
        root:PIXI.DisplayObject;
        constructor(root:PIXI.DisplayObject, config?:PIXIBindConfig, tplDict?:{[name:string]:PIXI.DisplayObject});
        compile(node:PIXI.DisplayObject, scope:any):void;
        init(entity:IAres):void;
        /**
         * 获取模板对象，该模板只在该PIXICompiler内部生效
         * @param name 模板名称
         * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
         */
        getTemplate(name:string):PIXI.DisplayObject;
        /**
         * 设置本地模板，该模板只在该PIXICompiler内部生效
         * @param name 模板名称
         * @param tpl 模板对象
         * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
         */
        setTemplate(name:string, tpl:PIXI.DisplayObject):PIXI.DisplayObject;
    }
}

declare module "ares.pixijs"
{
    export = ares.pixijs;
}