/**
 * Created by Raykid on 2016/12/16.
 */
import { IAres, Compiler, AresOptions, IWatcher, WatcherCallback } from "./Interfaces";
/**
 * 将数据模型和视图进行绑定
 * @param model 数据模型
 * @param compiler 视图解析器，不同类型的视图需要使用不同的解析器解析后方可使用
 * @param options 一些额外参数
 * @returns {core.AresEntity} 绑定实体对象
 */
export declare function bind(data: any, compiler: Compiler, options?: AresOptions): IAres;
export declare class Ares implements IAres {
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
