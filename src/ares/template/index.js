define(["require", "exports", "./TemplateCompiler", "./TemplateCommands"], function (require, exports, Compiler, Commands) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Created by Raykid on 2017/4/27.
     */
    function mix(to, from) {
        for (var key in from) {
            to[key] = from[key];
        }
    }
    exports.ares = window["ares"] || {};
    var template = exports.ares.template = exports.ares.template || {};
    mix(template, Compiler);
    mix(template, Commands);
    window["ares"] = exports.ares;
});
//# sourceMappingURL=index.js.map