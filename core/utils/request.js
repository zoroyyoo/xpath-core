/**
 * @description 封装fetch
 */
const { deepMerge } = require("./index.js");

const DefaultUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";

function headersToLowerCase(params) {
    const result = {};
    Object.keys(params).forEach(key => {
        let name = String(key).toLowerCase();
        const skipNames = ["X-Timeout", "X-DNS", "X-Proxy"];
        for (let i = 0; i < skipNames.length; i++) {
            const skipName = skipNames[i];
            if (name === skipName.toLowerCase()) {
                name = skipName;
                break;
            }
        }
        result[name] = params[key];
    });
    return result;
}

async function http(url, options = {}) {
    const commonHeaders = {
        "X-Timeout": 20000,
        "user-agent": DefaultUserAgent,
        "accept-language": "zh-CN,zh;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=0, i",
        "upgrade-insecure-requests": "1"
    };

    if (typeof agcplayer !== "undefined") {
        if (agcplayer?.dns && typeof agcplayer?.dns === "string") {
            const dns = agcplayer.dns.trim();
            commonHeaders["X-DNS"] = dns;
        }
        if (
            agcplayer?.device?.proxy &&
            typeof agcplayer?.device?.proxy === "string"
        ) {
            const proxy = agcplayer.device.proxy.trim();
            commonHeaders["X-Proxy"] = proxy;
        }
    }

    const defaultOptions = {
        headers: headersToLowerCase(commonHeaders)
    };

    let finalUrl = url;
    if (
        options?.params &&
        toString.call(options?.params) === "[object Object]"
    ) {
        finalUrl = setParams(url, {
            ...options.params
        });

        delete options.params;
    }
    if (
        options?.headers &&
        toString.call(options?.headers) === "[object Object]"
    ) {
        options.headers = headersToLowerCase(options.headers);
    }
    const headers = deepMerge(defaultOptions, options);
    const response = await fetch(finalUrl, headers);
    console.log(
        "=====",
        options.method ?? "GET",
        finalUrl,
        response.status,
        headers
    );
    if (response.status < 200 || response.status > 299) {
        const raw = await response.text();
        console.log("========== RAW RESPONSE TEXT ==========\n");
        console.log(raw);
        console.log("\n====================================\n");
        throw new Error(`Response Error: ${response?.status}`);
    }
    return response;
}

function setParams(url, params = {}) {
    // 解析 URL 参数
    const urlObj = new URL(url);
    const queryParams = urlObj.searchParams;

    // 添加 字段
    for (const [key, value] of Object.entries(params)) {
        queryParams.append(key, value);
    }
    return urlObj.toString();
}

function success(data) {
    return {
        code: 0,
        data
    };
}

function error(msg, code = -1) {
    return {
        code,
        msg
    };
}

module.exports.success = success;
module.exports.error = error;
module.exports.request = http;
