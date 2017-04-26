/// <reference path="ares.d.ts" />
/**
 * Created by Raykid on 2016/12/22.
 */
declare namespace ares.html {
    interface Command {
        (context?: CommandContext): void;
    }
    interface CommandContext {
        scope: any;
        target: Node;
        subCmd: string;
        exp: string;
        compiler: Compiler;
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
 * Created by Raykid on 2016/12/22.
 */
declare namespace ares.html {
    class HTMLCompiler implements Compiler {
        private static _textExpReg;
        private _selectorsOrElement;
        private _root;
        private _entity;
        readonly root: HTMLElement;
        constructor(selectorsOrElement: string | HTMLElement);
        init(entity: IAres): void;
        compile(node: Node, scope: any): void;
        private compileTextContent(node, scope);
        private parseTextExp(exp);
    }
}
declare var module: any;
