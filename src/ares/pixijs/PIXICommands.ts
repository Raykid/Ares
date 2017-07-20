import {IAres, IWatcher, AresCommandData} from "../Interfaces";
import {PIXICompiler, CmdDict, getTemplate} from "./PIXICompiler";
import {runExp, evalExp} from "../Utils";
import {ViewPortHandler, ViewPortHandlerOptions} from "./ViewPortHandler";
import {PIXIUtils} from "./PIXIUtils";

/**
 * Created by Raykid on 2016/12/27.
 */
export interface Command
{
    /**
     * 执行命令
     * @param context 命令上下文
     * @return {PIXI.DisplayObject} 要替换原显示节点的显示节点
     */
    (context?:CommandContext):PIXI.DisplayObject;
}

export interface CommandContext
{
    scope:any;
    target:PIXI.DisplayObject;
    compiler:PIXICompiler;
    entity:IAres;
    cmdData:AresCommandData;
    cmdDict:CmdDict;
    [name:string]:any;
}

/**
 * 提供给外部的可以注入自定义命令的接口
 * @param name
 * @param command
 */
export function addCommand(name:string, command:Command):void
{
    if(!commands[name]) commands[name] = command;
}

/** 文本域命令 */
export function textContent(context:CommandContext):void
{
    context.entity.createWatcher(context.target, context.cmdData.exp, context.scope, (value:string)=>
    {
        var text:PIXI.Text = context.target as PIXI.Text;
        text.text = value;
    });
}

