/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
    export class Expresion
    {
        private _exp:string;

        public constructor(exp:string)
        {
            // 将exp中所有没有以$data开头的变量都加上$data
            //var reg:RegExp = /(\$data\.)?([a-zA-Z0-9\.]+)/g;
            //this._exp = exp.replace(reg, "$data.$2");
            this._exp = exp;
        }

        public run(scope:Scope):any
        {
            var keys:string[] = Object.keys(scope);
            var values:any[] = [];
            for(var i:number = 0, len:number = keys.length; i < len; i++)
            {
                values.push(scope[keys[i]]);
            }
            keys.push("return " + this._exp);
            return Function.apply(null, keys).apply(null, values);
        }
    }

    export interface Scope
    {
        $original:any;
        $data:Scope;
        $parent:Scope;
        $root:Scope;
        [key:string]:any;
    }
}