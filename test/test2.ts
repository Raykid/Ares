/// <reference path="../src/ares/Ares.ts"/>
/// <reference path="../src/ares/html/HTMLCompiler.ts"/>

/**
 * Created by Raykid on 2016/12/23.
 */
ares.bind({
    text: "text",
    test: {
        text: "test.text"
    },
    testHTML: "<div>fff</div>",
    testCls: "test1",
    testIf: false,
    testIfText: "if Text",
    testArr: [1, 2, 3, 4],
    testFunc: function(evt)
    {
        var data = this;
        data.text = 'aaaa';
        data.test.text = "asdfasdf";
        data.testHTML = "<h1 a-text='test.text' a-on:click='alert(\"fuck\");'></h1>";
        data.testCls = "test2";
        data.testIfText = "if Text2";
        data.testIf = true;
        data.testIfText = "if Text3";
        data.testArr = ["fuck", "you", "!!!"];
        setTimeout(function(){
            data.testArr.push("TWICE !!!");
        }, 2000);
        setTimeout(function(){
            data.testArr.splice(3, 1, "THIRD TIMES!!!");
        }, 4000);
        setTimeout(function(){
            data.testArr.$set(0, "love");
        }, 6000);
    }
}, new ares.html.HTMLCompiler("div_root"), {
    inited: function()
    {
    }
});