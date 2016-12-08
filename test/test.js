/**
 * Created by Raykid on 2016/12/5.
 */
Ares.create({
    testFunc: testFunc,
    testArg: "fuck"
}, "div_root", {
    initialized: function(vm)
    {
        setTimeout(function(){
            vm.cls = 1;
            vm.clsName = "test1";
            vm.testNum = 5;
        }, 2000);
        setTimeout(function(){
            vm.cls = 2;
            vm.href = "http://www.baidu.com";
        }, 4000);
    }
});


function testFunc()
{
}