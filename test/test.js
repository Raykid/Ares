/**
 * Created by Raykid on 2016/12/5.
 */
Ares.create({
    cls: null
}, "div_root", {
    initialized: function(vm)
    {
        setTimeout(function(){
            vm.cls = "test";
        }, 2000);
    }
});