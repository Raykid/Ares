/**
 * Created by Raykid on 2016/12/23.
 */
declare interface Array<T> {
    $remove(item: T): Array<T>;
    $set(index: any, val: T): T;
}

declare module ares
{
    export function bind(data:any, compiler:ares.Compiler, options?:ares.AresOptions):ares.IAres;

    export interface Compiler
    {
        /**
         * 初始化编译器
         * @param entity Ares实例
         */
        init(entity:IAres):void;
        /**
         * 编译方法
         * @param target 要编译的显示节点
         * @param scope 作用域
         */
        compile(target:any, scope:any):void;
    }

    export interface IAres
    {
        /** 获取ViewModel */
        data:any;
        /**
         * 创建一个订阅者
         * @param target 作用目标，指表达式所在的显示对象
         * @param exp 表达式
         * @param scope 作用域
         * @param callback 订阅器回调
         */
        createWatcher(target:any, exp:string, scope:any, callback:WatcherCallback):IWatcher;
    }

    export interface AresOptions
    {
        inited:(entity?:IAres)=>void;
    }

    export interface IWatcher
    {
        /**
         * 获取到表达式当前最新值
         * @returns {any} 最新值
         */
        getValue():any
        /**
         * 当依赖的数据有更新时调用该方法
         * @param extra 可能的额外数据
         */
        update(extra?:any):void
    }

    export interface WatcherCallback
    {
        (newValue?:any, oldValue?:any, extra?:any):void;
    }

    export module utils
    {
        /**
         * 创建一个表达式求值方法，用于未来执行
         * @param exp 表达式
         * @returns {Function} 创建的方法
         */
        export function createEvalFunc(exp:string):(scope:any)=>any;

        /**
         * 表达式求值，无法执行多条语句
         * @param exp 表达式
         * @param scope 表达式的作用域
         * @returns {any} 返回值
         */
        export function evalExp(exp:string, scope:any):any;

        /**
         * 创建一个执行方法，用于未来执行
         * @param exp 表达式
         * @returns {Function} 创建的方法
         */
        export function createRunFunc(exp:string):(scope:any)=>void;

        /**
         * 直接执行表达式，不求值。该方法可以执行多条语句
         * @param exp 表达式
         * @param scope 表达式的作用域
         */
        export function runExp(exp:string, scope:any):void;
    }
}

declare module "ares"
{
    export = ares;
}