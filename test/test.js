/**
 * Created by Raykid on 2016/12/5.
 */
Ares.create({
    cls: null,
    clsName: null,
    href: "javascript:void"
}, "div_root", {
    initialized: function(vm)
    {
        setTimeout(function(){
            vm.cls = 1;
            vm.clsName = "test1";
        }, 2000);
        setTimeout(function(){
            vm.cls = 2;
            vm.href = "http://www.baidu.com";
        }, 4000);
    }
});