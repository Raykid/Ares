/**
 * Created by Raykid on 2016/12/5.
 */
Ares.create({
    testFunc: testFunc,
    testArg: "fuck",
    testCls: "test1"
}, "div_root", {
    initialized: function(vm)
    {
        setTimeout(function(){
            vm.testCls = "test2";
        }, 2000);
        setTimeout(function(){
        }, 4000);
    }
});


function testFunc()
{
}