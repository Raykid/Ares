/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
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
        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            // 记录原始class值
            var oriCls:string = target.getAttribute("class");
            return {
                update: ()=>{
                    var params:any = new Expresion(exp).run(scope);
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
            };
        }
    }

    /** 修改任意属性命令 */
    export class AttrCmd implements Cmd
    {
        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            return {
                update: ()=>{
                    var params:any = new Expresion(exp).run(scope);
                    // 遍历所有params的key，如果其表达式值为true则添加其类型
                    for(var name in params)
                    {
                        var value:any = params[name];
                        target.setAttribute(name, value);
                    }
                }
            };
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
                var newTarget:HTMLElement = (index == 0 ? firstElement : target.cloneNode(true) as HTMLElement);
                if(parent.contains(next)) parent.insertBefore(newTarget, next);
                else parent.appendChild(newTarget);
                targets.push(newTarget);
                // 用新的作用域遍历新节点
                var updaters:Updater[] = entity.compile(newTarget, subScope);
                // 立即更新
                updaters.map(updater=>updater.update(entity), this);
            }
        }
    }
}