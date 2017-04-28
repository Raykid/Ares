"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Ares = require("./Ares");
var Dep = require("./Dep");
var Interfaces = require("./Interfaces");
var Mutator = require("./Mutator");
var Utils = require("./Utils");
var Watcher = require("./Watcher");
/**
 * Created by Raykid on 2017/4/27.
 */
var ares;
(function (ares_1) {
    function mix(to, from) {
        for (var key in from) {
            to[key] = from[key];
        }
    }
    ares_1.ares = window["ares"] || {};
    mix(ares_1.ares, Ares);
    mix(ares_1.ares, Dep);
    mix(ares_1.ares, Interfaces);
    mix(ares_1.ares, Mutator);
    mix(ares_1.ares, Utils);
    mix(ares_1.ares, Watcher);
    window["ares"] = ares_1.ares;
})(ares = exports.ares || (exports.ares = {}));
//# sourceMappingURL=index.js.map