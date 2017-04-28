/**
 * Created by Raykid on 2016/12/22.
 */
import { Compiler, IAres } from "../Interfaces";
export declare class HTMLCompiler implements Compiler {
    private static _textExpReg;
    private _selectorsOrElement;
    private _root;
    private _entity;
    readonly root: HTMLElement;
    constructor(selectorsOrElement: string | HTMLElement);
    init(entity: IAres): void;
    compile(node: Node, scope: any): void;
    private compileTextContent(node, scope);
    private parseTextExp(exp);
}
