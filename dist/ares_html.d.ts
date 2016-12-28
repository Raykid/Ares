/**
 * Created by Raykid on 2016/12/23.
 */
declare module ares.html
{
    export class HTMLCompiler
    {
        constructor(idOrElement:string|HTMLElement);
        compile(node:Node, scope:any):void;
        init(entity:IAres):void;
    }
}

declare module "ares.html"
{
    export = ares.html;
}