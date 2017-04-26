/// <reference path="ares.d.ts" />
/**
 * Created by Raykid on 2017/3/17.
 */
declare namespace ares.template {
    interface TemplateNode {
        cmd: string;
        exp: string;
        children?: TemplateNode[];
        /** 暂存结果用 */
        value?: string;
    }
    interface CommandContext {
        node: TemplateNode;
        scope: any;
        compiler: Compiler;
        entity: IAres;
    }
    interface Command {
        (context?: CommandContext): void;
    }
    function getChildrenString(node: TemplateNode): string;
    function compileChildren(node: TemplateNode, scope: any, compiler: Compiler): void;
    /**
     * 提供给外部的可以注入自定义命令的接口
     * @param name
     * @param command
     */
    function addCommand(name: string, command: Command): void;
    const commands: {
        [name: string]: Command;
    };
}
/**
 * Created by Raykid on 2017/3/17.
 */
declare namespace ares.template {
    interface PIXIBindConfig {
        [name: string]: PIXIBindConfigCommands;
    }
    interface PIXIBindConfigCommands {
        [cmd: string]: any;
    }
    class TemplateCompiler implements Compiler {
        private _template;
        private _onUpdate;
        private _config;
        private _entity;
        private _scope;
        private _root;
        readonly root: TemplateNode;
        /**
         * 创建模板绑定
         * @param template 模板字符串
         * @param onUpdate 当文本有更新时调用，传入最新文本
         * @param config 绑定数据
         */
        constructor(template: string, onUpdate: (text: string) => void, config?: PIXIBindConfig);
        init(entity: IAres): void;
        compile(node: TemplateNode, scope: any): void;
        private update();
        private mutateValue(node);
        private getEndIndex(str, startIndex);
        private transformToNode(str);
    }
}
declare var module: any;
