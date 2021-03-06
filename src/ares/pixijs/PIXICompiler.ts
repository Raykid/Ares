/// <reference path="pixi.js.d.ts"/>

import {IAres, Compiler, AresCommandData} from "../Interfaces";
import {Command, CommandContext, commands, textContent} from "./PIXICommands";

/**
 * Created by Raykid on 2016/12/27.
 */
export interface PIXIBindConfig
{
    [name:string]:PIXIBindConfigCommands
}

export interface PIXIBindConfigCommands
{
    [cmd:string]:any;
}

var _tplDict:{[name:string]:PIXI.DisplayObject} = {};
/**
 * 获取全局模板对象，该模板在任何地方都生效
 * @param name 模板名称
 * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
 */
export function getTemplate(name:string):PIXI.DisplayObject
{
    return _tplDict[name];
}

/**
 * 设置全局模板对象，该模板在任何地方都生效
 * @param name 模板名称
 * @param tpl 模板对象
 * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
 */
export function setTemplate(name:string, tpl:PIXI.DisplayObject):PIXI.DisplayObject
{
    // 非空判断
    if(!name || !tpl) return null;
    // 如果已经有了模板定义则返回null
    if(_tplDict[name]) return null;
    // 添加模板定义
    _tplDict[name] = tpl;
    // 返回模板对象
    return tpl;
}

export interface CmdDict
{
    [cmdName:string]:AresCommandData[];
}

export class PIXICompiler implements Compiler
{
    private static _textRegExp:RegExp = /(.*?)\{\{(.*?)\}\}(.*)/;

    private _root:PIXI.DisplayObject;
    private _renderer:PIXI.SystemRenderer;
    private _config:PIXIBindConfig;
    private _entity:IAres;

    private _nameDict:{[name:string]:PIXI.DisplayObject} = {};
    private _tplDict:{[name:string]:PIXI.DisplayObject};

    /** 获取根显示对象 */
    public get root():PIXI.DisplayObject
    {
        return this._root;
    }

    /** 获取PIXI渲染器 */
    public get renderer():PIXI.SystemRenderer
    {
        return this._renderer;
    }

    /**
     * 创建PIXI绑定
     * @param root 根显示对象，从这里传入的绑定数据属性名必须以“a_”开头
     * @param renderer PIXI渲染器
     * @param config 绑定数据，从这里传入的绑定数据属性名可以不以“a_”开头
     * @param tplDict 模板字典，可以在这里给出模板定义表
     */
    public constructor(root:PIXI.DisplayObject, renderer:PIXI.SystemRenderer, config?:PIXIBindConfig, tplDict?:{[name:string]:PIXI.DisplayObject})
    {
        this._root = root;
        this._renderer = renderer;
        this._config = config;
        this._tplDict = tplDict || {};
    }

    private parseCmd(node:PIXI.DisplayObject):CmdDict
    {
        // 取到属性列表
        var datas:AresCommandData[] = [];
        var data:AresCommandData;
        for(var t in node)
        {
            data = this._entity.parseCommand(t, node[t]);
            if(data) datas.push(data);
        }
        // 把配置中的属性推入属性列表中
        var conf:PIXIBindConfigCommands = (this._config && this._config[node.name]);
        for(var t in conf)
        {
            if(t.indexOf("a-") != 0 && t.indexOf("a_") != 0) t = "a-" + t;
            data = this._entity.parseCommand(t, node[t]);
            if(data) datas.push(data);
        }
        // 开始遍历属性列表
        var cmdNameDict:CmdDict = {};
        for(var i:number = 0, len:number = datas.length; i < len; i++)
        {
            data = datas[i];
            // 填充字典
            if(!cmdNameDict[data.cmdName]) cmdNameDict[data.cmdName] = [];
            cmdNameDict[data.cmdName].push(data);
        }
        return cmdNameDict;
    }

    private parseTpl(node:PIXI.DisplayObject):boolean
    {
        var tplName:string = node["a-tplName"] || node["a_tplName"];
        if(tplName)
        {
            var callback:()=>void = ()=>{
                // 移除tpl相关属性
                delete node["a-tplName"];
                delete node["a_tplName"];
                delete node["a-tplGlobal"];
                delete node["a_tplGlobal"];
                // 将这个节点从显示列表中移除
                node.parent && node.parent.removeChild(node);
            };
            if(node["a-tplGlobal"] == "true" || node["a_tplGlobal"] == "true")
            {
                if(setTemplate(tplName, node))
                {
                    callback();
                    return true;
                }
            }
            else
            {
                if(this.setTemplate(tplName, node))
                {
                    callback();
                    return true;
                }
            }
        }
        return false;
    }

    public init(entity:IAres):void
    {
        this._entity = entity;
        // 开始编译root节点
        this.compile(this._root, entity.data);
    }

