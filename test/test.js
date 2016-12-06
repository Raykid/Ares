/**
 * Created by Raykid on 2016/12/5.
 */
Ares.create({
    test: "测试数据",
    testVisible: false,
    testRecursion: {
        fuck: 1,
        testRecFunc: function(y){return y+y;}
    },
    testFunction: function(x){return x*x;},
    testList: [{abc: 1},{abc: 2},{abc: 3}]
}, "div_root", {
    initialized: function(vm)
    {
    }
});