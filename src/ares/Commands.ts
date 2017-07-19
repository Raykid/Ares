/**
 * Created by Raykid on 2017/7/19.
 */

import {IAres, AresCommandData} from "./Interfaces"
import {runExp} from "./Utils"

export interface CommandContext
{
    target:any;
    scope:any;
    entity:IAres;
    data:AresCommandData;
}

export interface Command
{
    /**
     * 执行命令
     * @param context 命令上下文
     * @return {any} 要替换原显示节点的显示节点
     */
    (context?:CommandContext):any;
}

export const commands:{[name:string]:Command} = {
    /** 一次性设置变量命令，在数据中插入一个变量 */
    set: (context:CommandContext)=>
    {
        // 设置变量值
        runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
        return context.target;
    },
    /** 绑定设置变量命令，在数据中插入一个变量（如果不提供子命令则不插入变量），并根据表达式的值同步更新变量的值 */
    bind: (context:CommandContext)=>
    {
        // 创建订阅器，监听表达式值变化
        context.entity.createWatcher(context.target, context.data.exp, context.scope, (value:any)=>{
            // 如果子命令不为空，则更新变量值
            if(context.data.subCmd)
                runExp(context.data.subCmd + "=" + context.data.exp, context.scope);
        });
        return context.target;
    }
};