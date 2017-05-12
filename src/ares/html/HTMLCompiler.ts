/**
 * Created by Raykid on 2016/12/22.
 */

import {Compiler, IAres} from "../Interfaces";
import {Command, CommandContext, commands, textContent} from "./HTMLCommands";

export interface CmdData
{
    cmdName:string;
    subCmd:string;
    propName:string;
    exp:string;
}

export interface CmdDict
{
    [cmdName:string]:CmdData;
}

export class HTMLCompiler implements Compiler
{
    private static _cmdRegExp:RegExp = /^(data\-)?a\-(\w+)(:(.+))?$/;
    private static _textRegExp:RegExp = /(.*?)\{\{(.*?)\}\}(.*)/;

    private _selectorsOrElement:string|HTMLElement;
    private _root:HTMLElement;
    private _entity:IAres;

    public get root():HTMLElement
    {
        return this._root;
    }

    public constructor(selectorsOrElement:string|HTMLElement)
    {
        this._selectorsOrElement = selectorsOrElement;
    }

    public init(entity:IAres):void
    {
        if(typeof this._selectorsOrElement == "string")
            this._root = document.querySelector(this._selectorsOrElement as string) as HTMLElement;
        else
            this._root = this._selectorsOrElement as HTMLElement;
        this._entity = entity;
        // 开始编译root节点
        this.compile(this._root, entity.data);
    }

    public compile(node:Node, scope:any):void
    {
        var cmdDict:CmdDict = {};
        if(node.nodeType == 3)
        {
            // 是个文本节点
            this.compileTextContent(node, scope, cmdDict);
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
                // 检测命令
                var result:RegExpExecArray = HTMLCompiler._cmdRegExp.exec(name);
                if(result)
                {
                    // 取到命令名
                    var cmdName:string = result[2];
                    // 用命令名取到Command
                    var cmd:Command = commands[cmdName];
                    if(cmd)
                    {
                        var cmdData:CmdData = {
                            cmdName: cmdName,
                            subCmd: result[4],
                            propName: result[0],
                            exp: attr.value
                        };
                        // 推入数组
                        cmdsToCompile.push({
                            attr: attr,
                            cmd: cmd,
                            ctx: {
                                scope: scope,
                                target: node as HTMLElement,
                                compiler: this,
                                entity: this._entity,
                                cmdData: cmdData,
                                cmdDict: cmdDict
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
                    this.compile(child, scope);
                }
            }
        }
    }

    private compileTextContent(node:Node, scope:any, cmdDict:CmdDict):void
    {
        if(HTMLCompiler._textRegExp.test(node.nodeValue))
        {
            var exp:string = this.parseTextExp(node.nodeValue);
            textContent({
                scope: scope,
                target: node,
                compiler: this,
                entity: this._entity,
                cmdData: {
                    cmdName: "",
                    subCmd: "",
                    propName: "",
                    exp: exp
                },
                cmdDict: cmdDict
            });
        }
    }

    private parseTextExp(exp:string):string
    {
        var reg:RegExp = HTMLCompiler._textRegExp;
        for(var result:RegExpExecArray = reg.exec(exp); result != null; result = reg.exec(exp))
        {
            exp = result[1] + "${" + result[2] + "}" + result[3];
        }
        return "`" + exp + "`";
    }
}