/// <reference path="Interfaces.ts"/>
/// <reference path="Mutator.ts"/>
/// <reference path="Utils.ts"/>

/**
 * Created by Raykid on 2016/12/16.
 */
namespace ares
{
    /**
     * 将数据模型和视图进行绑定
     * @param model 数据模型
     * @param compiler 视图解析器，不同类型的视图需要使用不同的解析器解析后方可使用
     * @param options 一些额外参数
     * @returns {core.AresEntity} 绑定实体对象
     */
    export function bind(data:any, compiler:Compiler, options?:ares.AresOptions):ares.IAres
    {
        return new Ares(data, compiler, options);
    }

    export class Ares implements IAres
    {
        private _data:any;
        private _compiler:Compiler;
        private _options:any;

        /** 获取ViewModel */
        public get data():any
        {
            return this._data;
        }

        /** 获取编译器 */
        public get compiler():Compiler
        {
            return this._compiler;
        }

        public constructor(data:any, compiler:ares.Compiler, options?:ares.AresOptions)
        {
            // 判断DOM是否已经生成完毕
            if(document.body)
            {
                // 如果DOM已经生成完毕，则直接执行初始化
                this.doInited(data, compiler, options);
            }
            else
            {
                // 如果DOM还没生成完毕，则等待生成完毕后再执行初始化
                window.onload = this.doInited.bind(this, data, compiler, options);
            }
        }

        private doInited(data:any, compiler:ares.Compiler, options:ares.AresOptions):void
        {
            // 记录变异对象
            this._data = ares.Mutator.mutate(data);
            this._compiler = compiler;
            this._options = options;
            // 初始化Compiler
            this._compiler.init(this);
            // 调用回调
            if(this._options && this._options.inited)
            {
                this._options.inited.call(this._data, this);
            }
        }

        public createWatcher(exp:string, scope:any, callback:WatcherCallback):IWatcher
        {
            return new Watcher(exp, scope, callback);
        }
    }
}