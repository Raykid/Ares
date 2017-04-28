/// <reference path="../src/ares/pixijs/pixi.js.d.ts" />
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
declare module "Utils" {
    /**
     * Created by Raykid on 2016/12/22.
     */
    /**
     * 创建一个表达式求值方法，用于未来执行
     * @param exp 表达式
     * @returns {Function} 创建的方法
     */
    export function createEvalFunc(exp: string): (scope: any) => any;
    /**
     * 表达式求值，无法执行多条语句
     * @param exp 表达式
     * @param scope 表达式的作用域
     * @returns {any} 返回值
     */
    export function evalExp(exp: string, scope: any): any;
    /**
     * 创建一个执行方法，用于未来执行
     * @param exp 表达式
     * @returns {Function} 创建的方法
     */
    export function createRunFunc(exp: string): (scope: any) => void;
    /**
     * 直接执行表达式，不求值。该方法可以执行多条语句
     * @param exp 表达式
     * @param scope 表达式的作用域
     */
    export function runExp(exp: string, scope: any): void;
}
declare module "Watcher" {
    import { IAres, IWatcher, WatcherCallback } from "Interfaces";
    /**
     * Created by Raykid on 2016/12/22.
     * 数据更新订阅者，当依赖的数据有更新时会触发callback通知外面
     */
    export class Watcher implements IWatcher {
        /** 记录当前正在执行update方法的Watcher引用 */
        static updating: Watcher;
        private static _uid;
        private _uid;
        /** 获取Watcher的全局唯一ID */
        readonly uid: number;
        private _value;
        private _entity;
        private _target;
        private _exp;
        private _scope;
        private _expFunc;
        private _callback;
        private _disposed;
        constructor(entity: IAres, target: any, exp: string, scope: any, callback: WatcherCallback);
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
        /**
         * 是否相等，包括基础类型和对象/数组的对比
         */
        private static isEqual(a, b);
        /**
         * 是否为对象(包括数组、正则等)
         */
        private static isObject(obj);
        /**
         * 复制对象，若为对象则深度复制
         */
        private static deepCopy(from);
    }
}
declare module "Dep" {
    /**
     * Created by Raykid on 2016/12/22.
     */
    import { Watcher } from "Watcher";
    export class Dep {
        private _map;
        /**
         * 添加数据变更订阅者
         * @param watcher 数据变更订阅者
         */
        watch(watcher: Watcher): void;
        /**
         * 数据变更，通知所有订阅者
         * @param extra 可能的额外数据
         */
        notify(extra?: any): void;
    }
}
declare module "Mutator" {
    export class Mutator {
        private static _arrMethods;
        /**
         * 将用户传进来的数据“变异”成为具有截获数据变更能力的数据
         * @param data 原始数据
         * @returns {any} 变异后的数据
         */
        static mutate(data: any): any;
        private static mutateObject(data, key, value);
        private static mutateArray(arr, dep);
        private static defineReactiveArray(dep);
    }
}
declare module "Ares" {
    /**
     * Created by Raykid on 2016/12/16.
     */
    import { IAres, Compiler, AresOptions, IWatcher, WatcherCallback } from "Interfaces";
    /**
     * 将数据模型和视图进行绑定
     * @param model 数据模型
     * @param compiler 视图解析器，不同类型的视图需要使用不同的解析器解析后方可使用
     * @param options 一些额外参数
     * @returns {core.AresEntity} 绑定实体对象
     */
    export function bind(data: any, compiler: Compiler, options?: AresOptions): IAres;
    export class Ares implements IAres {
        private _data;
        private _compiler;
        private _options;
        /** 获取ViewModel */
        readonly data: any;
        /** 获取编译器 */
        readonly compiler: Compiler;
        constructor(data: any, compiler: Compiler, options?: AresOptions);
        createWatcher(target: any, exp: string, scope: any, callback: WatcherCallback): IWatcher;
    }
}
declare module "pixijs/PIXICommands" {
    import { IAres } from "Interfaces";
    import { PIXICompiler } from "pixijs/PIXICompiler";
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
    export function addCommand(name: string, command: Command): void;
    /** 文本域命令 */
    export function textContent(context: CommandContext): void;
    export const commands: {
        [name: string]: Command;
    };
}
declare module "pixijs/PIXICompiler" {
    import { IAres, Compiler } from "Interfaces";
    /**
     * Created by Raykid on 2016/12/27.
     */
    export interface PIXIBindConfig {
        [name: string]: PIXIBindConfigCommands;
    }
    export interface PIXIBindConfigCommands {
        [cmd: string]: any;
    }
    /**
     * 获取全局模板对象，该模板在任何地方都生效
     * @param name 模板名称
     * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
     */
    export function getTemplate(name: string): PIXI.DisplayObject;
    /**
     * 设置全局模板对象，该模板在任何地方都生效
     * @param name 模板名称
     * @param tpl 模板对象
     * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
     */
    export function setTemplate(name: string, tpl: PIXI.DisplayObject): PIXI.DisplayObject;
    export class PIXICompiler implements Compiler {
        private static _textExpReg;
        private _root;
        private _config;
        private _entity;
        private _nameDict;
        private _tplDict;
        /** 获取根显示对象 */
        readonly root: PIXI.DisplayObject;
        /**
         * 创建PIXI绑定
         * @param root 根显示对象，从这里传入的绑定数据属性名必须以“a_”开头
         * @param config 绑定数据，从这里传入的绑定数据属性名可以不以“a_”开头
         * @param tplDict 模板字典，可以在这里给出模板定义表
         */
        constructor(root: PIXI.DisplayObject, config?: PIXIBindConfig, tplDict?: {
            [name: string]: PIXI.DisplayObject;
        });
        private parseCmd(node);
        private parseTpl(node);
        init(entity: IAres): void;
        compile(node: PIXI.DisplayObject, scope: any): void;
        /**
         * 获取模板对象，该模板只在该PIXICompiler内部生效
         * @param name 模板名称
         * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
         */
        getTemplate(name: string): PIXI.DisplayObject;
        /**
         * 设置模板，该模板只在该PIXICompiler内部生效
         * @param name 模板名称
         * @param tpl 模板对象
         * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
         */
        setTemplate(name: string, tpl: PIXI.DisplayObject): PIXI.DisplayObject;
        private compileTextContent(text, scope);
        private parseTextExp(exp);
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
declare module "html/HTMLCommands" {
    /**
     * Created by Raykid on 2016/12/22.
     */
    import { Compiler, IAres } from "Interfaces";
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
    export function addCommand(name: string, command: Command): void;
    /** 文本域命令 */
    export function textContent(context: CommandContext): void;
    export const commands: {
        [name: string]: Command;
    };
}
declare module "html/HTMLCompiler" {
    /**
     * Created by Raykid on 2016/12/22.
     */
    import { Compiler, IAres } from "Interfaces";
    export class HTMLCompiler implements Compiler {
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
}