    public compile(node:PIXI.DisplayObject, scope:any):void
    {
        // 首先判断是否是模板，是的话就设置模板，但是不编译
        if(this.parseTpl(node)) return;
        // 开始编译
        var hasLazyCompile:boolean = false;
        // 如果有名字就记下来
        var name:string = node.name;
        if(name) this._nameDict[name] = node;
        // 开始遍历属性列表
        var cmdDict:CmdDict = this.parseCmd(node);
        var cmdsToCompile:{propName:string, cmd:Command, ctx:CommandContext}[] = [];
        // 设置label，以便跳出双重循环
        flag:
        for(var cmdName in cmdDict)
        {
            var cmdDatas:AresCommandData[] = cmdDict[cmdName];
            for(var i:number = 0, len:number = cmdDatas.length; i < len; i++)
            {
                var cmdData:AresCommandData = cmdDatas[i];
                var isCommonCmd:boolean = this._entity.testCommand(cmdData);
                // 用命令名取到Command
                var cmd:Command = commands[cmdName];
                // 如果没有找到命令，则认为是自定义命令，套用prop命令
                if(!isCommonCmd && !cmd)
                {
                    cmdData.cmdName = "prop";
                    cmdData.subCmd = cmdName || "";
                    cmd = commands[cmdData.cmdName];
                }
                // 推入数组
                var cmdToCompile:{propName:string, cmd:Command, ctx:CommandContext} = {
                    propName: cmdData.propName,
                    cmd: cmd,
                    ctx: {
                        scope: scope,
                        target: node,
                        compiler: this,
                        entity: this._entity,
                        cmdData: cmdData,
                        cmdDict: cmdDict
                    }
                };
                // 如果是tpl命令则需要提前
                if(cmdData.cmdName == "tpl") cmdsToCompile.unshift(cmdToCompile);
                else cmdsToCompile.push(cmdToCompile);
                // 如果是for或者if则设置懒编译
                if(cmdData.cmdName == "if" || cmdData.cmdName == "for")
                {
                    hasLazyCompile = true;
                    // 清空数组，仅留下自身的编译
                    cmdsToCompile.splice(0, cmdsToCompile.length - 1);
                    // 跳出双重循环
                    break flag;
                }
            }
        }
        // 开始编译当前节点外部结构
        for(var i:number = 0, len:number = cmdsToCompile.length; i < len; i++)
        {
            var cmdToCompile:{propName:string, cmd:Command, ctx:CommandContext} = cmdsToCompile[i];
            // 更新target属性
            cmdToCompile.ctx.target = node;
            // 移除属性
            delete cmdToCompile.ctx.target[cmdToCompile.propName];
            // 开始编译，首先尝试执行通用命令
            var isCommonCmd:boolean = this._entity.execCommand(cmdToCompile.ctx.cmdData, node, scope);
            // 如果是通用命令则不再继续执行，否则按照特殊命令执行
            if(!isCommonCmd) node = cmdToCompile.cmd(cmdToCompile.ctx);
        }
        // 如果没有懒编译则编译内部结构
        if(!hasLazyCompile)
        {
            // 如果是文本对象，则进行文本内容编译
            if(node instanceof PIXI.Text)
            {
                this.compileTextContent(node as PIXI.Text, scope, cmdDict);
            }
            // 然后递归解析子节点
            if(node instanceof PIXI.Container)
            {
                var children:PIXI.DisplayObject[] = (node as PIXI.Container).children;
                var nextChild:PIXI.DisplayObject;
                for(var i:number = 0, len:number = children.length; i < len; i++)
                {
                    var child:PIXI.DisplayObject = children[i];
                    // 记录下一个子节点
                    nextChild = children[i + 1];
                    // 开始编译
                    this.compile(child, scope);
                    // 重置索引值和长度值
                    var nextI:number = children.indexOf(nextChild);
                    if(nextI >= 0 && nextI != i + 1)
                    {
                        i = nextI - 1;
                        len = children.length;
                    }
                }
            }
        }
    }

    /**
     * 获取模板对象，该模板只在该PIXICompiler内部生效
     * @param name 模板名称
     * @returns {PIXI.DisplayObject|undefined} 如果模板名称存在则返回模板对象
     */
    public getTemplate(name:string):PIXI.DisplayObject
    {
        return this._tplDict[name];
    }

    /**
     * 设置模板，该模板只在该PIXICompiler内部生效
     * @param name 模板名称
     * @param tpl 模板对象
     * @returns {PIXI.DisplayObject|null} 如果成功设置了模板则返回模板对象，否则返回null（如已存在同名模板）
     */
    public setTemplate(name:string, tpl:PIXI.DisplayObject):PIXI.DisplayObject
    {
        // 非空判断
        if(!name || !tpl) return null;
        // 如果已经有了模板定义则返回null
        if(this._tplDict[name]) return null;
        // 添加模板定义
        this._tplDict[name] = tpl;
        // 返回模板对象
        return tpl;
    }

    private compileTextContent(text:PIXI.Text, scope:any, cmdDict:CmdDict):void
    {
        var value:string = text.text;
        if(PIXICompiler._textRegExp.test(value))
        {
            var exp:string = this.parseTextExp(value);
            textContent({
                scope: scope,
                target: text,
                compiler: this,
                entity: this._entity,
                cmdData: {
                    cmdName: "textContent",
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
        var reg:RegExp = PIXICompiler._textRegExp;
        for(var result:RegExpExecArray = reg.exec(exp); result != null; result = reg.exec(exp))
        {
            exp = result[1] + "${" + result[2] + "}" + result[3];
        }
        return "`" + exp + "`";
    }
}