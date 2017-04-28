/**
 * Created by Raykid on 2016/12/22.
 */
import { Watcher } from "./Watcher";
export declare class Dep {
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
