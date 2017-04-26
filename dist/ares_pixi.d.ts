/// <reference path="../src/ares/pixijs/pixi.js.d.ts" />
/// <reference path="ares.d.ts" />
/**
 * Created by Raykid on 2016/12/27.
 */
declare namespace ares.pixijs {
    interface Command {
        /**
         * 执行命令
         * @param context 命令上下文
         * @return {PIXI.DisplayObject} 要替换原显示节点的显示节点
         */
        (context?: CommandContext): PIXI.DisplayObject;
    }
    interface CommandContext {
        scope: any;
        target: PIXI.DisplayObject;
        subCmd: string;
        exp: string;
        compiler: PIXICompiler;
        entity: IAres;
        [name: string]: any;
    }
    /**
     * 提供给外部的可以注入自定义命令的接口
     * @param name
     * @param command
     */
    function addCommand(name: string, command: Command): void;
    /** 文本域命令 */
    function textContent(context: CommandContext): void;
    const commands: {
        [name: string]: Command;
    };
}
/**
 * Created by Raykid on 2016/12/27.
 */
declare namespace ares.pixijs {
    interface PIXIBindConfig {
        [name: string]: PIXIBindConfigCommands;
    }
    interface PIXIBindConfigCommands {
        [cmd: string]: any;
    }
    /**
     * 获取全局模板对象，该模板在任何地方都生效
     * @param name 模板名称
     * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
     */
    function getTemplate(name: string): PIXI.DisplayObject;
    /**
     * 设置全局模板对象，该模板在任何地方都生效
     * @param name 模板名称
     * @param tpl 模板对象
     * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
     */
    function setTemplate(name: string, tpl: PIXI.DisplayObject): PIXI.DisplayObject;
    class PIXICompiler implements Compiler {
        private static _textExpReg;
        private _root;
        private _config;
        private _entity;
        private _nameDict;
        private _tplDict;
        /** 获取根显示对象 */
        readonly root: PIXI.DisplayObject;
        /**
         * 创建PIXI绑定
         * @param root 根显示对象，从这里传入的绑定数据属性名必须以“a_”开头
         * @param config 绑定数据，从这里传入的绑定数据属性名可以不以“a_”开头
         * @param tplDict 模板字典，可以在这里给出模板定义表
         */
        constructor(root: PIXI.DisplayObject, config?: PIXIBindConfig, tplDict?: {
            [name: string]: PIXI.DisplayObject;
        });
        private parseCmd(node);
        private parseTpl(node);
        init(entity: IAres): void;
        compile(node: PIXI.DisplayObject, scope: any): void;
        /**
         * 获取模板对象，该模板只在该PIXICompiler内部生效
         * @param name 模板名称
         * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
         */
        getTemplate(name: string): PIXI.DisplayObject;
        /**
         * 设置模板，该模板只在该PIXICompiler内部生效
         * @param name 模板名称
         * @param tpl 模板对象
         * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
         */
        setTemplate(name: string, tpl: PIXI.DisplayObject): PIXI.DisplayObject;
        private compileTextContent(text, scope);
        private parseTextExp(exp);
    }
}
declare var module: any;
