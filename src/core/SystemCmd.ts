/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
    /** 文本内容命令 */
    export class TextContentCmd implements Cmd
    {
        private static _instance:TextContentCmd = new TextContentCmd();
        public static getInstance():TextContentCmd
        {
            return TextContentCmd._instance;
        }

        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            return {
                update: ()=>{
                    var temp:string = exp;
                    // 依序将{{}}计算出来
                    for(var res:ContentResult = Expresion.getContentBetween(temp, "{{", "}}"); res != null; res = Expresion.getContentBetween(temp, "{{", "}}"))
                    {
                        temp = temp.substr(0, res.begin - 2) + new Expresion(res.value).run(scope) + temp.substr(res.end + 2);
                    }
                    // 更新target节点的innerText
                    target.innerText = temp;
                }
            };
        }

        public needParse(target:HTMLElement, exp:string):boolean
        {
            // 不是叶子节点不给转换
            if(target.children.length > 0) return false;
            // 看看有没有被{{}}包围的内容
            var res:ContentResult = Expresion.getContentBetween(exp, "{{", "}}");
            return (res != null);
        }
    }
    /** 文本命令 */
    export class TextCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    // 更新target节点的innerText
                    target.innerText = expresion.run(scope);
                }
            };
        }
    }

    /** HTML文本命令 */
    export class HtmlCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    // 更新target节点的innerHTML
                    target.innerHTML = expresion.run(scope);
                }
            };
        }
    }

    /** CSS类型命令 */
    export class CssCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope, subCmd:string):Updater
        {
            // 记录原始class值
            var oriCls:string = target.getAttribute("class");
            return {
                update: ()=>{
                    if(subCmd != "")
                    {
                        // 子命令形式
                        var match:boolean = new Expresion(exp).run(scope);
                        if(match == true)
                        {
                            var newCls:string = subCmd;
                            if(oriCls) newCls = oriCls + " " + newCls;
                            // 更新target节点的class属性
                            target.setAttribute("class", newCls);
                        }
                    }
                    else
                    {
                        var params:any = new Expresion(exp).run(scope);
                        if(typeof params == "string")
                        {
                            // 直接赋值形式
                            if(oriCls) params = oriCls + " " + params;
                            // 更新target节点的class属性
                            target.setAttribute("class", params);
                        }
                        else
                        {
                            // 集成形式
                            var arr:string[] = [];
                            if(oriCls) arr.push(oriCls);
                            // 遍历所有params的key，如果其表达式值为true则添加其类型
                            for(var cls in params)
                            {
                                if(params[cls] == true) arr.push(cls);
                            }
                            // 更新target节点的class属性
                            if(arr.length > 0) target.setAttribute("class", arr.join(" "));
                        }
                    }
                }
            };
        }
    }

    /** 修改任意属性命令 */
    export class AttrCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope, subCmd:string):Updater
        {
            return {
                update: ()=>{
                    if(subCmd != "")
                    {
                        // 子命令形式
                        var res:any = new Expresion(exp).run(scope);
                        target.setAttribute(subCmd, res);
                    }
                    else
                    {
                        // 集成形式
                        var params:any = new Expresion(exp).run(scope);
                        // 遍历所有params的key，如果其表达式值为true则添加其类型
                        for(var name in params)
                        {
                            var value:any = params[name];
                            target.setAttribute(name, value);
                        }
                    }
                }
            };
        }
    }

    /** 监听事件命令 */
    export class OnCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope, subCmd:string):Updater
        {
            // 将表达式中方法的括号去掉，因为要的是方法引用，而不是执行方法
            var reg:RegExp = /([\w\$\.]+)\(([^\)]*)\)/g;
            for(var res:RegExpExecArray = reg.exec(exp); res != null; res = reg.exec(exp))
            {
                // 将参数中的空白符都去掉
                var argStr:string = res[2].replace(/\s+/g, "");
                if(argStr.length > 0) argStr = "," + argStr;
                // 解析所有的参数，用bind方法绑定到方法参数里
                var part1:string = exp.substr(0, res.index) + res[1] + ".bind($data" + argStr + ")";
                var part2:string = exp.substr(res.index + res[0].length);
                exp = part1 + part2;
                reg.lastIndex = part1.length;
            }
            return {
                update: ()=>{
                    if(subCmd != "")
                    {
                        // 子命令形式
                        var handler:Function = new Expresion(exp).run(scope);
                        target.addEventListener(subCmd, this.handler.bind(this, handler));
                    }
                    else
                    {
                        // 集成形式
                        var params:any = new Expresion(exp).run(scope);
                        // 遍历所有params的key，在target上监听该事件
                        for(var name in params)
                        {
                            target.addEventListener(name, this.handler.bind(this, params[name]));
                        }
                    }
                }
            };
        }

        private handler(callback:Function, evt:Event):void
        {
            callback(evt);
        }
    }

    /** if命令 */
    export class IfCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    var condition:boolean = expresion.run(scope);
                    target.style.display = (condition ? "" : "none");
                }
            };
        }
    }

    /** for命令 */
    export class ForCmd implements Cmd
    {
        private _reg:RegExp = /([\w\.\$]+)\s+in\s+([\w\.\$]+)/;

        public get priority():number
        {
            return 1000;
        }

        public get stopCompile():boolean
        {
            // for命令需要将所有子节点延迟到更新时再编译
            return true;
        }

        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var next:HTMLElement = target.nextElementSibling as HTMLElement;
            var targets:HTMLElement[] = [];
            var res:RegExpExecArray = this._reg.exec(exp);
            var subName:string = res[1];
            var listName:string = res[2];
            var parent:HTMLElement = target.parentElement;
            var firstElement:HTMLElement = target;
            target = target.cloneNode(true) as HTMLElement;
            // 去掉target中的a-for属性
            target.removeAttribute("data-a-for");
            target.removeAttribute("a-for");
            // 记录下所有target剩余的属性，否则firstElement之后无法被正确编译，因为缺少属性
            var firstAttrs:NamedNodeMap = target.attributes;
            return {
                update: (entity:AresEntity)=>{
                    // 首先清空当前已有的对象节点
                    var len:number = targets.length;
                    while(len --)
                    {
                        var child:HTMLElement = targets.pop();
                        child.parentElement.removeChild(child);
                    }
                    // 生成新对象
                    var list:any = new Expresion(listName).run(scope);
                    if(typeof list == "number")
                    {
                        var subScope:any = {};
                        subScope.__proto__ = scope;
                        for(var i:number = 0; i < list; i++)
                        {
                            // 构造一个新作用域
                            subScope[subName] = i;
                            update(i, entity, subScope, next);
                        }
                    }
                    else
                    {
                        var subScope:any = {};
                        subScope.__proto__ = scope;
                        for(var i:number = 0, len:number = list.length; i < len; i++)
                        {
                            // 构造一个新作用域
                            subScope[subName] = list[i];
                            update(i, entity, subScope, next);
                        }
                    }
                }
            };

            function update(index:number, entity:AresEntity, subScope:Scope, next:HTMLElement):void
            {
                // 构造一个新的节点，如果是第一个元素则直接使用firstElement作为目标节点
                var newTarget:HTMLElement;
                if(index == 0)
                {
                    newTarget = firstElement;
                    // 为首个节点赋属性值
                    for(var i:number = 0, len:number = firstAttrs.length; i < len; i++)
                    {
                        var attr:Attr = firstAttrs[i];
                        firstElement.setAttribute(attr.name, attr.value);
                    }
                }
                else
                {
                    newTarget = target.cloneNode(true) as HTMLElement;
                }
                if(parent.contains(next)) parent.insertBefore(newTarget, next);
                else parent.appendChild(newTarget);
                targets.push(newTarget);
                // 为for循环的scope添加$index属性
                subScope["$index"] = index;
                // 用新的作用域遍历新节点
                var updaters:Updater[] = entity.compile(newTarget, subScope);
                // 立即更新
                updaters.map(updater=>updater.update(entity), this);
            }
        }
    }
}