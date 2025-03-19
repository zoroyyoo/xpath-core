const { deepMerge, unescapeEntity } = require("./utils/index.js");
const { request: http, success, error } = require("./utils/request.js");
const xpath = require("./utils/xpath.js");
const DOMParser = require("./utils/dom.js");
const CryptoJS = require("./utils/crypto-js/index.js");
// const { writeFileSync, readFileSync } = require("./utils/debug.js");

const direction = {
    horizontal: "horizontal",
    vertical: "vertical"
};

function request(url, options) {
    const ua = globalThis.config?.ua?.trim();

    const defaultOptions = {
        headers: {}
    };
    if (ua) {
        defaultOptions.headers["user-agent"] = ua;
    }

    return http(url, deepMerge(defaultOptions, options));
}

// 替换模版变量
// {base_url}
async function matchTemplateVar() {
    if (!globalThis.base_url) {
        let base_url;
        // 全局替换base_url
        if (globalThis.config.base_url && globalThis.config.base_url.trim()) {
            base_url = globalThis.config.base_url.trim();
        } else if (globalThis.config.base_url_function) {
            // 如果是自定义坚持规则
            base_url =
                await globalThis.ext[globalThis.config.base_url_function]();
        }
        if (base_url) {
            globalThis.config = JSON.parse(
                JSON.stringify(globalThis.config).replace(
                    /\{base_url\}/g,
                    base_url
                )
            );

            globalThis.base_url = base_url;
        }
    }
}

/**
 * 解析xpath字段并匹配对应的regexp规则
 * @param {*} dom
 * @param {*} field
 * @returns
 */
function parseXpathText(dom, field) {
    let text = "";
    try {
        if (!globalThis.config[field]) return "";

        const node = xpath(dom, globalThis.config[field]);
        text = node.map(item => item.nodeValue?.trim()).join(",");
        if (globalThis.config[`${field}_regexp`]) {
            const matchVal = text.match(
                new RegExp(globalThis.config[`${field}_regexp`])
            );
            if (matchVal) {
                text = matchVal[1];
            } else {
                text = "";
            }
        }
        return text;
    } catch (e) {
        console.error(e);
    }
    return text;
}

// 获取配置的分类名字，如果未配置，则返回采集的名字
function getCateName(type_id, raw_name) {
    if (globalThis.config.home_cate_manual) {
        if (globalThis.config.home_cate_manual?.[type_id]?.name?.trim()) {
            return globalThis.config.home_cate_manual[type_id].name;
        }
    }
    return raw_name;
}

globalThis.DOMParser = DOMParser;
globalThis.xpath = xpath;
globalThis.$fetch = request;
globalThis.parseXpathText = parseXpathText;
globalThis.CryptoJS = CryptoJS;

async function home() {
    try {
        await matchTemplateVar();
        if (globalThis.ext && globalThis.config.home_function) {
            const result =
                await globalThis.ext[globalThis.config.home_function]();
            return success(result);
        }
        const response = await request(globalThis.config.home_url);

        const html = await response.text();
        // const html = readFileSync("home.html");
        const { document, html: normalizeHtml } = DOMParser(html);
        // writeFileSync("home.html", normalizeHtml);

        const $sections = xpath(document, globalThis.config.home_cate_node);
        const result = [];

        $sections.forEach(($row, i) => {
            const type_id = parseXpathText($row, "home_cate_id");
            let type_name = parseXpathText($row, "home_cate_name");
            if (type_id) {
                type_name = getCateName(type_id, type_name);
            }

            const vod_list = [];

            const $items = xpath(
                $row,
                globalThis.config.home_vod_node.replace(/{index}/g, i + 1)
            );
            $items.forEach($item => {
                const vod_id = parseXpathText($item, "home_vod_id");
                const vod_name = parseXpathText($item, "home_vod_name");
                const vod_pic = parseXpathText($item, "home_vod_pic");

                const vod_remarks = parseXpathText($item, "home_vod_remarks");
                const vod_preview = parseXpathText($item, "home_vod_preview");

                if (vod_id) {
                    vod_list.push({
                        type_id,
                        vod_id,
                        vod_name,
                        vod_pic,
                        vod_remarks,
                        vod_preview,
                        direction:
                            globalThis.config?.home_vod_direction ||
                            direction.vertical
                    });
                }
            });
            if (vod_list.length) {
                result.push({
                    type_id,
                    type_name,
                    vod_list
                });
            }
        });
        return success(result);
    } catch (e) {
        console.error(e);
        return error(e.message);
    }
}

