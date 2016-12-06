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
            return new Function(
                "$data",
                "$parent",
                "$root",
                "return " + this._exp)
            (
                scope,
                scope.$parent,
                scope.$root
            );
        }
    }

    export interface Scope
    {
        $parent:Scope;
        $root:Scope;
        [key:string]:any;
    }
}