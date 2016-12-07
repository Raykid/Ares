/// <reference path="Expresion.ts"/>
/// <reference path="SystemCmd.ts"/>

/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
    export class Command
    {
        // 自定义的命令表
        private static _customCmdMap:{[name:string]:Cmd} = {};
        // 系统默认的命令表
        private static _depMap:{[name:string]:Cmd} = {
            text: new TextCmd(),
            html: new HtmlCmd(),
            if: new IfCmd(),
            for: new ForCmd()
        };

        /** 获取命令对象 */
        public static getCmd(name:string):Cmd
        {
            // 优先查找系统命令，找不到再去自定义命令表查找
            return (
                Command._depMap[name] ||
                Command._customCmdMap[name]
            );
        }

        /**
         * 添加命令对象
         * @param name 命令对象名字
         * @param dep 命令对象实现对象
         */
        public static addCmd(name:string, dep:Cmd):void
        {
            Command._customCmdMap[name] = dep;
        }

        /**
         * 移除命令对象
         * @param name 命令对象名字
         * @returns {Cmd} 被移除的命令对象
         */
        public static removeCmd(name:string):Cmd
        {
            var dep:Cmd = Command._customCmdMap[name];
            delete Command._customCmdMap[name];
            return dep;
        }
    }

    export interface Cmd
    {
        /** 编译优先级，数字越大越先被编译 */
        priority?:number;
        /** 是否要中断当前节点及其子节点的编译 */
        stopCompile?:boolean;
        /**
         * 根据依赖创建更新器
         * @param target 依赖的DOM节点引用
         * @param exp 依赖表达式
         * @param scope 依赖的表达式所在的词法作用域
         */
        exec(target:HTMLElement, exp:string, scope:Scope):Updater;
    }

    export interface Updater
    {
        /**
         * 更新渲染
         * @param entity 实体对象
         */
        update(entity:AresEntity):void;
    }
}