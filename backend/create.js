const { spawn } = require('child_process');

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
    return new Promise((resolve, reject) => {
        const chunks = [];

        const vidOnly = spawn('yt-dlp', [
            '--download-sections', timestamp,
            '-o', '-',
            videoUrl
        ]);

        vidOnly.stdout.on('data', (chunk) => chunks.push(chunk));
        vidOnly.stderr.on('error', (data) => console.error('error', data.toString()));

        vidOnly.on('close', (exitCode) => {
            if (exitCode == 0) {
                const vidBuffer = Buffer.concat(chunks);
                
                resolve(vidBuffer);
            } else {
                reject(new Error(`yt-dlp exited with code ${exitCode}`));
            }
        })
    })
}

async function createVideo(info) {
    // Get the data from the request
    const { times, audioUrl, videoUrl } = info;

    // Format the times properly
    const startTime = formatTime(times[0]);
    const endTime = formatTime(times[1]);
    const timestamp = "*" + startTime + "-" + endTime;

    // Run command
    let sendBuffer;
    await runCommand(timestamp, videoUrl)
        .then((buffer) => {
            // TODO: Audio postprocessing
            sendBuffer = buffer;
        })
        .catch((error) => console.log(`command threw the following error: ${error}`))

    return sendBuffer;
}

module.exports = createVideo;
