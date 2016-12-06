/// <reference path="core/AresEntity.ts"/>

/**
 * Created by Raykid on 2016/12/5.
 */
class Ares
{
    /**
     * 创建一个数据绑定
     * @param viewModel 要绑定的数据对象
     * @param nameOrElement 要绑定到的DOM节点的名字或者引用
     * @param options 额外参数，参考AresOptions接口
     */
    public static create(viewModel:any, nameOrElement:string|HTMLElement, options?:AresOptions):void
    {
        if(document.body)
        {
            doCreate();
        }
        else
        {
            window.onload = doCreate;
        }

        function doCreate():void
        {
            var el:HTMLElement;
            if(typeof nameOrElement == "string")
            {
                el = document.getElementById(nameOrElement as string);
            }
            else
            {
                el = nameOrElement as HTMLElement;
            }
            // 生成一个Entity
            new core.AresEntity(viewModel, el);
            // 调用回调
            if(options && options.initialized) options.initialized(viewModel);
        }
    }
}

interface AresOptions
{
    initialized?:(viewModel:any)=>void;
}