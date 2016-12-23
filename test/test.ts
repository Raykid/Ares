/// <reference path="../src/ares/Ares.ts"/>
/// <reference path="../src/ares/html/HTMLCompiler.ts"/>

/**
 * Created by Raykid on 2016/12/16.
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
    testFunc: function(evt:Event):void
    {
        this.text = 'aaaa';
        this.test.text = "asdfasdf";
        this.testHTML = "<h1 a-text='test.text' a-on:click='alert(\"fuck\");'></h1>";
        this.testCls = "test2";
        this.testIfText = "if Text2";
        this.testIf = true;
        this.testIfText = "if Text3";
        this.testArr = ["fuck", "you", "!!!"];
        setTimeout(()=>{
            this.testArr.push("TWICE !!!");
        }, 2000);
        setTimeout(()=>{
            this.testArr.splice(3, 1, "THIRD TIMES!!!");
        }, 4000);
        setTimeout(()=>{
            this.testArr.$set(0, "love");
        }, 6000);
    }
}, new ares.html.HTMLCompiler("div_root"), {
    inited: function():void
    {
    }
});