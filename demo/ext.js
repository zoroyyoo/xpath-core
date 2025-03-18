/**
 * 点击播放时，会带回detail分集的url
 * @param {*} url
 */
async function getPlayUrl(url) {
    const response = await $fetch(`https://gimy.tv/${url}`);
    const html = await response.text();
    const document = DOMParser(html);
    const $script = xpath(document, [
        "//div[contains(@class, 'myui-player__video')]/script"
    ])[0];
    let playUrl = "";
    if ($script) {
        const content = xpath($script, ".//text()")?.toString()?.trim();
        if (content.indexOf("var player_data=") !== -1) {
            const json = JSON.parse(content.substring(content.indexOf("{")));
            if (json && json.url) {
                playUrl = json.url;
            }
        }
    }
    return playUrl;
}

module.exports.getPlayUrl = getPlayUrl;
