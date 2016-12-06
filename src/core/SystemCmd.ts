/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
    /** 文本命令 */
    export class TextCmd implements Cmd
    {
        public get subScope():boolean
        {
            return false;
        }

        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    // 更新target节点的textContent
                    target.innerText = expresion.run(scope);
                }
            };
        }
    }

    /** HTML文本命令 */
    export class HtmlCmd implements Cmd
    {
        public get subScope():boolean
        {
            return false;
        }

        public exec(target:HTMLElement, exp:string, scope:Scope):Updater
        {
            var expresion:Expresion = new Expresion(exp);
            return {
                update: ()=>{
                    // 更新target节点的textContent
                    target.innerHTML = expresion.run(scope);
                }
            };
        }
    }
}