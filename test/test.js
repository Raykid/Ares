var datas = [
    {name: "中兴", level: 2.2,base: 1600, showDetails: false, details: [
        //{plus: 1, time: "2016-10-6", prompt: "fuck"},
        //{minus: 1, time: "2016-10-23"}
    ]},
    {name: "建军", level: 2.2, base: 1220, showDetails: false, details: [
        {minus: 2, time: "2016-11-1", prompt: "阿分提2做题模块逻辑混乱，判断不清，导致从错题精灵结果页回到做题模块再提交会报错，造成了线上问题，所幸并未大规模爆发，按普通事故处理"},
        {minus: 5, time: "2016-12-5", prompt: "阿分提2支付模块对后端返回的数组直接使用了length=4，虽未导致线上问题，但极大增加了项目的不稳定性，若未来阿分提调整了购买列表，数据从4个变为3个或者5个，会立即出现线上事故，故扣分以儆效尤"}
    ]},
    {name: "旭森", level: 1.2, base: 1000, showDetails: false, details: [
        {plus: 3, time: "2016-11-1", prompt: "学习单页面应用等知识"}
    ]},
    {name: "佳丽", level: 1.1, base: 1100, showDetails: false, details: [
        {plus: 2, time: "2016-11-1", prompt: "学习了观察者模式"},
        {plus: 2, time: "2016-11-1", prompt: "学习了策略模式"}
    ]},
    {name: "江帆", level: 1.1, base: 1200, showDetails: false, details: [
    ]},
    {name: "施志豪", level: 2.2, base: 0, showDetails: false, details: [
    ]}
];
var vm = {
    datas: datas,
    coeDict: {
        1.1: {level: 1.1, plus: 2.0, minus: 0.2},
        1.2: {level: 1.2, plus: 1.5, minus: 0.5},
        2.1: {level: 2.1, plus: 1.0, minus: 1.0},
        2.2: {level: 2.2, plus: 0.8, minus: 1.2},
        2.3: {level: 2.3, plus: 0.5, minus: 1.5},
        3.1: {level: 3.1, plus: 0.2, minus: 2.0},
    },
    plusList: [
        {change: 20, prompt: "学习1个新算法"},
        {change: 40, prompt: "学习1个新设计模式"},
        {change: 30, prompt: "探索现有框架"},
        {change: 50, prompt: "对某个技术领域或者技术的坑整理成WIKI文档"},
        {change: 100, prompt: "进行全组范围技术分享"},
        {change: 100, prompt: "开技术分享会（至少30分钟、3名听众）"},
        {change: 150, prompt: "应用最优算法解决了工作中的实际问题"},
        {change: 300, prompt: "在工作中应用了合适的设计模式让程序更优雅"},
        {change: 200, prompt: "为现有工作流程提出建设性意见并被采纳"}
    ],
    minusList: [
        {change: -300, prompt: "因个人原因造成线上严重事故"},
        {change: -100, prompt: "因个人原因造成线上事故"},
        {change: -200, prompt: "不负责任的说法与做法"},
        {change: -50, prompt: "拒绝进步"},
        {change: -50, prompt: "所写代码质量严重低于所属技术职级"},
        {change: -20, prompt: "不参与集体活动"}
    ],
    getScore: function(data)
    {
        var score = data.base;
        for(var i in data.details)
        {
            var detail = data.details[i];
            var change = vm.getChange(detail);
            var changeScore = vm.getChangeScore(data.level, change.change);
            score += changeScore;
        }
        return score;
    },
    getChange: function(detail)
    {
        if(detail.plus != null)
        {
            return vm.plusList[detail.plus - 1];
        }
        else
        {
            return vm.minusList[detail.minus - 1];
        }
    },
    getChangeScore: function(level, change)
    {
        return change * vm.getChangeCoe(level, change);
    },
    getChangeCoe: function(level, change)
    {
        var coeData = vm.coeDict[level];
        return (change > 0 ? coeData.plus : coeData.minus);
    }
};
datas.sort(function(a, b)
{
    return vm.getScore(b) - vm.getScore(a);
});
Ares.create(vm, "div_main");