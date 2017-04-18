/// <reference path="../dist/ares.d.ts"/>
/// <reference path="../dist/ares_html.d.ts"/>
/// <reference path="../dist/ares_pixi.d.ts"/>
/// <reference path="../dist/ares_template.d.ts"/>
/// <reference path="../src/ares/pixijs/pixi.js.d.ts"/>

/**
 * Created by Raykid on 2016/12/23.
 */
window.onload = ()=>
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
        testSprite["a-for"] = "item in testFor";
        testSprite["a-x"] = "$target.x + $index * 200";
        testSprite.x = 200;
        testSkin.addChild(testSprite);

        var testText:PIXI.Text = new PIXI.Text("text: {{text}}，{{item}}");
        testText["a-tplName"] = "testTpl";
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
            testFor: [1, 2, 3],
            testFunc: function(evt:Event):void
            {
                this.text = "Fuck!!!";
            }
        };

        ares.bind(data, new ares.pixijs.PIXICompiler(testSkin));

        ares.bind(data, new ares.html.HTMLCompiler("#div_root"));

        ares.bind(data, new ares.template.TemplateCompiler("abc$a-{for: i in 10}'$a-{i}'$a-{end for}def", (text:string)=>{
            console.log(text);
        }))

        setTimeout(()=>{
            data.testFor = [3, "jasdf"];
        }, 2000);

        setTimeout(()=>{
            data.testFor = ["kn", "j111", "14171a"];
        }, 4000);
    });
};