const widget = require('./widget.js')
;(async () => {
    const result = await widget.home();
    // const result = await widget.detail({
    //     vod_id: 178238
    // });
    // const result = await widget.search('三', 1);
    // const result = await widget.list('2', 1);
    // const result = await widget.play({
    //     url: '/ep-178961-1-1.html'
    // })
    console.log(JSON.stringify(result, null, 2))
})();