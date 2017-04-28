define(["require", "exports", "./PIXICompiler", "./PIXICommands"], function (require, exports, Compiler, Commands) {
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
    var pixijs = exports.ares.pixijs = exports.ares.pixijs || {};
    mix(pixijs, Compiler);
    mix(pixijs, Commands);
    window["ares"] = exports.ares;
});
//# sourceMappingURL=index.js.map