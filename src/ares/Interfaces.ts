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
    /**
     * 解析表达式成为命令数据
     * @param key 属性名，合法的属性名应以a-或a_开头，以:或$分隔主命令和子命令
     * @param value 属性值，如果属性名合法则会被用来作为表达式的字符串
     * @return {CommandData|null} 命令数据，如果不是命令则返回null
     */
    parseCommand(key:string, value:string):AresCommandData;
    /**
     * 测试是否是通用命令
     * @param data 命令数据
     * @return {boolean} 返回一个布尔值，表示该表达式是否是通用命令
     */
    testCommand(data:AresCommandData):boolean;
    /**
     * 执行通用命令，如果该表达式是通用命令则直接执行，否则什么都不做
     * @param data 命令数据
     * @param target 目标对象
     * @param scope 变量作用域
     * @return {boolean} 返回一个布尔值，表示该表达式是否是通用命令
     */
    execCommand(data:AresCommandData, target:any, scope:any):boolean
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

export interface AresCommandData
{
    /** 主命令名 */
    cmdName:string;
    /** 子命令名 */
    subCmd:string;
    /** 命令属性全名 */
    propName:string;
    /** 表达式 */
    exp:string;
}