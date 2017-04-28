/**
 * Created by Raykid on 2016/12/22.
 */
declare namespace ares {
    interface Compiler {
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
    interface IAres {
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
    interface AresOptions {
        inited?: (entity?: IAres) => void;
    }
    interface IWatcher {
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
    interface WatcherCallback {
        (newValue?: any, oldValue?: any, extra?: any): void;
    }
    class Dep {
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
    class Watcher implements IWatcher {
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
        constructor(entity: ares.IAres, target: any, exp: string, scope: any, callback: WatcherCallback);
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
    class Mutator {
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
    /**
     * 创建一个表达式求值方法，用于未来执行
     * @param exp 表达式
     * @returns {Function} 创建的方法
     */
    function createEvalFunc(exp: string): (scope: any) => any;
    /**
     * 表达式求值，无法执行多条语句
     * @param exp 表达式
     * @param scope 表达式的作用域
     * @returns {any} 返回值
     */
    function evalExp(exp: string, scope: any): any;
    /**
     * 创建一个执行方法，用于未来执行
     * @param exp 表达式
     * @returns {Function} 创建的方法
     */
    function createRunFunc(exp: string): (scope: any) => void;
    /**
     * 直接执行表达式，不求值。该方法可以执行多条语句
     * @param exp 表达式
     * @param scope 表达式的作用域
     */
    function runExp(exp: string, scope: any): void;
    /**
     * 将数据模型和视图进行绑定
     * @param model 数据模型
     * @param compiler 视图解析器，不同类型的视图需要使用不同的解析器解析后方可使用
     * @param options 一些额外参数
     * @returns {core.AresEntity} 绑定实体对象
     */
    function bind(data: any, compiler: Compiler, options?: ares.AresOptions): ares.IAres;
    class Ares implements IAres {
        private _data;
        private _compiler;
        private _options;
        /** 获取ViewModel */
        readonly data: any;
        /** 获取编译器 */
        readonly compiler: Compiler;
        constructor(data: any, compiler: ares.Compiler, options?: ares.AresOptions);
        createWatcher(target: any, exp: string, scope: any, callback: WatcherCallback): IWatcher;
    }
}
declare var module: any;
