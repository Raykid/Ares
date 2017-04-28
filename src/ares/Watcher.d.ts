import { IAres, IWatcher, WatcherCallback } from "./Interfaces";
/**
 * Created by Raykid on 2016/12/22.
 * 数据更新订阅者，当依赖的数据有更新时会触发callback通知外面
 */
export declare class Watcher implements IWatcher {
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
