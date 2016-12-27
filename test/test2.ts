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

    var testText:PIXI.Text = new PIXI.Text();
    testText.name = "txt_test";
    testText["a_text"] = "text";
    testSkin.addChild(testText);

    ares.bind({
        text: "text"
    }, new ares.pixijs.PIXICompiler(testSkin), {
        inited: function()
        {
            setTimeout(()=>{
                this.text = "Fuck!!!";
            }, 1000);
        }
    });
};
