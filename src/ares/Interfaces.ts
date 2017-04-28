/**
 * Created by Raykid on 2016/12/22.
 */
export interface Compiler
{
    /** 传递给编译器的皮肤对象 */
    root:any;
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
    /** 获取编译器 */
    compiler:Compiler;

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
    inited?:(entity?:IAres)=>void;
}

export interface IWatcher
{
    /**
     * 获取到表达式当前最新值
     * @returns {any} 最新值
     */
    getValue():any;
    /**
     * 当依赖的数据有更新时调用该方法
     * @param extra 可能的额外数据
     */
    update(extra?:any):void;
    /** 销毁订阅者 */
    dispose():void;
}

export interface WatcherCallback
{
    (newValue?:any, oldValue?:any, extra?:any):void;
}