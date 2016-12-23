/**
 * Created by Raykid on 2016/12/22.
 */
namespace ares.utils
{
    /**
     * 创建一个表达式求值方法，用于未来执行
     * @param exp 表达式
     * @returns {Function} 创建的方法
     */
    export function createEvalFunc(exp:string):(scope:any)=>any
    {
        return Function("scope", "with(scope){return " + exp + "}") as (scope:any)=>any;
    }

    /**
     * 表达式求值，无法执行多条语句
     * @param exp 表达式
     * @param scope 表达式的作用域
     * @returns {any} 返回值
     */
    export function evalExp(exp:string, scope:any):any
    {
        return createEvalFunc(exp)(scope);
    }

    /**
     * 创建一个执行方法，用于未来执行
     * @param exp 表达式
     * @returns {Function} 创建的方法
     */
    export function createRunFunc(exp:string):(scope:any)=>void
    {
        return Function("scope", "with(scope){" + exp + "}") as (scope:any)=>void;
    }

    /**
     * 直接执行表达式，不求值。该方法可以执行多条语句
     * @param exp 表达式
     * @param scope 表达式的作用域
     */
    export function runExp(exp:string, scope:any):void
    {
        createRunFunc(exp)(scope);
    }
}