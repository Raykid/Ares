import { IAres } from "../Interfaces";
import { PIXICompiler } from "./PIXICompiler";
/**
 * Created by Raykid on 2016/12/27.
 */
export interface Command {
    /**
     * 执行命令
     * @param context 命令上下文
     * @return {PIXI.DisplayObject} 要替换原显示节点的显示节点
     */
    (context?: CommandContext): PIXI.DisplayObject;
}
export interface CommandContext {
    scope: any;
    target: PIXI.DisplayObject;
    subCmd: string;
    exp: string;
    compiler: PIXICompiler;
    entity: IAres;
    [name: string]: any;
}
/**
 * 提供给外部的可以注入自定义命令的接口
 * @param name
 * @param command
 */
export declare function addCommand(name: string, command: Command): void;
/** 文本域命令 */
export declare function textContent(context: CommandContext): void;
export declare const commands: {
    [name: string]: Command;
};