async function detail(params) {
    try {
        await matchTemplateVar();
        const { vod_id } = params;
        if (globalThis.ext && globalThis.config.detail_function) {
            const result =
                await globalThis.ext[globalThis.config.detail_function](params);
            return success(result);
        }
        const url = globalThis.config.detail_url.replace(/{vod_id}/g, vod_id);

        const response = await request(url);
        const html = await response.text();
        // const html = readFileSync("detail.html");
        const { document, html: normalizeHtml } = DOMParser(html);
        // writeFileSync("detail.html", normalizeHtml);

        const vod_actor = parseXpathText(document, "detail_vod_actor");
        const vod_area = parseXpathText(document, "detail_vod_area");
        const vod_class = parseXpathText(document, "detail_vod_class");
        const vod_lang = parseXpathText(document, "detail_vod_lang");
        const vod_time = parseXpathText(document, "detail_vod_time");
        const vod_year = parseXpathText(document, "detail_vod_year");
        const vod_remarks = parseXpathText(document, "detail_vod_remarks");

        const vod_content = parseXpathText(document, "detail_vod_content");

        const vod_name = parseXpathText(document, "detail_vod_name");
        const vod_pic = parseXpathText(document, "detail_vod_pic");

        const vod_sources = [];

        const $sources = xpath(document, globalThis.config.detail_source_node);
        for (let i = 0, len = $sources.length; i < len; i++) {
            const $source = $sources[i];

            const source_name = parseXpathText($source, "detail_source_name");

            if (source_name) {
                const source = {
                    source_name: source_name,
                    vod_play_list: {
                        url_count: 0,
                        urls: []
                    }
                };
                const $links = xpath(
                    $source,
                    globalThis.config.detail_url_node.replace(/{index}/g, i + 1)
                );
                source.vod_play_list.url_count = $links.length;
                $links.forEach($link => {
                    const url = {
                        name: parseXpathText($link, "detail_url_name"),
                        url: parseXpathText($link, "detail_url_id")
                    };
                    source.vod_play_list.urls.push(url);
                });
                $links.length && vod_sources.push(source);
            }
        }

        const result = {
            vod_actor,
            vod_area,
            vod_class,
            vod_content,
            vod_id,
            vod_lang,
            vod_name,
            vod_pic,
            vod_time,
            vod_year,
            vod_remarks,
            vod_sources,
            similar: similar(document)
        };
        return success(result);
    } catch (e) {
        console.error(e);
        return error(e.message);
    }
}

async function list(type_id, page = 1) {
    try {
        await matchTemplateVar();
        if (globalThis.ext && globalThis.config.list_function) {
            const result = await globalThis.ext[
                globalThis.config.list_function
            ](type_id, page);
            return success(result);
        }
        let url = globalThis.config.list_url;
        // 是否有配置规则
        // 如果有配置规则的话，替换掉list_url
        if (globalThis.config.home_cate_manual) {
            if (globalThis.config.home_cate_manual?.[type_id]?.url) {
                url = globalThis.config.home_cate_manual[type_id].url;
            } else if (globalThis.config.home_cate_manual?.["*"]?.url) {
                url = globalThis.config.home_cate_manual["*"].url;
            }
        }
        const fetchUrl = url
            .replace(/{type_id}/g, type_id)
            .replace(/{page}/g, page);

        const response = await request(fetchUrl);
        const html = await response.text();
        // const html = readFileSync("list.html");
        const { document, html: normalizeHtml } = DOMParser(html);
        // writeFileSync("list.html", normalizeHtml);

        const list = [];
        const $sections = xpath(document, globalThis.config.list_vod_node);
        $sections.forEach($row => {
            const vod_name = parseXpathText($row, "list_vod_name");
            const vod_remarks = parseXpathText($row, "list_vod_remarks");
            const vod_pic = parseXpathText($row, "list_vod_pic");
            const vod_id = parseXpathText($row, "list_vod_id");
            const vod_preview = parseXpathText($row, "list_vod_preview");
            if (vod_id) {
                list.push({
                    vod_id,
                    vod_name,
                    vod_pic,
                    vod_remarks,
                    vod_preview,
                    direction:
                        globalThis.config?.list_vod_direction ||
                        direction.vertical
                });
            }
        });

        let pages = 1;
        if (globalThis.config.list_page_node) {
            const $pages = xpath(document, globalThis.config.list_page_node)[0];
            if ($pages) {
                pages = parseXpathText($pages, "list_page_id");
                if (pages) {
                    pages = Number(pages);
                }
            }
        }
        const result = {
            pages,
            page,
            list
        };

        return success(result);
    } catch (e) {
        console.error(e);
        return error(e.message);
    }
}

