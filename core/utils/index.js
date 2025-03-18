function deepMerge(target, source) {
    if (typeof target !== "object" || target === null) return target;
    if (typeof source !== "object" || source === null) return target;

    for (const key of Object.keys(source)) {
        if (source[key] instanceof Array) {
            // 如果是数组，直接替换
            target[key] = source[key].slice();
        } else if (source[key] instanceof Object) {
            // 如果是对象，递归合并
            target[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            // 如果是原始值，直接赋值
            target[key] = source[key];
        }
    }

    return target;
}

function escapeEntity(str) {
    return str.replace(/[&<>"']/g, function (match) {
        switch (match) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#039;";
        }
    });
}

function unescapeEntity(str) {
    var reg =
            /&(?:nbsp|#160|lt|#60|gt|62|amp|#38|quot|#34|cent|#162|pound|#163|yen|#165|euro|#8364|sect|#167|copy|#169|reg|#174|trade|#8482|times|#215|divide|#247);/g,
        entity = {
            "&nbsp;": " ",
            "&#160;": " ",
            "&lt;": "<",
            "&#60;": "<",
            "&gt;": ">",
            "&62;": ">",
            "&amp;": "&",
            "&#38;": "&",
            "&quot;": '"',
            "&#34;": '"',
            "&cent;": "￠",
            "&#162;": "￠",
            "&pound;": "£",
            "&#163;": "£",
            "&yen;": "¥",
            "&#165;": "¥",
            "&euro;": "€",
            "&#8364;": "€",
            "&sect;": "§",
            "&#167;": "§",
            "&copy;": "©",
            "&#169;": "©",
            "&reg;": "®",
            "&#174;": "®",
            "&trade;": "™",
            "&#8482;": "™",
            "&times;": "×",
            "&#215;": "×",
            "&divide;": "÷",
            "&#247;": "÷"
        };
    if (str === null) {
        return "";
    }
    str = str.toString();
    return str.indexOf(";") < 0
        ? str
        : str.replace(reg, function (chars) {
              return entity[chars];
          });
}

module.exports.deepMerge = deepMerge;
module.exports.unescapeEntity = unescapeEntity;
module.exports.escapeEntity = escapeEntity;
