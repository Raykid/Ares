/**
 * Created by Raykid on 2016/12/5.
 */
Ares.create({
    test: "<h1>fuck</h1>",
    testList: [{abc: 1},{abc: 2},{abc: 3}]
}, "div_root", {
    initialized: function(vm)
    {
        setTimeout(function(){
            vm.testList.push({abc: -1});
            vm.testList.push({abc: -0});
            vm.testList.push({abc: -6.1});
            vm.testList.push({abc: 11.2});
        }, 2000);
        setTimeout(function(){
            vm.testList.sort(function(a, b){
                return b.abc - a.abc;
            });


            vm.test = "<h1>fuck 有！！！</h1>";
        }, 4000);
    }
});



alert(new Function("a", "b", "return a + b")(3, 5));