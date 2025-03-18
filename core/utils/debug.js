// 正式环境没有process对象
const isDev = typeof process !== "undefined";

function writeFileSync(filename, data) {
    try {
        if (isDev) {
            const fs = require("fs");
            const path = require("path");
            const dir = path.resolve("./.caches");
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const saveData =
                typeof data === "object" ? JSON.stringify(data, null, 4) : data;
            fs.writeFileSync(path.resolve(dir, `${filename}`), saveData);
        }
    } catch (e) {
        console.error(e);
    }
}

function readFileSync(filename, options = { encoding: "utf-8" }) {
    try {
        if (isDev) {
            const fs = require("fs");
            const path = require("path");
            const dir = path.resolve("./.caches");

            return fs.readFileSync(path.resolve(dir, `${filename}`), options);
        }
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    writeFileSync,
    readFileSync,
    isDev
};
