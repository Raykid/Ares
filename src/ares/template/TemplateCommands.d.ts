import { Compiler, IAres } from "../Interfaces";
/**
 * Created by Raykid on 2017/3/17.
 */
export interface TemplateNode {
    cmd: string;
    exp: string;
    children?: TemplateNode[];
    /** 暂存结果用 */
    value?: string;
}
export interface CommandContext {
    node: TemplateNode;
    scope: any;
    compiler: Compiler;
    entity: IAres;
}
export interface Command {
    (context?: CommandContext): void;
}
export declare function getChildrenString(node: TemplateNode): string;
export declare function compileChildren(node: TemplateNode, scope: any, compiler: Compiler): void;
/**
 * 提供给外部的可以注入自定义命令的接口
 * @param name
 * @param command
 */
export declare function addCommand(name: string, command: Command): void;
export declare const commands: {
    [name: string]: Command;
};
