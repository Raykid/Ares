/// <reference path="TemplateCommands.ts"/>
/// <reference path="../../../dist/ares.d.ts"/>

/**
 * Created by Raykid on 2017/3/17.
 */
namespace ares.template
{
    export interface PIXIBindConfig
    {
        [name:string]:PIXIBindConfigCommands
    }

    export interface PIXIBindConfigCommands
    {
        [cmd:string]:any;
    }

    export class TemplateCompiler implements Compiler
    {
        private _template:string;
        private _onUpdate:(text:string)=>void;
        private _config:PIXIBindConfig;
        private _entity:IAres;
        private _scope:any;
        private _root:TemplateNode;

        public get root():TemplateNode
        {
            return this._root;
        }

        /**
         * 创建模板绑定
         * @param template 模板字符串
         * @param onUpdate 当文本有更新时调用，传入最新文本
         * @param config 绑定数据
         */
        public constructor(template:string, onUpdate:(text:string)=>void, config?:PIXIBindConfig)
        {
            this._template = template;
            this._onUpdate = onUpdate;
            this._config = config;
        }

        public init(entity:IAres):void
        {
            this._entity = entity;
            // 将整个模板文本编译为节点
            this._root = this.transformToNode(this._template);
            // 开始编译根节点
            this.compile(this._root, entity.data);
            // 更新首次显示
            this.update();
            // 将所有node节点的value变为getter、setter
            this.mutateValue(this._root);
        }

        public compile(node:TemplateNode, scope:any):void
        {
            this._scope = scope;
            // 如果节点的cmd不认识，则不编译该节点，仅编译其子节点
            var cmd:Command = commands[node.cmd];
            if(cmd)
            {
                var ctx:CommandContext = {
                    node: node,
                    scope: scope,
                    compiler: this,
                    entity: this._entity
                };
                cmd(ctx);
            }
            // 开始递归编译子节点，但if或者for不编译
            if(node.children && node.cmd != "if" && node.cmd != "for")
            {
                compileChildren(node, scope, this);
            }
        }

        private update():void
        {
            var text:string = getChildrenString(this._root);
            this._onUpdate(text);
        }

        private mutateValue(node:TemplateNode):void
        {
            var value:string = node.value;
            var self:TemplateCompiler = this;
            Object.defineProperty(node, "value", {
                configurable: true,
                enumerable: true,
                get: ()=>{
                    return value;
                },
                set: (v:string)=>{
                    value = v;
                    // 更新显示
                    self.update();
                }
            });
            // 递归子对象
            if(node.children)
            {
                node.children.forEach(this.mutateValue, this);
            }
        }

        private getEndIndex(str:string, startIndex:number):number
        {
            var startIcons:string[] = ["{", "\"", "'", "`", "(", "["];
            var endIcons:string[] = ["}", "\"", "'", "`", ")", "]"];
            var stack:number[] = [0];
            for(var i:number = startIndex, len:number = str.length; i < len; i++)
            {
                var tempChar:string = str.charAt(i);
                var startIndex:number = startIcons.indexOf(tempChar);
                var endIndex:number = endIcons.indexOf(tempChar);
                // 如果是终结符号且当前栈顶是对应起始符号，则出栈
                if(endIndex >= 0 && stack[stack.length - 1] == endIndex) stack.pop();
                // 如果是起始字符则入栈
                else if(startIndex >= 0) stack.push(startIndex);
                // 如果stack已经空了，则立即返回当前字符的下一个索引
                if(stack.length <= 0) return (i + 1);
            }
            return -1;
        }

