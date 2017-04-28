/**
 * Created by Raykid on 2016/12/22.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Dep = (function () {
    function Dep() {
        this._map = {};
    }
    /**
     * 添加数据变更订阅者
     * @param watcher 数据变更订阅者
     */
    Dep.prototype.watch = function (watcher) {
        if (!this._map[watcher.uid]) {
            this._map[watcher.uid] = watcher;
        }
    };
    /**
     * 数据变更，通知所有订阅者
     * @param extra 可能的额外数据
     */
    Dep.prototype.notify = function (extra) {
        for (var uid in this._map) {
            var watcher = this._map[uid];
            watcher.update(extra);
        }
    };
    return Dep;
}());
exports.Dep = Dep;
//# sourceMappingURL=Dep.js.map