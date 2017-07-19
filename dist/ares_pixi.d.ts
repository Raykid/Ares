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
        /**
         * 解析表达式成为命令数据
         * @param key 属性名，合法的属性名应以a-或a_开头，以:或$分隔主命令和子命令
         * @param value 属性值，如果属性名合法则会被用来作为表达式的字符串
         * @return {CommandData|null} 命令数据，如果不是命令则返回null
         */
        parseCommand(key: string, value: string): AresCommandData;
        /**
         * 测试是否是通用命令
         * @param data 命令数据
         * @return {boolean} 返回一个布尔值，表示该表达式是否是通用命令
         */
        testCommand(data: AresCommandData): boolean;
        /**
         * 执行通用命令，如果该表达式是通用命令则直接执行，否则什么都不做
         * @param data 命令数据
         * @param target 目标对象
         * @param scope 变量作用域
         * @return {boolean} 返回一个布尔值，表示该表达式是否是通用命令
         */
        execCommand(data: AresCommandData, target: any, scope: any): boolean;
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
    export interface AresCommandData {
        /** 主命令名 */
        cmdName: string;
        /** 子命令名 */
        subCmd: string;
        /** 命令属性全名 */
        propName: string;
        /** 表达式 */
        exp: string;
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
declare module "pixijs/ViewPortHandler" {
    export interface ViewPortHandlerOptions {
        oneway?: boolean;
        lockH?: boolean;
        lockV?: boolean;
    }
    export class ViewPortHandler {
        private static DIRECTION_H;
        private static DIRECTION_V;
        private _target;
        private _viewPort;
        private _ticker;
        private _masker;
        private _options;
        private _movableH;
        private _movableV;
        private _downTarget;
        private _downPoint;
        private _lastPoint;
        private _lastTime;
        private _speed;
        private _dragging;
        private _direction;
        constructor(target: PIXI.DisplayObject, options?: ViewPortHandlerOptions);
        private onPointerDown(evt);
        private onPointerMove(evt);
        private onPointerUp(evt);
        private getContentBounds(targetX, targetY);
        private getDelta(targetX, targetY);
        private moveTarget(x, y);
        private onTick(delta);
        /**
         * 设置视点范围
         * @param x 视点横坐标
         * @param y 视点纵坐标
         * @param width 视点宽度
         * @param height 视点高度
         */
        setViewPort(x: number, y: number, width: number, height: number): void;
    }
}
declare module "pixijs/PIXICommands" {
    import { IAres, AresCommandData } from "Interfaces";
    import { PIXICompiler, CmdDict } from "pixijs/PIXICompiler";
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
        compiler: PIXICompiler;
        entity: IAres;
        cmdData: AresCommandData;
        cmdDict: CmdDict;
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
    import { IAres, Compiler, AresCommandData } from "Interfaces";
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
    export interface CmdDict {
        [cmdName: string]: AresCommandData[];
    }
    export class PIXICompiler implements Compiler {
        private static _textRegExp;
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
        private compileTextContent(text, scope, cmdDict);
        private parseTextExp(exp);
    }
}
