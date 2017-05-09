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

    PIXI.loader.add("http://pic.qiantucdn.com/58pic/14/45/39/57i58PICI2K_1024.png");
    PIXI.loader.load(()=>{
        var testSkin:PIXI.Container = new PIXI.Container();
        stage.addChild(testSkin);

        var testSprite:PIXI.Sprite = new PIXI.Sprite();
        testSprite.texture = PIXI.Texture.fromImage("http://pic.qiantucdn.com/58pic/14/45/39/57i58PICI2K_1024.png");
        testSprite.width = testSprite.height = 200;
        testSprite.interactive = true;
        testSprite["a-on:click"] = "testFunc";
        testSprite["a-for"] = "item in 10";
        testSprite["a-y"] = "$target.y + $index * 200";
        testSprite["a-viewport"] = "200, 0, 200, 600";
        testSprite.x = 200;
        testSkin.addChild(testSprite);

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
            testFor: [1, 2, 3],
            testFunc: function(evt:Event):void
            {
                this.text = "Fuck!!!";
            }
        };

        ares.bind(data, new ares_pixijs.PIXICompiler(testSkin));

        ares.bind(data, new ares_html.HTMLCompiler("#div_root"));

        ares.bind(data, new ares_template.TemplateCompiler("abc$a-{for: i in 10}'$a-{i}'$a-{end for}def", (text:string)=>{
            console.log(text);
        }));

        var testSkin2:PIXI.Container = new PIXI.Container();
        testSkin2["a-tpl"] = "testTpl";
        testSkin2["a-y"] = 100;
        stage.addChild(testSkin2);
        ares.bind(data, new ares_pixijs.PIXICompiler(testSkin2));

        // setTimeout(()=>{
        //     data.testFor = [3, "jasdf"];
        // }, 2000);

        // setTimeout(()=>{
        //     data.testFor = ["kn", "j111", "14171a"];
        // }, 4000);
    });
}