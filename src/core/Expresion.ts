/**
 * Created by Raykid on 2016/12/6.
 */
namespace core
{
    export class Expresion
    {
        private _exp:string;
        private _names:string[];

        public get names():string[]
        {
            return this._names;
        }

        public constructor(exp:string)
        {
            var res:NameResult = Expresion.changeParamNames(exp);
            this._exp = res.exp;
            this._names = res.names;
        }

        public run(scope:Scope):any
        {
            return new Function("$data", "return " + this._exp)(scope);
        }

        private static parseOriExp(exp:string):NameResult
        {
            var names:string[] = [];
            if(exp == "") return {exp: exp, names: names};
            // 分别将""和''找出来，然后将其两边的字符串递归处理，最后再用正则表达式匹配
            var first1:ContentResult = Expresion.getFirst(exp, "'");
            var first2:ContentResult = Expresion.getFirst(exp, '"');
            var first:ContentResult, second:ContentResult;
            if(!first1 && !first2)
            {
                // 啥都没有，使用正则表达式匹配
                exp = exp.replace(/[a-z\.\$][\w\.\$]*/ig, (str:string, index:number, exp:string)=>{
                    if(str.indexOf("$data.") != 0)
                    {
                        // 如果str和冒号:之间都是空白字符或者没有字符，则不替换$data
                        var end:number = index + str.length;
                        var i:number = exp.indexOf(":", end);
                        if(i > index)
                        {
                            var temp:string = exp.substring(end, i);
                            if(/^\s*$/.test(temp)) return str;
                        }
                        // 如果是true或false则不进行替换
                        if(str == "true" || str == "false") return str;
                        // 如果是$data本身则不进行替换
                        if(str == "$data") return str;
                        // 如果window下存在这个变量，则不进行替换
                        var iDot:number = str.indexOf(".");
                        if(iDot < 0) iDot = str.length;
                        var argName:string = str.substr(0, iDot);
                        if(window[argName]) return str;
                        // 否则记录名字并添加$data前缀
                        names.push(str);
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
                second = Expresion.getFirst(exp, first.value, first.end);
                var part1:NameResult = Expresion.parseOriExp(exp.substr(0, first.begin));
                var part2:string = exp.substring(first.begin, second.end);
                var part3:NameResult = Expresion.parseOriExp(exp.substr(second.end));
                exp = part1.exp + part2 + part3.exp;
                // 记录名字
                names.push.apply(names, part1.names);
                names.push.apply(names, part3.names);
            }
            return {exp: exp, names: names};
        }

        private static parseTempExp(exp:string):NameResult
        {
            var names:string[] = [];
            if(exp == "") return {exp: exp, names: names};
            var res:ContentResult = Expresion.getContentBetween(exp, "\\$\\{", "\\}");
            if(res)
            {
                // ${}内部是正规的js表达式，所以用常规方式解析，左边直接截取即可，右面递归解析模板方式
                var part1:string = exp.substr(0, res.begin);
                var part2:NameResult = Expresion.parseOriExp(res.value);
                var part3:NameResult = Expresion.parseTempExp(exp.substr(res.end + 1));
                exp = part1 + part2.exp + "}" + part3.exp;
                // 记录名字
                names.push.apply(names, part2.names);
                names.push.apply(names, part3.names);
            }
            return {exp: exp, names: names};
        }

        /**
         * 获取第一个出现的指定标识的数据
         * @param exp 原始表达式
         * @param flag 指定标识
         * @param from 起始索引
         * @returns {ContentResult} 在exp中首次出现flag的数据
         */
        public static getFirst(exp:string, flag:string, from:number=0):ContentResult
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
        public static getContentBetween(exp:string, begin:string, end:string):ContentResult
        {
            var bRes:ContentResult = Expresion.getFirst(exp, begin);
            if(!bRes) return null;
            var eRes:ContentResult = Expresion.getFirst(exp, end, bRes.end);
            if(!eRes) return null;
            return {
                begin: bRes.end,
                end: eRes.begin,
                value: exp.substring(bRes.end, eRes.begin)
            };
        }

        /**
         * 将表达式中所有不以$data.开头的变量都加上$data.，以防找不到变量
         * @param exp 字符串表达式
         * @returns {string} 处理后的表达式
         */
        public static changeParamNames(exp:string):NameResult
        {
            var names:string[] = [];
            if(exp == null || exp == "") return {exp: exp, names: names};
            // 用普通字符串方式处理模板字符串前面的部分，用模板字符串方式处理模板字符串部分，然后递归处理剩余部分
            var res:ContentResult = Expresion.getContentBetween(exp, "`", "`");
            if(res)
            {
                var part1:NameResult = Expresion.parseOriExp(exp.substr(0, res.begin - 1));
                var part2:NameResult = Expresion.parseTempExp(res.value);
                var part3:NameResult = Expresion.changeParamNames(exp.substr(res.end + 1));
                exp = part1.exp + "`" + part2.exp + "`" + part3.exp;
                // 记录名字
                names.push.apply(names, part1.names);
                names.push.apply(names, part2.names);
                names.push.apply(names, part3.names);
            }
            else
            {
                var temp:NameResult = Expresion.parseOriExp(exp);
                exp = temp.exp;
                // 记录名字
                names.push.apply(names, temp.names);
            }
            // 为names去重
            var tempMap:any = {};
            names = names.filter((name:string)=>{
                if(!tempMap[name])
                {
                    tempMap[name] = true;
                    return true;
                }
                return false;
            }, this);
            return {exp: exp, names: names};
        }
    }

    export interface ContentResult
    {
        begin:number;
        end:number;
        value:string;
    }

    export interface NameResult
    {
        exp:string;
        names:string[];
    }

    export interface Scope
    {
        $original:any;
        $data:Scope;
        $parent:Scope;
        $root:Scope;
        $path:string;
        [key:string]:any;
    }
}