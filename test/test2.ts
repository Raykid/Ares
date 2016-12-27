/// <reference path="../src/ares/Ares.ts"/>
/// <reference path="../src/ares/pixijs/PIXICompiler.ts"/>

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



    var testSkin:PIXI.Container = new PIXI.Container();
    testSkin.name = "testSkin";
    stage.addChild(testSkin);

    var testSprite:PIXI.Sprite = new PIXI.Sprite();
    testSprite.name = "testSprite";
    testSprite.texture = PIXI.Texture.fromImage("http://pic.qiantucdn.com/58pic/14/45/39/57i58PICI2K_1024.png");
    testSprite.width = testSprite.height = 200;
    testSprite.interactive = true;
    testSprite["a_on$click"] = "testFunc";
    testSprite["a_for"] = "i in testFor";
    testSkin.addChild(testSprite);

    var testText:PIXI.Text = new PIXI.Text("text: {{text}}");
    testText.name = "txt_test";
    testText["a_prop"] = "{x: x}";
    testText["a_y"] = "y";
    testSkin.addChild(testText);

    ares.bind({
        text: "text",
        x: 0,
        y: 0,
        scaleX: 1,
        testIf: false,
        testFor: [],
        testFunc: function(evt:Event):void
        {
            this.text = "Fuck!!!";
            this.x = 100;
            this.y = 200;
            this.scaleX = 2;
        }
    }, new ares.pixijs.PIXICompiler(testSkin, {
        txt_test: {scaleX: "scaleX"}
    }), {
        inited: function()
        {
            setTimeout(()=>{
                this.testIf = true;
                this.testFor = [1, 2, 3];
            }, 2000);
        }
    });
};