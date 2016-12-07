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
            var targets:HTMLElement[] = [];
            var res:RegExpExecArray = this._reg.exec(exp);
            var subName:string = res[1];
            var listName:string = res[2];
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
                    var parent:HTMLElement = target.parentElement;
                    var list:any[] = new Expresion(listName).run(scope);
                    var subScope:any = {};
                    subScope.__proto__ = scope;
                    for(var i:number = 0, len:number = list.length; i < len; i++)
                    {
                        // 构造一个新作用域
                        subScope[subName] = list[i];
                        // 构造一个新的节点，如果是第一个元素则直接使用target作为目标节点
                        var newTarget:HTMLElement = target.cloneNode(true) as HTMLElement;
                        parent.appendChild(newTarget);
                        targets.push(newTarget);
                        // 用新的作用域遍历新节点
                        var updaters:Updater[] = entity.compile(newTarget, subScope);
                        // 立即更新
                        updaters.map(updater=>updater.update(entity), this);
                    }
                }
            };
        }
    }
}