# Ares是什么？
Ares是使用TypeScript写就的一个MVVM框架，可以应用于各种V层，包括但不限于HTML+CSS、Pixi.js、模板替换等。支持TypeScript和JavaScript。

# Ares的结构
#### Ares是由多个库共同组成的一个完整的MVVM框架，其组成结构包含如下
* Ares本体：将传统的MVVM框架（如Vue.js、Knockout）中的M层和VM层抽象出来形成的一个独立的库，V层仅提供接口，并不提供任何实现，因此可以将Ares本体与任何Ares的V层实现搭配甚至混合使用以达到操作多种V层实现的目的；
* Ares V层实现
    * Ares-HTML（DOM）：使用Ares本体加Ares-HTML即相当于Vue.js；
    * Ares-PixiJS：使用Ares本体加Ares-PixiJS即可在基于Pixi.js渲染引擎的项目中使用MVVM操作Pixi.js界面；
    * Ares-Template：使用Ares本体加Ares-Template即可实现字符串替换功能，利用Ares的首次渲染对带有命令和参数的字符串进行替换，生成结果字符串
* 结构示意图

```
graph LR
Ares本体-->+
+-->Ares-HTML
Ares-HTML-->类似Vue.js和Knockout的面向HTML+CSS的MVVM框架
+-->Ares-PixiJS
Ares-PixiJS-->面向Pixi.js引擎的MVVM框架
+-->Ares-Template
Ares-Template-->字符串模板替换工具
+-->其他V层实现库
其他V层实现库-->其他MVVM框架

```

# Ares支持的模块标准
#### Ares的模块采用UMD标准。

# Ares的打包
#### Ares使用Webpack打包，并提供了可在Node.js环境下运行的BAT和Shell打包脚本。

# Ares的输出文件
* Ares本体
    * ares.js
    * ares.js.map
    * ares.min.js
    * ares.d.ts
* Ares-HTML
    * ares_html.js
    * ares_html.js.map
    * ares_html.min.js
    * ares_html.d.ts
* Ares-PixiJS
    * ares_pixijs.js
    * ares_pixijs.js.map
    * ares_pixijs.min.js
    * ares_pixijs.d.ts
* Ares-Template
    * ares_template.js
    * ares_template.js.map
    * ares_template.min.js
    * ares_template.d.ts