/// <reference path="Expresion.ts"/>

/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
    export interface Dep
    {
        /** 表示该命令是否会对内容生成子域 */
        subScope:boolean;

        /**
         * 根据依赖创建更新器
         * @param target 依赖的DOM节点引用
         * @param exp 依赖表达式
         * @param scope 依赖的表达式所在的词法作用域
         */
        depend(target:HTMLElement, exp:string, scope:Scope):Updater;
    }

    export interface Updater
    {
        /** 更新渲染 */
        update():void;
    }

    /** 以下是默认的命令实现 */
    class TextDep implements Dep
    {
        public get subScope():boolean
        {
            return false;
        }

        public depend(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    // 更新target节点的textContent
                    target.textContent = expresion.run(scope);
                }
            };
        }
    }

    export class Dependent
    {
        // 自定义的命令表
        private static _customDepMap:{[name:string]:Dep} = {};
        // 系统默认的命令表
        private static _depMap:{[name:string]:Dep} = {
            text: new TextDep()
        };

        /** 获取依赖项 */
        public static getDep(name:string):Dep
        {
            // 优先查找系统命令，找不到再去自定义命令表查找
            return (
                Dependent._depMap[name] ||
                Dependent._customDepMap[name]
            );
        }

        /**
         * 添加依赖项
         * @param name 依赖项命令名
         * @param dep 依赖项实现对象
         */
        public static addDep(name:string, dep:Dep):void
        {
            Dependent._customDepMap[name] = dep;
        }

        /**
         * 移除依赖项
         * @param name 依赖项命令名
         * @returns {Dep} 被移除的依赖项
         */
        public static removeDep(name:string):Dep
        {
            var dep:Dep = Dependent._customDepMap[name];
            delete Dependent._customDepMap[name];
            return dep;
        }
    }
}