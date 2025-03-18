const config = require("./config.json");

globalThis.config = config;

if (config.ext && config.play_function) {
    globalThis.ext = require(config.ext);
}

module.exports = require("../core/index.js");
