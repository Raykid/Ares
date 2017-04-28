/**
 * Created by Raykid on 2016/12/22.
 */
import { Compiler, IAres } from "../Interfaces";
export interface Command {
    (context?: CommandContext): void;
}
export interface CommandContext {
    scope: any;
    target: Node;
    subCmd: string;
    exp: string;
    compiler: Compiler;
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
