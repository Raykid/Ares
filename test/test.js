/// <reference path="../dist/ares.d.ts"/>
/// <reference path="../dist/ares_html.d.ts"/>
/// <reference path="../dist/ares_pixi.d.ts"/>
/// <reference path="../dist/ares_template.d.ts"/>
/// <reference path="../src/ares/pixijs/pixi.js.d.ts"/>
/**
 * Created by Raykid on 2016/12/23.
 */
window.onload = function () {
    var renderer = PIXI.autoDetectRenderer(800, 600, { backgroundColor: 0xeeeeee });
    document.getElementById("div_root").appendChild(renderer.view);
    var stage = new PIXI.Container();
    render();
    function render() {
        try {
            // 渲染Stage
            renderer.render(stage);
        }
        catch (err) {
            console.error(err.toString());
        }
        // 计划下一次渲染
        requestAnimationFrame(render);
    }
    var testSkin = new PIXI.Container();
    stage.addChild(testSkin);
    var testSprite = new PIXI.Sprite();
    testSprite.texture = PIXI.Texture.fromImage("http://pic.qiantucdn.com/58pic/14/45/39/57i58PICI2K_1024.png");
    testSprite.width = testSprite.height = 200;
    testSprite.interactive = true;
    testSprite["a-on:click"] = "testFunc";
    testSprite["a-for"] = "item in testFor";
    testSprite["a-x"] = "$target.x + $index * 200";
    testSprite.x = 200;
    testSkin.addChild(testSprite);
    var testText = new PIXI.Text("text: {{text}}, {{item}}");
    testText["a_for"] = "item in testFor";
    testText["a-y"] = "$target.y + $index * 100";
    testText.y = 300;
    testSkin.addChild(testText);
    var data = {
        text: "text",
        testFor: [],
        testFunc: function (evt) {
            this.text = "Fuck!!!";
        }
    };
    ares.bind(data, new ares.pixijs.PIXICompiler(testSkin));
    ares.bind(data, new ares.html.HTMLCompiler("#div_root"));
    ares.bind(data, new ares.template.TemplateCompiler("abc$a-{for: i in 10}'$a-{i}'$a-{end for}def", function (text) {
        console.log(text);
    }));
    setTimeout(function () {
        data.testFor = ["asdf", "ajsdf", 323];
    }, 2000);
};
//# sourceMappingURL=test.js.map