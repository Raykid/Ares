import { IAres, Compiler } from "../Interfaces";
import { TemplateNode } from "./TemplateCommands";
/**
 * Created by Raykid on 2017/3/17.
 */
export interface PIXIBindConfig {
    [name: string]: PIXIBindConfigCommands;
}
export interface PIXIBindConfigCommands {
    [cmd: string]: any;
}
export declare class TemplateCompiler implements Compiler {
    private _template;
    private _onUpdate;
    private _config;
    private _entity;
    private _scope;
    private _root;
    readonly root: TemplateNode;
    /**
     * 创建模板绑定
     * @param template 模板字符串
     * @param onUpdate 当文本有更新时调用，传入最新文本
     * @param config 绑定数据
     */
    constructor(template: string, onUpdate: (text: string) => void, config?: PIXIBindConfig);
    init(entity: IAres): void;
    compile(node: TemplateNode, scope: any): void;
    private update();
    private mutateValue(node);
    private getEndIndex(str, startIndex);
    private transformToNode(str);
}
