/**
 * Created by Raykid on 2016/12/23.
 */
declare class HTMLCompiler
{
    compile(node:Node, scope:any):void;
    init(entity:any):void;
}

declare interface HTMLCompilerConstructor
{
    new (idOrElement:string|HTMLElement):HTMLCompiler;
}

declare interface AresStatic
{
    html: {
        HTMLCompiler: HTMLCompilerConstructor
    }
}

declare var ares:AresStatic;