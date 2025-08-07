const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');
const { buffer } = require('stream/consumers');

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

function getVideo(timestamp, videoUrl) {
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

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
 
function addAudioToVideo(videoBuffer, audioBuffer) {
    return new Promise((resolve, reject) => {
        const videoStream = bufferToStream(videoBuffer);
        const audioStream = bufferToStream(audioBuffer);

        const outputChunks = []

        ffmpeg()
            .input(videoStream)
            .inputFormat("mp4")
            .input(audioStream)
            .inputFormat("webm")
            .outputOptions([
                '-map 0:v:0',
                '-map 1:a:0',
                '-c:v copy',
                '-shortest'
            ])
            .format('mp4')
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(outputChunks)))
            .pipe()
            .on('data', chunk => outputChunks.push(chunk))
        })
}

async function createVideo(info) {
    // Get the data from the request
    const { times, audioBuffer, videoUrl } = info;

    // Format the times properly
    const startTime = formatTime(times[0]);
    const endTime = formatTime(times[1]);
    const timestamp = "*" + startTime + "-" + endTime;

    // Run command
    let videoBuffer;
    await getVideo(timestamp, videoUrl)
        .then((buffer) => {
            // TODO: Audio postprocessing
            videoBuffer = buffer;
        })
        .catch((error) => console.log(`get_video command error: ${error}`));

    let sendBuffer;
    await addAudioToVideo(videoBuffer, audioBuffer)
        .then((finalVid) => {
            sendBuffer = finalVid;
        })
        .catch((error) => console.log(`addAudio command error: ${error}`));
    
    return sendBuffer;
}

module.exports = createVideo;
