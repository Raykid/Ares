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
    }
});


function testFunc()
{
    this.testCls = "test2";
}