        private transformToNode(str:string):TemplateNode
        {
            var regAres:RegExp = /\$a\-\{/g;
            var regTrim:RegExp = /^\s*([\s\S]*)\s*$/;
            var regCmd:RegExp = /^\s*([a-zA-Z0-9_]+?)\s*:\s*(.+?)\s*$/;
            var regEnd:RegExp = /^\s*end\s+([a-zA-Z0-9_]+?)\s*$/;
            // 遍历整个str，使用ares命令将其分隔成数组
            var nodes:TemplateNode[] = [];
            var index:number = 0;
            var length:number = str.length;
            var cmdStack:TemplateNode[] = [];
            var eatCount:number;
            for(var resAres:RegExpExecArray = regAres.exec(str); resAres != null; resAres = regAres.exec(str))
            {
                var endIndex:number = this.getEndIndex(str, resAres.index + resAres[0].length);
                if(endIndex < 0)
                {
                    console.error(`指令没有结束${str.substr(resAres.index)}`);
                    return null;
                }
                regAres.lastIndex = endIndex;
                var whole:string = str.substring(resAres.index, endIndex);
                var content:string = whole.substring(resAres[0].length, whole.length - 1);

                eatCount = 0;
                // 把ares命令前面的部分以简单文本形式推入数组（如果有的话）
                if(resAres.index > index)
                {
                    nodes.push({
                        cmd: "text",
                        exp: str.substring(index, resAres.index)
                    });
                }
                // 把ares命令部分推入数组
                var resEnd:RegExpExecArray = regEnd.exec(content);
                if(resEnd != null)
                {
                    // 是命令的终结指令，需要清除节点两侧的空白符
                    clearNode();
                    // 弹出一个命令
                    var start:TemplateNode = cmdStack.pop();
                    // 判断正确性
                    if(start == null)
                    {
                        console.error(`终结指令(${resEnd[1]})没有对应的起始指令`);
                        return null;
                    }
                    if(start.cmd != resEnd[1])
                    {
                        console.error(`起始指令(${start.cmd})与终结指令(${resEnd[1]})不匹配`);
                        return null;
                    }
                    // 将起始指令与终结指令之间所有节点放入该命令内部
                    var startIndex:number = nodes.indexOf(start);
                    start.children = nodes.splice(startIndex + 1);
                }
                else
                {
                    // 不是终结指令
                    var resCmd:RegExpExecArray = regCmd.exec(content);
                    if(resCmd != null)
                    {
                        // 是起始命令，需要清除节点两侧的空白符
                        clearNode();
                        // 生成命令节点
                        var node:TemplateNode = {
                            cmd: resCmd[1],
                            exp: resCmd[2]
                        }
                        nodes.push(node);
                        // 推入命令栈
                        cmdStack.push(node);
                    }
                    else if(content == "")
                    {
                        // 是占位符，需要清除节点两侧的空白符
                        clearNode();
                    }
                    else
                    {
                        // 只是简单的表达式
                        nodes.push({
                            cmd: "exp",
                            exp: content
                        });
                    }
                }
                // 修改index指向
                index = resAres.index + whole.length + eatCount;
            }
            if(index < length)
            {
                // 把最后一点字符推入数组
                nodes.push({
                    cmd: "text",
                    exp: str.substr(index)
                });
            }
            // 如果命令栈不为空，则表示起始指令没有终结指令
            if(cmdStack.length > 0)
            {
                console.error(`起始指令${cmdStack[0].cmd}没有对应的终结指令`);
                return null;
            }
            // 返回结果
            return {
                cmd: null,
                exp: null,
                children: nodes
            };

            function clearNode():void
            {
                var regBlankBefore:RegExp = /[ \f\t\v]*/;
                var regBlankAfter:RegExp = /([ \f\t\v]*((\r\n)|[\r\n]))|([ \f\t\v]*)/g;
                var lastNode:TemplateNode = nodes[nodes.length - 1];
                if(lastNode && lastNode.cmd == "text")
                {
                    // 将上一条换行符后面的空白符吃掉
                    var index:number = Math.max(lastNode.exp.lastIndexOf("\r"), lastNode.exp.lastIndexOf("\n"));
                    lastNode.exp = lastNode.exp.substring(0, index + 1) + lastNode.exp.substr(index + 1).replace(regBlankBefore, "");
                }
                // 再把本行直到换行符为止的空白符都吃掉
                regBlankAfter.lastIndex = resAres.index + whole.length;
                var resBlank:RegExpExecArray = regBlankAfter.exec(str);
                if(resBlank) eatCount = resBlank[0].length;
            }
        }
    }
}
// 为了nodejs模块
var module:any = module || {};
module.exports = ares.template;