export const commands:{[name:string]:Command} = {
    /** 视点命令 */
    viewport: (context:CommandContext)=>
    {
        var cmdData:AresCommandData = context.cmdData;
        var target:PIXI.DisplayObject = context.target;
        var exp:string = "[" + cmdData.exp + "]";
        // 生成处理器
        var options:ViewPortHandlerOptions = evalExp(cmdData.subCmd, context.scope);
        var handler:ViewPortHandler = new ViewPortHandler(target, options);
        // 设置监视，这里的target要优先使用$forTarget，因为在for里面的$target属性应该指向原始显示对象
        context.entity.createWatcher(context.scope.$forTarget || target, exp, context.scope, (value:number[])=>
        {
            var x:number = value[0] || 0;
            var y:number = value[1] || 0;
            var width:number = value[2] || 0;
            var height:number = value[3] || 0;
            // 设置视点范围
            handler.setViewPort(x, y, width, height);
        });
        return target;
    },
    /** 模板替换命令 */
    tpl: (context:CommandContext)=>
    {
        var cmdData:AresCommandData = context.cmdData;
        // 优先从本地模板库取到模板对象
        var template:PIXI.DisplayObject = context.compiler.getTemplate(cmdData.exp);
        // 本地模板库没有找到，去全局模板库里取
        if(!template) template = getTemplate(cmdData.exp);
        // 仍然没有找到，放弃
        if(!template) return context.target;
        // 拷贝模板
        template = PIXIUtils.cloneObject(template, true);
        // 使用模板添加到与目标相同的位置
        var target:PIXI.DisplayObject = context.target;
        var parent:PIXI.Container = target.parent;
        parent.addChildAt(template, parent.getChildIndex(target));
        // 移除并销毁目标，清理内存
        parent.removeChild(target);
        target.destroy();
        // 启动编译
        context.compiler.compile(template, context.scope);
        // 返回替换节点
        return template;
    },
    /** 修改任意属性命令 */
    prop: (context:CommandContext)=>
    {
        var cmdData:AresCommandData = context.cmdData;
        var target:PIXI.DisplayObject = context.target;
        context.entity.createWatcher(target, cmdData.exp, context.scope, (value:any)=>
        {
            if(cmdData.subCmd != "")
            {
                // 子命令形式
                target[cmdData.subCmd] = value;
            }
            else
            {
                // 集成形式，遍历所有value的key，如果其表达式值为true则添加其类型
                for(var name in value)
                {
                    target[name] = value[name];
                }
            }
        });
        // 返回节点
        return target;
    },
    /** 绑定事件 */
    on: (context:CommandContext)=>
    {
        var cmdData:AresCommandData = context.cmdData;
        if(cmdData.subCmd != "")
        {
            var handler:Function = context.scope[cmdData.exp] || window[context.cmdData.exp];
            if(typeof handler == "function")
            {
                // 是函数名形式
                context.target.on(cmdData.subCmd, function(){
                    handler.apply(this, arguments);
                }, context.scope);
            }
            else
            {
                // 是方法执行或者表达式方式
                context.target.on(cmdData.subCmd, (evt:Event)=>
                {
                    // 创建一个临时的子域，用于保存参数
                    var scope:any = Object.create(context.scope);
                    scope.$event = evt;
                    scope.$target = context.target;
                    runExp(cmdData.exp, scope);
                });
            }
        }
        // 返回节点
        return context.target;
    },
    /** if命令 */
    if: (context:CommandContext)=>
    {
        var cmdData:AresCommandData = context.cmdData;
        // 记录一个是否编译过的flag
        var compiled:boolean = false;
        // 插入一个占位元素
        var refNode:PIXI.Container = new PIXI.Container();
        refNode.interactive = refNode.interactiveChildren = false;
        var parent:PIXI.Container = context.target.parent;
        var index:number = parent.getChildIndex(context.target);
        parent.addChildAt(refNode, index);
        // 只有在条件为true时才启动编译
        var watcher:IWatcher = context.entity.createWatcher(context.target, cmdData.exp, context.scope, (value:boolean)=>
        {
            // 如果refNode被从显示列表移除了，则表示该if指令要作废了
            if(!refNode.parent)
            {
                watcher.dispose();
                return;
            }
            if(value == true)
            {
                // 启动编译
                if(!compiled)
                {
                    context.compiler.compile(context.target, context.scope);
                    compiled = true;
                }
                // 插入节点
                if(!context.target.parent)
                {
                    var index:number = refNode.parent.getChildIndex(refNode);
                    refNode.parent.addChildAt(context.target, index);
                }
            }
            else
            {
                // 移除元素
                if(context.target.parent)
                {
                    context.target.parent.removeChild(context.target);
                }
            }
        });
        // 返回节点
        return context.target;
    },
    /** for命令 */
    for: (context:CommandContext)=>
    {
        var cmdData:AresCommandData = context.cmdData;
        // 解析表达式
        var reg:RegExp = /^\s*(\S+)\s+in\s+([\s\S]+?)\s*$/;
        var res:RegExpExecArray = reg.exec(cmdData.exp);
        if(!res)
        {
            console.error("for命令表达式错误：" + cmdData.exp);
            return;
        }
        var itemName:string = res[1];
        var arrName:string = res[2];
        // 生成一个容器替换原始模板
        var index:number = context.target.parent.getChildIndex(context.target);
        var parent:PIXI.Container = new PIXI.Container();
        context.target.parent.addChildAt(parent, index);
        context.target.parent.removeChild(context.target);
        // 生成一个新的scope，要向其中添加属性
        var forScope:any = Object.create(context.scope);
        Object.defineProperty(forScope, "$forTarget", {
            configurable: true,
            enumerable: false,
            value: context.target,
            writable: false
        });
        // 如果有viewport命令，则将其转移至容器上
        var viewportCmds:AresCommandData[] = context.cmdDict["viewport"];
        if(viewportCmds)
        {
            var viewportCmd:AresCommandData = viewportCmds[0];
            if(viewportCmd)
            {
                parent[viewportCmd.propName] = viewportCmd.exp;
                delete context.target[viewportCmd.propName];
            }
        }
        // 添加订阅
        var watcher:IWatcher = context.entity.createWatcher(context.target, arrName, forScope, (value:any)=>{
            // 如果refNode被从显示列表移除了，则表示该if指令要作废了
            if(!parent.parent)
            {
                watcher.dispose();
                return;
            }
            // 清理原始显示
            for(var i:number = parent.children.length - 1; i >= 0; i--)
            {
                parent.removeChildAt(i).destroy();
            }
            // 如果是数字，构建一个数字列表
            if(typeof value == "number")
            {
                var temp:number[] = [];
                for(var i:number = 0; i < value; i++)
                {
                    temp.push(i);
                }
                value = temp;
            }
            // 开始遍历
            var lastNode:PIXI.DisplayObject = null;
            var arrLength:number = (value instanceof Array ? value.length : -1);
            for(var key in value)
            {
                // 拷贝一个target
                var newNode:PIXI.DisplayObject = PIXIUtils.cloneObject(context.target, true);
                // 添加到显示里
                parent.addChild(newNode);
                // 生成子域
                var newScope:any = Object.create(forScope);
                // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响forScope
                Object.defineProperty(newScope, "$index", {
                    configurable: true,
                    enumerable: false,
                    value: (value instanceof Array ? parseInt(key) : key),
                    writable: false
                });
                // 注入上一个显示节点
                Object.defineProperty(newScope, "$last", {
                    configurable: true,
                    enumerable: false,
                    value: lastNode,
                    writable: false
                });
                // 如果是数组再添加一个数组长度
                if(arrLength >= 0)
                {
                    Object.defineProperty(newScope, "$length", {
                        configurable: true,
                        enumerable: false,
                        value: arrLength,
                        writable: false
                    });
                }
                // 注入遍历名
                Object.defineProperty(newScope, itemName, {
                    configurable: true,
                    enumerable: true,
                    value: value[key],
                    writable: false
                });
                // 开始编译新节点
                context.compiler.compile(newNode, newScope);
                // 赋值上一个节点
                lastNode = newNode;
            }
        });
        // 使用原始显示对象编译一次parent
        context.compiler.compile(parent, forScope);
        // 返回节点
        return context.target;
    }
};