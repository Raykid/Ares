/// <reference path="HTMLCommands.ts"/>

/**
 * Created by Raykid on 2016/12/22.
 */
namespace ares.html
{
    export class HTMLCompiler implements ares.Compiler
    {
        private _idOrElement:string|HTMLElement;
        private _root:HTMLElement;
        private _entity:Ares;

        public constructor(idOrElement:string|HTMLElement)
        {
            this._idOrElement = idOrElement;
        }

        public init(entity:Ares):void
        {
            if(typeof this._idOrElement == "string")
                this._root = document.getElementById(this._idOrElement as string) ||
                    document.getElementsByName(this._idOrElement as string)[0] as HTMLElement;
            else
                this._root = this._idOrElement as HTMLElement;
            this._entity = entity;
            // 开始编译root节点
            HTMLCompiler.compile(this._root, this._entity.data);
        }

        private static compile(node:Node, scope:any):void
        {
            if(node.nodeType == 3)
            {
                // 是个文本节点
                HTMLCompiler.compileTextContent(node, scope);
            }
            else
            {
                // 不是文本节点
                var hasLazyCompile:boolean = false;
                // 首先解析当前节点上面以data-a-或者a-开头的属性，将其认为是绑定属性
                var attrs:NamedNodeMap = node.attributes;
                var cmdsToCompile:{attr:Attr, cmd:Command, ctx:CommandContext}[] = [];
                for(var i:number = 0, len:number = attrs.length; i < len; i++)
                {
                    var attr:Attr = attrs[i];
                    var name:string = attr.name;
                    // 所有属性必须以data-a-或者a-开头
                    if(name.indexOf("a-") == 0 || name.indexOf("data-a-") == 0)
                    {
                        var bIndex:number = (name.charAt(0) == "d" ? 7 : 2);
                        var eIndex:number = name.indexOf(":");
                        if(eIndex < 0) eIndex = name.length;
                        // 取到命令名
                        var cmdName:string = name.substring(bIndex, eIndex);
                        // 用命令名取到Command
                        var cmd:Command = commands[cmdName];
                        if(cmd)
                        {
                            // 取到子命令名
                            var subCmd:string = name.substr(eIndex + 1);
                            // 取到命令字符串
                            var exp:string = attr.value;
                            // 推入数组
                            cmdsToCompile.push({
                                attr: attr,
                                cmd: cmd,
                                ctx: {
                                    scope: scope,
                                    target: node as HTMLElement,
                                    subCmd: subCmd,
                                    exp: exp,
                                    compile: HTMLCompiler.compile
                                }
                            });
                            // 如果是for或者if则设置懒编译
                            if(cmdName == "if" || cmdName == "for")
                            {
                                hasLazyCompile = true;
                                // 清空数组，仅留下自身的编译
                                cmdsToCompile.splice(0, cmdsToCompile.length - 1);
                                break;
                            }
                        }
                    }
                }
                // 开始编译当前节点外部结构
                for(var i:number = 0, len:number = cmdsToCompile.length; i < len; i++)
                {
                    var cmdToCompile:{attr:Attr, cmd:Command, ctx:CommandContext} = cmdsToCompile[i];
                    // 移除属性
                    cmdToCompile.attr.ownerElement.removeAttribute(cmdToCompile.attr.name);
                    // 开始编译
                    cmdToCompile.cmd(cmdToCompile.ctx);
                }
                // 如果没有懒编译则编译内部结构
                if(!hasLazyCompile)
                {
                    // 然后递归解析子节点
                    var children:NodeList = node.childNodes;
                    for(var i:number = 0, len:number = children.length; i < len; i++)
                    {
                        var child:Node = children[i];
                        HTMLCompiler.compile(child, scope);
                    }
                }
            }
        }

        private static _textExpReg:RegExp = /(.*?)\{\{(.*?)\}\}(.*)/;
        private static compileTextContent(node:Node, scope:any):void
        {
            if(HTMLCompiler._textExpReg.test(node.nodeValue))
            {
                var exp:string = HTMLCompiler.parseTextExp(node.nodeValue);
                var cmd:Command = ares.html.commands["textContent"];
                cmd({
                    scope: scope,
                    target: node,
                    subCmd: "",
                    exp: exp,
                    compile: HTMLCompiler.compile
                });
            }
        }

        private static parseTextExp(exp:string):string
        {
            var reg:RegExp = HTMLCompiler._textExpReg;
            for(var result:RegExpExecArray = reg.exec(exp); result != null; result = reg.exec(exp))
            {
                exp = "`" + result[1] + "${" + result[2] + "}" + result[3] + "`";
            }
            return exp;
        }
    }
}