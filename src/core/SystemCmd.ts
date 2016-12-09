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

        private static getValidNodes(target:HTMLElement):Node[]
        {
            // 取出target中所有的text节点
            var nodes:NodeList = target.childNodes;
            var res:Node[] = [];
            for(var i:number = 0, len:number = nodes.length; i < len; i++)
            {
                var node:Node = nodes[i];
                if(node.nodeType == 3) res.push(node);
            }
            return res;
        }

        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var names:string[];
            return {
                update: (entity:AresEntity)=>{
                    var first:boolean = (names == null);
                    if(first || entity.dependDirty(names, scope))
                    {
                        if(first) names = [];
                        var nodes:Node[] = TextContentCmd.getValidNodes(target);
                        for(var i:number = 0, len:number = nodes.length; i < len; i++)
                        {
                            var node:Node = nodes[i];
                            var temp:string = node.nodeValue;
                            var hasChange:boolean = false;
                            // 依序将{{}}计算出来
                            for(var res:ContentResult = Expresion.getContentBetween(temp, "{{", "}}"); res != null; res = Expresion.getContentBetween(temp, "{{", "}}"))
                            {
                                var tempExp:Expresion = new Expresion(res.value);
                                temp = temp.substr(0, res.begin - 2) + tempExp.run(scope) + temp.substr(res.end + 2);
                                if(first) names.push.apply(names, tempExp.names);
                                hasChange = true;
                            }
                            // 更新target节点的内容
                            if(hasChange)
                            {
                                var newNode:Node = node.cloneNode(false);
                                newNode.nodeValue = temp;
                                target.replaceChild(newNode, node);
                            }
                        }
                    }
                }
            };
        }

        public needParse(target:HTMLElement):boolean
        {
            var nodes:Node[] = TextContentCmd.getValidNodes(target);
            // 看看有没有被{{}}包围的内容
            for(var i:number = 0, len:number = nodes.length; i < len; i++)
            {
                var res:ContentResult = Expresion.getContentBetween(nodes[i].nodeValue, "{{", "}}");
                if(res != null) return true;
            }
            return false;
        }
    }
    /** 文本命令 */
    export class TextCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: (entity:AresEntity)=>{
                    if(entity.dependDirty(expresion.names, scope))
                    {
                        // 更新target节点的innerText
                        target.innerText = expresion.run(scope);
                    }
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
                update: (entity:AresEntity)=>{
                    if(entity.dependDirty(expresion.names, scope))
                    {
                        // 更新target节点的innerHTML
                        target.innerHTML = expresion.run(scope);
                    }
                }
            };
        }
    }

    /** CSS类型命令 */
    export class CssCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope, subCmd:string):Updater
        {
            var names:string[] = null;
            // 记录原始class值
            var oriCls:string = target.getAttribute("class");
            return {
                update: (entity:AresEntity)=>{
                    var first:boolean = (names == null);
                    if(first || entity.dependDirty(names, scope))
                    {
                        if(subCmd != "")
                        {
                            // 子命令形式
                            var tempExp:Expresion = new Expresion(exp);
                            if(first) names = tempExp.names;
                            var match:boolean = tempExp.run(scope);
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
                            var tempExp:Expresion = new Expresion(exp);
                            if(first) names = tempExp.names;
                            var params:any = tempExp.run(scope);
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
                }
            };
        }
    }

    /** 修改任意属性命令 */
    export class AttrCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope, subCmd:string):Updater
        {
            var names:string[] = null;
            return {
                update: (entity:AresEntity)=>{
                    var first:boolean = (names == null);
                    if(first || entity.dependDirty(names, scope))
                    {
                        if(subCmd != "")
                        {
                            // 子命令形式
                            var tempExp:Expresion = new Expresion(exp);
                            if(first) names = tempExp.names;
                            var res:any = tempExp.run(scope);
                            target.setAttribute(subCmd, res);
                        }
                        else
                        {
                            // 集成形式
                            var tempExp:Expresion = new Expresion(exp);
                            if(first) names = tempExp.names;
                            var params:any = tempExp.run(scope);
                            // 遍历所有params的key，如果其表达式值为true则添加其类型
                            for(var name in params)
                            {
                                var value:any = params[name];
                                target.setAttribute(name, value);
                            }
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
            var names:string[] = null;
            exp = this.transform(exp);
            // 外面包一层function，因为要的是方法引用，而不是直接执行方法
            exp = "function($data){" + exp + "}";
            return {
                update: ()=>{
                    var first:boolean = (names == null);
                    if(first)
                    {
                        if(subCmd != "")
                        {
                            // 子命令形式
                            var tempExp:Expresion = new Expresion(exp);
                            names = tempExp.names;
                            target.addEventListener(subCmd, tempExp.run(scope).bind(null, scope));
                        }
                        else
                        {
                            // 集成形式
                            var tempExp:Expresion = new Expresion(exp);
                            names = tempExp.names;
                            var params:any = tempExp.run(scope);
                            // 遍历所有params的key，在target上监听该事件
                            for(var name in params)
                            {
                                target.addEventListener(name, params[name].bind(null, scope));
                            }
                        }
                    }
                }
            };
        }

        private transform(exp:string):string
        {
            var count:number = 0;
            var reg:RegExp = /[\(\)]/g;
            var bIndex:number = -1;
            var eIndex:number = -1;
            for(var res:RegExpExecArray = reg.exec(exp); res != null; res = reg.exec(exp))
            {
                if(res[0] == "(")
                {
                    if(count == 0) bIndex = res.index + 1;
                    count ++;
                }
                else
                {
                    count --;
                    if(count == 0)
                    {
                        eIndex = res.index;
                        break;
                    }
                }
            }
            if(bIndex >= 0 && eIndex >= 0)
            {
                // 递归处理参数部分和后面的部分
                var part2:string = this.transform(exp.substring(bIndex, eIndex));
                var part3:string = this.transform(exp.substr(eIndex + 1));
                // 处理方法名部分
                var part1:string = exp.substr(0, bIndex - 1);
                var reg:RegExp = /[\w\$][\w\$\.]+[\w\$]$/;
                var res:RegExpExecArray = reg.exec(part1);
                if(res != null)
                {
                    var funcName:string = res[0];
                    var before:string = part1.substr(0, res.index);
                    // 用call方法将$data绑定到方法参数里
                    exp = `${before}(function(){var temp = [${part2}];try{return ${funcName}.apply($data,temp)${part3}}catch(err){return ${funcName}.apply(null,temp)${part3}}})()`;
                }
                else
                {
                    exp = part1 + "(" + part2 + ")" + part3;
                }
            }
            return exp;
        }
    }

    /** if命令 */
    export class IfCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: (entity:AresEntity)=>{
                    if(entity.dependDirty(expresion.names, scope))
                    {
                        var condition:boolean = expresion.run(scope);
                        target.style.display = (condition ? "" : "none");
                    }
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
            var names:string[] = null;
            var subUpdaters:Updater[] = [];

            var next:HTMLElement = target.nextElementSibling as HTMLElement;
            var targets:HTMLElement[] = [];
            var res:RegExpExecArray = this._reg.exec(exp);
            var subName:string = res[1];
            var listName:string = res[2];
            var parent:HTMLElement = target.parentElement;
            var firstElement:HTMLElement = target;
            parent.removeChild(firstElement);
            target = target.cloneNode(true) as HTMLElement;
            // 去掉target中的a-for属性
            target.removeAttribute("data-a-for");
            target.removeAttribute("a-for");
            // 记录下所有target剩余的属性，否则firstElement之后无法被正确编译，因为缺少属性
            var firstAttrs:NamedNodeMap = target.attributes;
            return {
                update: (entity:AresEntity)=>{
                    var first:boolean = (names == null);
                    if(first || entity.dependDirty(names, scope))
                    {
                        // 首先清空当前已有的对象节点
                        var len:number = targets.length;
                        while(len --)
                        {
                            var child:HTMLElement = targets.pop();
                            child.parentElement.removeChild(child);
                        }
                        // 生成新对象
                        var tempExp:Expresion = new Expresion(listName);
                        if(first) names = tempExp.names;
                        var list:any = tempExp.run(scope);
                        if(typeof list == "number")
                        {
                            for(var i:number = 0; i < list; i++)
                            {
                                // 构造一个新作用域
                                var tempPath:string = `${listName}[${i}]`;
                                var subScope:any = {};
                                subScope.__proto__ = scope;
                                Object.defineProperties(subScope, {
                                    $data: {value: subScope, writable: false},
                                    $parent: {value: scope, writable: false},
                                    $root: {value: scope.$root, writable: false},
                                    $path: {value: (scope === scope.$root ? tempPath : scope.$path + "." + tempPath), writable: false}
                                });
                                Object.defineProperty(subScope, subName, {value: i, writable: false});
                                var tempUpdaters:Updater[] = update(i, entity, subScope, next);
                                subUpdaters.push.apply(subUpdaters, tempUpdaters);
                            }
                        }
                        else if(list instanceof Array)
                        {
                            for(var i:number = 0, len:number = list.length; i < len; i++)
                            {
                                // 构造一个新作用域
                                var tempPath:string = `${listName}[${i}]`;
                                var subScope:any = {};
                                subScope.__proto__ = scope;
                                Object.defineProperties(subScope, {
                                    $data: {value: subScope, writable: false},
                                    $parent: {value: scope, writable: false},
                                    $root: {value: scope.$root, writable: false},
                                    $path: {value: (scope === scope.$root ? tempPath : scope.$path + "." + tempPath), writable: false}
                                });
                                Object.defineProperty(subScope, subName, {value: entity.proxyData(list[i]), writable: false});
                                Object.defineProperty(subScope[subName], "$path", {value: subScope.$path, writable: false});
                                var tempUpdaters:Updater[] = update(i, entity, subScope, next);
                                subUpdaters.push.apply(subUpdaters, tempUpdaters);
                            }
                        }
                        else
                        {
                            var index:number = 0;
                            for(var key in list)
                            {
                                // 构造一个新作用域
                                var tempPath:string = `${listName}["${key}"]`;
                                var subScope:any = {};
                                subScope.__proto__ = scope;
                                Object.defineProperties(subScope, {
                                    $key: {value: key, writable: false},
                                    $data: {value: subScope, writable: false},
                                    $parent: {value: scope, writable: false},
                                    $root: {value: scope.$root, writable: false},
                                    $path: {value: (scope === scope.$root ? tempPath : scope.$path + "." + tempPath), writable: false}
                                });
                                Object.defineProperty(subScope, subName, {value: entity.proxyData(list[key]), writable: false});
                                var tempUpdaters:Updater[] = update(index, entity, subScope, next);
                                subUpdaters.push.apply(subUpdaters, tempUpdaters);
                                index ++;
                            }
                        }
                    }
                    // 无论如何一定要更新一下子列表
                    for(var i:number = 0, len:number = subUpdaters.length; i < len; i++)
                    {
                        subUpdaters[i].update(entity);
                    }
                }
            };

            function update(index:number, entity:AresEntity, subScope:Scope, next:HTMLElement):Updater[]
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
                return entity.compile(newTarget, subScope);
            }
        }
    }
}