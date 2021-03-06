/// <reference path="../src/ares/pixijs/pixi.js.d.ts"/>
// / <reference path="../dist/ares.d.ts"/>
// / <reference path="../dist/ares_html.d.ts"/>
// / <reference path="../dist/ares_pixijs.d.ts"/>
// / <reference path="../dist/ares_template.d.ts"/>

import * as ares from "../src/ares/Ares";
import * as ares_html from "../src/ares/html/HTMLCompiler";
import * as ares_pixijs from "../src/ares/pixijs/PIXICompiler";
import * as ares_template from "../src/ares/template/TemplateCompiler";

/**
 * Created by Raykid on 2016/12/23.
 */
if(document.body)
{
    go();
}
else
{
    window.onload = go;
}


function go():void
{
    var renderer:PIXI.SystemRenderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor:0xeeeeee});
    document.getElementById("div_root").appendChild(renderer.view);
    var stage:PIXI.Container = new PIXI.Container();
    render();

    function render():void
    {
        try
        {
            // 渲染Stage
            renderer.render(stage);
        }
        catch(err)
        {
            console.error(err.toString());
        }
        // 计划下一次渲染
        requestAnimationFrame(render);
    }

    PIXI.loader.add("test.png");
    PIXI.loader.load(()=>{
        var testSkin:PIXI.Container = new PIXI.Container();
        stage.addChild(testSkin);

        var testContainer:PIXI.Container = new PIXI.Container();
        testContainer.y = 100;
        testSkin.addChild(testContainer);

        var testSprite:PIXI.Sprite = new PIXI.Sprite();
        testSprite.texture = PIXI.Texture.fromImage("test.png");
        testSprite.width = testSprite.height = 200;
        testSprite.interactive = true;
        testSprite["a-on:click"] = "testFunc";
        testSprite["a-for${page:3}"] = "item in testFor";
        testSprite["a-y"] = "$target.y + $index * 200";
        testSprite["a-viewport"] = "$target.x, $target.y, $target.width - 100, $target.height * 2";
        testSprite.x = 200;
        testContainer.addChild(testSprite);

        var testText:PIXI.Text = new PIXI.Text("text: {{text}}");
        testText["a-tplName"] = "testTpl";
        testText["a-tplGlobal"] = "true";
        testText.y = 300;
        testSkin.addChild(testText);

        var testTpl:PIXI.Sprite = new PIXI.Sprite();
        testTpl["a-tpl"] = "testTpl";
        testTpl["a-for"] = "item in testFor";
        testTpl["a-x"] = "$index * 200";
        testTpl["a_y"] = "$target.y + $index * 100";
        testSkin.addChild(testTpl);

        var data:any = {
            text: "text",
            testNum: 1,
            testFor: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
            testFunc: function(evt:Event):void
            {
                this.text = "Fuck!!!";
            }
        };

        ares.bind(data, new ares_pixijs.PIXICompiler(testSkin, renderer));

        ares.bind(data, new ares_html.HTMLCompiler("#div_root"));

        ares.bind(data, new ares_template.TemplateCompiler("abc$a-{for: i in 10}'$a-{i}'$a-{end for}def", (text:string)=>{
            console.log(text);
        }));

        var testSkin2:PIXI.Container = new PIXI.Container();
        testSkin2["a-tpl"] = "testTpl";
        testSkin2["a-y"] = 100;
        stage.addChild(testSkin2);
        ares.bind(data, new ares_pixijs.PIXICompiler(testSkin2, renderer));

        // setTimeout(()=>{
        //     data.testFor = [3, "jasdf"];
        // }, 2000);

        // setTimeout(()=>{
        //     data.testFor = ["kn", "j111", "14171a"];
        // }, 4000);
    });
}