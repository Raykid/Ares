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
    stage.addChild(testSkin);

    var testText:PIXI.Text = new PIXI.Text("text: {{text}}");
    testText.name = "txt_test";
    testText["a_prop"] = "{x: x}";
    testText["a_y"] = "y";
    testSkin.addChild(testText);

    ares.bind({
        text: "text",
        x: 0,
        y: 0,
        scaleX: 1
    }, new ares.pixijs.PIXICompiler(testSkin, {
        txt_test: {scaleX: "scaleX"}
    }), {
        inited: function()
        {
            setTimeout(()=>{
                this.text = "Fuck!!!";
                this.x = 100;
                this.y = 200;
                this.scaleX = 2;
            }, 1000);
        }
    });
};
