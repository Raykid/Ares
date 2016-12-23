/**
 * Created by Raykid on 2016/12/22.
 */
namespace ares
{
    export class Dep
    {
        private _map:{[uid:number]:Watcher} = {};

        /**
         * 添加数据变更订阅者
         * @param watcher 数据变更订阅者
         */
        public watch(watcher:Watcher):void
        {
            if(!this._map[watcher.uid])
            {
                this._map[watcher.uid] = watcher;
            }
        }

        /**
         * 数据变更，通知所有订阅者
         * @param extra 可能的额外数据
         */
        public notify(extra?:any):void
        {
            for(var uid in this._map)
            {
                var watcher:Watcher = this._map[uid];
                watcher.update(extra);
            }
        }
    }
}