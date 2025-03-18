const dom = require("./xmldom/index.js").DOMParser;
const parse5 = require("./parse5.min.js");

module.exports = function (html) {
    const doc = parse5.parseFragment(html);
    const normalizeHtml = parse5.serialize(doc);
    const document = new dom().parseFromString(normalizeHtml, "text/html");
    return {
        document,
        html: normalizeHtml
    };
};