async function search(keyword, page = 1) {
    try {
        await matchTemplateVar();
        if (globalThis.ext && globalThis.config.search_function) {
            const result = await globalThis.ext[
                globalThis.config.search_function
            ](keyword, page);
            return success(result);
        }
        const fetchUrl = globalThis.config.search_url
            .replace(/{wd}/g, keyword)
            .replace(/{page}/g, page);
        const response = await request(fetchUrl);
        const html = await response.text();
        // const html = readFileSync("search.html");
        const { document, html: normalizeHtml } = DOMParser(html);
        // writeFileSync("search.html", normalizeHtml);

        const list = [];
        const $sections = xpath(document, globalThis.config.search_vod_node);
        $sections.forEach($row => {
            const vod_name = parseXpathText($row, "search_vod_name");
            const vod_remarks = parseXpathText($row, "search_vod_remarks");
            const vod_pic = parseXpathText($row, "search_vod_pic");
            const vod_id = parseXpathText($row, "search_vod_id");
            const vod_preview = parseXpathText($row, "search_vod_preview");

            if (vod_id) {
                list.push({
                    vod_id,
                    vod_name,
                    vod_pic,
                    vod_remarks,
                    vod_preview,
                    direction:
                        globalThis.config?.search_vod_direction ||
                        direction.vertical
                });
            }
        });

        let pages = 1;
        if (globalThis.config.list_page_node) {
            const $pages = xpath(
                document,
                globalThis.config.search_page_node
            )[0];
            if ($pages) {
                pages = parseXpathText($pages, "search_page_id");
                if (pages) {
                    pages = Number(pages);
                }
            }
        }
        const result = {
            pages,
            page,
            list
        };
        return success(result);
    } catch (e) {
        console.error(e);
        return error(e.message);
    }
}

function similar(document) {
    try {
        if (!globalThis.config.similar_node) return [];
        const $list = xpath(document, globalThis.config.similar_node);
        const list = [];
        if ($list.length) {
            [].forEach.call($list ?? [], (node, i) => {
                const vod_name = parseXpathText(node, "similar_vod_name");
                const vod_pic = parseXpathText(node, "similar_vod_pic");
                const vod_remarks = parseXpathText(node, "similar_vod_remarks");
                const vod_id = parseXpathText(node, "similar_vod_id");
                const vod_preview = parseXpathText(node, "similar_vod_preview");

                if (vod_id) {
                    list.push({
                        vod_id,
                        vod_name,
                        vod_pic,
                        vod_remarks,
                        vod_preview,
                        direction:
                            globalThis.config?.similar_vod_direction ||
                            direction.vertical
                    });
                }
            });
        }
        return list;
    } catch (e) {
        return [];
    }
}

/**
 * 这里传入的是分集id, 不是视频id
 * @param {*} url  "/ep-449073-17-1.html"
 */
async function play({ url }) {
    try {
        await matchTemplateVar();
        if (globalThis.ext && globalThis.config.play_function) {
            const playUrl =
                await globalThis.ext[globalThis.config.play_function](url);
            return success(playUrl);
        } else {
            return success(url);
        }
    } catch (e) {
        console.error(e);
        return error(e.message);
    }
}

module.exports = {
    home,
    detail,
    play,
    search,
    list
};
