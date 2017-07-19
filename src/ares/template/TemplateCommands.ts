import {Compiler, IAres} from "../Interfaces";

/**
 * Created by Raykid on 2017/3/17.
 */
export interface TemplateNode
{
    cmd:string;
    exp:string;
    children?:TemplateNode[];
    /** 暂存结果用 */
    value?:string;
}

export interface CommandContext
{
    node:TemplateNode;
    scope:any;
    compiler:Compiler;
    entity:IAres;
}

export interface Command
{
    (context?:CommandContext):void;
}

export function getChildrenString(node:TemplateNode):string
{
    var result:string = "";
    var children:TemplateNode[] = node.children;
    if(children)
    {
        for(var i:number = 0, len:number = children.length; i < len; i++)
        {
            result += children[i].value || "";
        }
    }
    return result;
}

export function compileChildren(node:TemplateNode, scope:any, compiler:Compiler):void
{
    node.children.forEach((child:TemplateNode)=>{
        compiler.compile(child, scope);
    }, this);
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

export const commands:{[name:string]:Command} = {
    /** text命令 */
    text: (context:CommandContext)=>
    {
        // 直接储存结果
        context.node.value = context.node.exp;
    },
    /** exp命令 */
    exp: (context:CommandContext)=>
    {
        context.entity.createWatcher(context.node, context.node.exp, context.scope, (value:any)=>
        {
            // 更新显示
            context.node.value = value + "";
        });
    },
    /** if命令 */
    if: (context:CommandContext)=>
    {
        context.entity.createWatcher(context.node, context.node.exp, context.scope, (value:any)=>
        {
            if(value)
            {
                // 判断为真，编译子节点并显示
                compileChildren(context.node, context.scope, context.compiler);
                // 更新值
                context.node.value = getChildrenString(context.node);
            }
            else
            {
                // 判断为假，啥也不显示
                context.node.value = "";
            }
        });
    },
    /** for命令 */
    for: (context:CommandContext)=>
    {
        var reg:RegExp = /^\s*(\S+)\s+in\s+([\s\S]+?)\s*$/;
        var res:RegExpExecArray = reg.exec(context.node.exp);
        if(!res)
        {
            console.error("for命令表达式错误：" + context.node.exp);
            return;
        }
        context.entity.createWatcher(context.node, res[2], context.scope, (value:any)=>
        {
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
            var result:string = "";
            if(value)
            {
                var arrLength:number = (value instanceof Array ? value.length : -1);
                for(var key in value)
                {
                    // 生成子域
                    var newScope:any = Object.create(context.scope);
                    // 这里一定要用defineProperty将目标定义在当前节点上，否则会影响context.scope
                    Object.defineProperty(newScope, "$index", {
                        configurable: true,
                        enumerable: false,
                        value: (value instanceof Array ? parseInt(key) : key),
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
                    Object.defineProperty(newScope, res[1], {
                        configurable: true,
                        enumerable: true,
                        value: value[key],
                        writable: false
                    });
                    // 编译子节点并显示
                    compileChildren(context.node, newScope, context.compiler);
                    // 更新值
                    result += getChildrenString(context.node);
                }
            }
            context.node.value = result;
        });
    }
};