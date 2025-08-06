const YTDlpWrap = require('yt-dlp-wrap').default;
const ytDlpWrap = new YTDlpWrap('yt-dlp.exe');

function formatTime(time) {
    whole = Math.floor(time);
    percentage = Math.floor(((time - whole) * Math.pow(10, 6)))
    const hours = Math.floor(whole / (60 * 60));
    const minutes = Math.floor(whole / 60);
    const seconds = whole % 60;

    return String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0') + "." + percentage;
}

function runCommand(timestamp, videoUrl) {
    let eventEmitter = ytDlpWrap
        .exec([
            videoUrl,
            '--download-sections',
            timestamp
        ])
        .on('ytDlpEvent', (eventType, eventData) =>
            console.log(eventType, eventData)
        )
        .on('error', (error) => console.error(error))
        .on('close', () => console.log('Done'));
    console.log(eventEmitter.ytDlpProcess.pid);
}

function createVideo(info) {
    // Get the data from the request
    const { times, audioUrl, videoUrl } = info;

    // Format the times properly
    const startTime = formatTime(times[0]);
    const endTime = formatTime(times[1]);
    const timestamp = "*" + startTime + "-" + endTime;

    // Run command
    runCommand(timestamp, videoUrl);
}

module.exports = createVideo;
