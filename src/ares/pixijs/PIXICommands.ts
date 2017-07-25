import {IAres, IWatcher, AresCommandData} from "../Interfaces";
import {PIXICompiler, CmdDict, getTemplate} from "./PIXICompiler";
import {runExp, evalExp} from "../Utils";
import {ViewPortHandler, ViewPortHandlerOptions, ViewPortData} from "./ViewPortHandler";
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

export interface ForOptions
{
    chaos?:boolean;
}

interface ForData
{
    key:string;
    value:any;
    data:any;
    bounds:PIXI.Rectangle;
    parent:PIXI.Container;
    target?:PIXI.DisplayObject;
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
        var options:ForOptions = evalExp(cmdData.subCmd, context.scope) || {};
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
        // 记录循环数据
        var forDatas:ForData[] = [];
        // 记录viewport数据
        var viewportData:ViewPortData;
        // 记录viewport范围
        var globalRange:PIXI.Rectangle;
        // 记录顺序窗口范围，左闭右开
        var orderRange:{begin:number, end:number};
        // 添加订阅
        var watcher:IWatcher = context.entity.createWatcher(context.target, arrName, forScope, (value:any)=>{
            // 如果refNode被从显示列表移除了，则表示该for指令要作废了
            if(!parent.parent)
            {
                watcher.dispose();
                return;
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
            // 清理循环数据，并回收显示对象
            for(var i:number = 0, len:number = forDatas.length; i < len; i++)
            {
                var forData:ForData = forDatas.pop();
                if(forData.target) PIXIUtils.returnObject(forData.target);
            }
            // 获取隐藏背景，没有就创建一个
            var bg:PIXI.Graphics;
            if(parent.children.length == 1) bg = parent.getChildAt(0) as PIXI.Graphics;
            else if(parent.children.length > 1) throw new Error("for容器里出现了不明对象");
            if(!bg)
            {
                bg = new PIXI.Graphics();
                parent.addChildAt(bg, 0);
            }
            // 记录viewport在本地的范围
            if(viewportData)
            {
                globalRange = viewportData.globalRange.clone();
            }
            else
            {
                globalRange = new PIXI.Rectangle(0, 0, context.compiler.renderer.width, context.compiler.renderer.height);
            }
            // 开始遍历，并记录最大显示范围
            var maxRange:PIXI.Rectangle = null;
            var isArray:boolean = (value instanceof Array);
            var arrLength:number = (isArray ? value.length : -1);
            orderRange = (!options.chaos && isArray ? {begin: Number.MAX_VALUE, end: -1} : null);
            forData = null;
            for(var key in value)
            {
                // 生成新节点
                var newOne:{scope:any, node:PIXI.DisplayObject} = generateOne(key, value, arrLength, forData && forData.target);
                var newScope:any = newOne.scope;
                var newNode:PIXI.DisplayObject = newOne.node;
                // 更新最大范围
                var newRange:PIXI.Rectangle = new PIXI.Rectangle(newNode.x, newNode.y, newNode["width"], newNode["height"]);
                maxRange ? maxRange.enlarge(newRange) : maxRange = newRange;
                // 如果上一个节点不在viewport范围内，则回收之
                testReturn(forData, orderRange);
                // 记录forData
                var forData:ForData = <ForData>{
                    key: key,
                    value: value,
                    data: newScope,
                    bounds: new PIXI.Rectangle(),
                    parent: parent,
                    target: newNode
                };
                // 记录本地位置
                newNode.getBounds(null, forData.bounds);
                var parentGlobalPosition:PIXI.Point = parent.getGlobalPosition();
                forData.bounds.x -= parentGlobalPosition.x;
                forData.bounds.y -= parentGlobalPosition.y;
                forDatas.push(forData);
            }
            // 如果最后一个节点也不在viewport范围内，也要回收之
            testReturn(forData, orderRange);
            // 如果orderRange不合法，则设置为null
            if(orderRange && orderRange.begin >= orderRange.end) orderRange = null;
            // 更新背景范围
            bg.clear();
            if(maxRange)
            {
                bg.beginFill(0, 0);
                bg.drawRect(maxRange.x, maxRange.y, maxRange.width, maxRange.height);
                bg.endFill();
            }
        });
        // 使用原始显示对象编译一次parent
        context.compiler.compile(parent, forScope);
        // 记录viewport数据
        viewportData = PIXIUtils.getViewportData(parent);
        if(viewportData)
        {
            // 记录范围
            globalRange = viewportData.globalRange.clone();
            // 监听viewport滚动
            viewportData.observe(updateView);
        }
        // 返回节点
        return context.target;


        function generateOne(key:string, value:any, len:number, lastNode:PIXI.DisplayObject):{scope:any, node:PIXI.DisplayObject}
        {
            // 拷贝一个target
            var newNode:PIXI.DisplayObject = PIXIUtils.borrowObject(context.target);
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
            if(len >= 0)
            {
                Object.defineProperty(newScope, "$length", {
                    configurable: true,
                    enumerable: false,
                    value: len,
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
            // 返回
            return {scope: newScope, node: newNode};
        }

        function testInViewPort(forData:ForData):boolean
        {
            var parentGlobalPosition:PIXI.Point = forData.parent.getGlobalPosition();
            var tempRect:PIXI.Rectangle = forData.bounds.clone();
            tempRect.x += parentGlobalPosition.x;
            tempRect.y += parentGlobalPosition.y;
            tempRect = PIXIUtils.rectCross(tempRect, globalRange);
            return (tempRect.width * tempRect.height != 0);
        }

        function testReturn(forData:ForData, orderRange:{begin:number, end:number}):void
        {
            if(forData && forData.target)
            {
                var index:number = parseInt(forData.key);
                if(!testInViewPort(forData))
                {
                    // 不在范围内，回收
                    PIXIUtils.returnObject(forData.target);
                    forData.target = null;
                    // 缩小窗口
                    if(index <= orderRange.begin) orderRange.begin = index + 1;
                    else if(orderRange.end > index) orderRange.end = index;
                }
                else
                {
                    // 在范围内，扩充窗口
                    if(orderRange)
                    {
                        if(orderRange.begin > index) orderRange.begin = index;
                        if(orderRange.end < index + 1) orderRange.end = index + 1;
                    }
                }
            }
        }

        function updateView(viewport:PIXI.Rectangle):void
        {
            // 遍历forDatas，为没有target的生成target，并且测试回收
            var arrLength:number = forDatas.length;
            var curRange:{begin:number, end:number} = {begin: 0, end: arrLength};
            if(orderRange)
            {
                curRange.begin = orderRange.begin;
                curRange.end = orderRange.end;
                // 首先反向扩充范围
                for(var i:number = orderRange.begin; i >= 0; i--)
                {
                    if(testInViewPort(forDatas[i])) curRange.begin = i;
                    else break;
                }
                // 然后正向扩充
                for(var i:number = orderRange.end, len:number = forDatas.length; i < len; i++)
                {
                    if(testInViewPort(forDatas[i])) curRange.end = i + 1;
                    else break;
                }
            }
            // 遍历所有窗口内对象
            for(var i:number = curRange.begin, end:number = curRange.end; i < end; i++)
            {
                var forData:ForData = forDatas[i];
                var lastForData:ForData = forDatas[i - 1];
                if(!forData.target)
                {
                    var newOne:{scope:any, node:PIXI.DisplayObject} = generateOne(forData.key, forData.value, arrLength, lastForData && lastForData.target);
                    forData.target = newOne.node;
                }
                // 如果上一个节点不在viewport范围内，则回收之
                testReturn(lastForData, curRange);
            }
            // 如果最后一个节点也不在viewport范围内，也要回收之
            testReturn(forData, curRange);
            // 然后更新顺序范围
            if(orderRange)
            {
                // 单向滚动即使全部超出范围也不会造成扫描缺失，所以在超出范围时不更新下次扫描范围即可
                if(curRange.begin < curRange.end)
                {
                    // 没有全部超出范围
                    orderRange.begin = curRange.begin;
                    orderRange.end = curRange.end;
                }
                else if(viewportData.twowayMoving)
                {
                    // 全部超出范围了，并且是双向滚动，下次需要全扫描，防止有遗漏
                    orderRange.begin = 0;
                    orderRange.end = arrLength;
                }
            }
        }
    }
};