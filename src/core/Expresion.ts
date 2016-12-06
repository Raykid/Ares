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