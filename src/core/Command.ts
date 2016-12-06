/// <reference path="Expresion.ts"/>

/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
    export interface Cmd
    {
        /** 表示该命令是否会对内容生成子域 */
        subScope:boolean;

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
        /** 更新渲染 */
        update():void;
    }

    /** 以下是默认的命令实现 */

    /** 文本命令 */
    class TextCmd implements Cmd
    {
        public get subScope():boolean
        {
            return false;
        }

        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    // 更新target节点的textContent
                    target.innerText = expresion.run(scope);
                }
            };
        }
    }

    /** HTML文本命令 */
    class HtmlCmd implements Cmd
    {
        public get subScope():boolean
        {
            return false;
        }

        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    // 更新target节点的textContent
                    target.innerHTML = expresion.run(scope);
                }
            };
        }
    }

    export class Command
    {
        // 自定义的命令表
        private static _customCmdMap:{[name:string]:Cmd} = {};
        // 系统默认的命令表
        private static _depMap:{[name:string]:Cmd} = {
            text: new TextCmd(),
            html: new HtmlCmd()
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
}