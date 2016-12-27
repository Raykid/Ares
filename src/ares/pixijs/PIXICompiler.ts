/// <reference path="../Interfaces.ts"/>
/// <reference path="../Utils.ts"/>
/// <reference path="PIXICommands.ts"/>
/// <reference path="pixi.js.d.ts"/>

/**
 * Created by Raykid on 2016/12/27.
 */
namespace ares.pixijs
{
    export interface PIXIBindConfig
    {
        [name:string]:PIXIBindConfigCommands
    }

    export interface PIXIBindConfigCommands
    {
        [cmd:string]:any;
    }

    export class PIXICompiler implements Compiler
    {
        private static _textExpReg:RegExp = /(.*?)\{\{(.*?)\}\}(.*)/;

        private _root:PIXI.DisplayObject;
        private _config:PIXIBindConfig;
        private _entity:IAres;

        private _nameDict:{[name:string]:PIXI.DisplayObject} = {};

        /**
         * 创建PIXI绑定
         * @param root 根显示对象，从这里传入的绑定数据属性名必须以“a_”开头
         * @param config 绑定数据，从这里传入的绑定数据属性名可以不以“a_”开头
         */
        public constructor(root:PIXI.DisplayObject, config?:PIXIBindConfig)
        {
            this._root = root;
            this._config = config;
        }

        public init(entity:IAres):void
        {
            this._entity = entity;
            // 开始编译root节点
            this.compile(this._root, entity.data);
        }

        public compile(node:PIXI.DisplayObject, scope:any):void
        {
            var hasLazyCompile:boolean = false;
            // 如果有名字就记下来
            var name:string = node.name;
            if(name) this._nameDict[name] = node;
            // 取到属性列表
            var keys:string[] = Object.keys(node);
            // 把配置中的属性推入属性列表中
            var conf:PIXIBindConfigCommands = (this._config && this._config[name]);
            for(var t in conf)
            {
                if(t.indexOf("a_") != 0) t = "a_" + t;
                keys.push(t);
            }
            // 开始遍历属性列表
            var cmdsToCompile:{cmdName:string, cmd:Command, ctx:CommandContext}[] = [];
            for(var i:number = 0, len:number = keys.length; i < len; i++)
            {
                // 首先解析当前节点上面以a_开头的属性，将其认为是绑定属性
                var key:string = keys[i];
                if(key.indexOf("a_") == 0)
                {
                    var bIndex:number = 2;
                    var eIndex:number = key.indexOf("$");
                    if(eIndex < 0) eIndex = key.length;
                    // 取到命令名
                    var cmdName:string = key.substring(bIndex, eIndex);
                    // 取到子命令名
                    var subCmd:string = key.substr(eIndex + 1);
                    // 取到命令字符串
                    var exp:string;
                    if(conf) exp = conf[key] || conf[cmdName] || node[key];
                    else exp = node[key];
                    // 用命令名取到Command
                    var cmd:Command = commands[cmdName];
                    // 如果没有找到命令，则认为是自定义命令，套用prop命令
                    if(!cmd)
                    {
                        cmd = commands["prop"];
                        subCmd = cmdName || "";
                    }
                    // 推入数组
                    cmdsToCompile.push({
                        cmdName: cmdName,
                        cmd: cmd,
                        ctx: {
                            scope: scope,
                            target: node,
                            subCmd: subCmd,
                            exp: exp,
                            compiler: this,
                            entity: this._entity
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
            // 开始编译当前节点外部结构
            for(var i:number = 0, len:number = cmdsToCompile.length; i < len; i++)
            {
                var cmdToCompile:{cmdName:string, cmd:Command, ctx:CommandContext} = cmdsToCompile[i];
                // 移除属性
                delete cmdToCompile.ctx.target[cmdToCompile.cmdName];
                // 开始编译
                cmdToCompile.cmd(cmdToCompile.ctx);
            }
            // 如果没有懒编译则编译内部结构
            if(!hasLazyCompile)
            {
                // 如果是文本对象，则进行文本内容编译
                if(node instanceof PIXI.Text)
                {
                    this.compileTextContent(node as PIXI.Text, scope);
                }
                // 然后递归解析子节点
                if(node instanceof PIXI.Container)
                {
                    var children:PIXI.DisplayObject[] = (node as PIXI.Container).children;
                    for(var i:number = 0, len:number = children.length; i < len; i++)
                    {
                        var child:PIXI.DisplayObject = children[i];
                        this.compile(child, scope);
                    }
                }
            }
        }

        private compileTextContent(text:PIXI.Text, scope:any):void
        {
            var value:string = text.text;
            if(PIXICompiler._textExpReg.test(value))
            {
                var exp:string = this.parseTextExp(value);
                textContent({
                    scope: scope,
                    target: text,
                    subCmd: "",
                    exp: exp,
                    compiler: this,
                    entity: this._entity
                });
            }
        }

        private parseTextExp(exp:string):string
        {
            var reg:RegExp = PIXICompiler._textExpReg;
            for(var result:RegExpExecArray = reg.exec(exp); result != null; result = reg.exec(exp))
            {
                exp = "`" + result[1] + "${" + result[2] + "}" + result[3] + "`";
            }
            return exp;
        }
    }
}