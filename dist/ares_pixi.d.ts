/**
 * Created by Raykid on 2016/12/28.
 */
declare module ares.pixijs
{
    export interface PIXIBindConfig
    {
        [name:string]:PIXIBindConfigCommands
    }

    export interface PIXIBindConfigCommands
    {
        [cmd:string]:any;
    }

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