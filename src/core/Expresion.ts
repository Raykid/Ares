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
            this._exp = this.changeParamNames(exp);
        }

        private getFirst(exp:string, flag:string, from:number=0):ContentResult
        {
            var reg:RegExp = new RegExp("(\\\\*)" + flag, "g");
            reg.lastIndex = from;
            for(var res:RegExpExecArray = reg.exec(exp); res != null; res = reg.exec(exp))
            {
                // 如果字符前面的\是奇数个，表示这个字符是被转义的，不是目标字符
                if(res[1].length % 2 == 0)
                {
                    return {
                        begin: res.index,
                        end: res.index + res[0].length,
                        value: res[0]
                    };
                }
            }
            return null;
        }

        /**
         * 获取flag表示的字符之间所有的字符，该字符前面如果有\则会当做普通字符，而不会作为flag字符
         * @param exp 原始表达式
         * @param begin 边界开始字符串
         * @param end 边界结束字符串
         * @returns {ContentResult} 内容结构体
         */
        private getContentBetween(exp:string, begin:string, end:string):ContentResult
        {
            var bRes:ContentResult = this.getFirst(exp, begin);
            if(!bRes) return null;
            var eRes:ContentResult = this.getFirst(exp, end, bRes.end);
            if(!eRes) return null;
            return {
                begin: bRes.end,
                end: eRes.begin,
                value: exp.substring(bRes.end, eRes.begin)
            };
        }

        private parseOriExp(exp:string):string
        {
            if(exp == "") return exp;
            // 分别将""和''找出来，然后将其两边的字符串递归处理，最后再用正则表达式匹配
            var first1:ContentResult = this.getFirst(exp, "'");
            var first2:ContentResult = this.getFirst(exp, '"');
            var first:ContentResult, second:ContentResult;
            if(!first1 && !first2)
            {
                // 啥都没有，使用正则表达式匹配
                exp = exp.replace(/[a-z\.\$][\w\.\$]*/ig, (str:string, index:number, exp:string)=>{
                    if(str.indexOf("$data.") != 0)
                    {
                        // 如果str和冒号:之间都是空白字符或者没有字符，则不替换$data
                        var i:number = exp.indexOf(":");
                        if(i > index)
                        {
                            var temp:string = exp.substring(index + str.length, i);
                            if(/^\s*$/.test(temp)) return str;
                        }
                        str = "$data." + str;
                    }
                    return str;
                });
            }
            else
            {
                if(first1 && first2)
                    if(first1.begin < first2.begin) first = first1;
                    else first = first2;
                else if(first1) first = first1;
                else if(first2) first = first2;
                second = this.getFirst(exp, first.value, first.end);
                exp = this.parseOriExp(exp.substr(0, first.begin)) + exp.substring(first.begin, second.end) + this.parseOriExp(exp.substr(second.end));
            }
            return exp;
        }

        private parseTempExp(exp:string):string
        {
            if(exp == "") return exp;
            var res:ContentResult = this.getContentBetween(exp, "\\$\\{", "\\}");
            if(res)
            {
                // ${}内部是正规的js表达式，所以用常规方式解析，左边直接截取即可，右面递归解析模板方式
                exp = exp.substr(0, res.begin) + this.parseOriExp(res.value) + "}" + this.parseTempExp(exp.substr(res.end + 1));
            }
            return exp;
        }

        public run(scope:Scope):any
        {
            return new Function("$data", "return " + this._exp)(scope);
        }

        /**
         * 将表达式中所有不以$data.开头的变量都加上$data.，以防找不到变量
         * @param exp 字符串表达式
         * @returns {string} 处理后的表达式
         */
        public changeParamNames(exp:string):string
        {
            if(exp == null || exp == "") return exp;
            // 用普通字符串方式处理模板字符串前面的部分，用模板字符串方式处理模板字符串部分，然后递归处理剩余部分
            var res:ContentResult = this.getContentBetween(exp, "`", "`");
            if(res) exp = this.parseOriExp(exp.substr(0, res.begin - 1)) + "`" + this.parseTempExp(res.value) + "`" + this.changeParamNames(exp.substr(res.end + 1));
            else exp = this.parseOriExp(exp);
            return exp;
        }
    }

    interface ContentResult
    {
        begin:number;
        end:number;
        value:string;
    }

    interface KeyValues
    {
        keys:string[];
        values:any[];
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