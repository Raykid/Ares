declare module "Interfaces" {
    /**
     * Created by Raykid on 2016/12/22.
     */
    export interface Compiler {
        /** 传递给编译器的皮肤对象 */
        root: any;
        /**
         * 初始化编译器
         * @param entity Ares实例
         */
        init(entity: IAres): void;
        /**
         * 编译方法
         * @param target 要编译的显示节点
         * @param scope 作用域
         */
        compile(target: any, scope: any): void;
    }
    export interface IAres {
        /** 获取ViewModel */
        data: any;
        /** 获取编译器 */
        compiler: Compiler;
        /**
         * 创建一个订阅者
         * @param target 作用目标，指表达式所在的显示对象
         * @param exp 表达式
         * @param scope 作用域
         * @param callback 订阅器回调
         */
        createWatcher(target: any, exp: string, scope: any, callback: WatcherCallback): IWatcher;
    }
    export interface AresOptions {
        inited?: (entity?: IAres) => void;
    }
    export interface IWatcher {
        /**
         * 获取到表达式当前最新值
         * @returns {any} 最新值
         */
        getValue(): any;
        /**
         * 当依赖的数据有更新时调用该方法
         * @param extra 可能的额外数据
         */
        update(extra?: any): void;
        /** 销毁订阅者 */
        dispose(): void;
    }
    export interface WatcherCallback {
        (newValue?: any, oldValue?: any, extra?: any): void;
    }
}
declare module "template/TemplateCommands" {
    import { Compiler, IAres } from "Interfaces";
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
    export function getChildrenString(node: TemplateNode): string;
    export function compileChildren(node: TemplateNode, scope: any, compiler: Compiler): void;
    /**
     * 提供给外部的可以注入自定义命令的接口
     * @param name
     * @param command
     */
    export function addCommand(name: string, command: Command): void;
    export const commands: {
        [name: string]: Command;
    };
}
declare module "template/TemplateCompiler" {
    import { IAres, Compiler } from "Interfaces";
    import { TemplateNode } from "template/TemplateCommands";
    /**
     * Created by Raykid on 2017/3/17.
     */
    export interface PIXIBindConfig {
        [name: string]: PIXIBindConfigCommands;
    }
    export interface PIXIBindConfigCommands {
        [cmd: string]: any;
    }
    export class TemplateCompiler implements Compiler {
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
}
