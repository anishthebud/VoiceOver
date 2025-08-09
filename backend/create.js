const { spawn } = require('child_process');
const { Readable } = require('stream');

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(Buffer.from(buffer));
    stream.push(null);
    return stream;
}

function convertToWebm(inputBuffer) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const errorChunks = [];
        
        const converter = spawn('ffmpeg', [
            '-i', '-',                // Read from stdin
            '-c:v', 'libvpx-vp9',     // VP9 codec
            '-c:a', 'libopus',
            '-f', 'webm',             // WebM container
            '-'                  // Output to stdout
        ]);
        
        converter.stdout.on('data', (chunk) => chunks.push(chunk));
        converter.stderr.on('data', (chunk) => errorChunks.push(chunk));

        converter.on('error', (err) => {
            console.error('FFmpeg process error:', err);
        });
        
        converter.on('close', (code) => {
            if (code == 0) {
                console.log("WebM was converted");
                resolve(Buffer.concat(chunks));
            } else {
                reject(new Error(`FFmpeg conversion failed with code ${code}`));
            }
        });

        const videoStream = bufferToStream(inputBuffer);

        videoStream.pipe(converter.stdin);

        videoStream.on('end', () => {
            if (converter.stdin && !converter.stdin.destroyed) {
                converter.stdin.end();
            }
        });

        converter.stdin.on('error', err => {
            if (err.code !== 'EOF') {
                console.error('FFmpeg video stdin error:', err);
            } else {
                console.error('Error');
            }
        });
    });
}

async function downloadVideo(timestamp, videoUrl, ext) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const errorChunks = [];

        console.log(timestamp);
        console.log(videoUrl);

        let vidOnly;

        if (ext == "bv[ext=webm]") {
            vidOnly = spawn('yt-dlp', [
                '--download-sections', timestamp,
                '-f', ext,
                '-o', '-',
                videoUrl
            ]);
        } else {
            vidOnly = spawn('yt-dlp', [
                '--download-sections', timestamp,
                '-o', '-',
                videoUrl
            ]); 
        }

        vidOnly.stdout.on('data', (chunk) => chunks.push(chunk));
        vidOnly.stderr.on('data', (chunk) => errorChunks.push(chunk));
        vidOnly.on('error', (error) => reject(error));

        vidOnly.on('close', (exitCode) => {
            if (exitCode == 0) {
                console.log('downloaded video');
                const vidBuffer = Buffer.concat(chunks);
                const errorMessage = Buffer.concat(errorChunks).toString();
                console.log(errorMessage);
                resolve(vidBuffer);
            } else {
                const errorMessage = Buffer.concat(errorChunks).toString();
                reject(new Error(`yt-dlp exited with code ${exitCode}: ${errorMessage}`));
            }
        })
    })
}

function addAudioToVideo(videoBuffer, audioBuffer) {
    return new Promise((resolve, reject) => {

        const outputChunks = [];

        const audVid = spawn('ffmpeg', [
            '-i', 'pipe:3',
            '-i', 'pipe:4',
            '-map', '0:v',
            '-map', '1:a',
            '-c:v', 'copy',
            '-c:a', 'copy',
            '-shortest',
            '-f', 'webm',
            'pipe:1'
        ], {
            stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe'] // 0: stdin, 1: stdout, 2: stderr, 3: video, 4: audio
        });

        audVid.stdout.on('data', (chunk) => {
            outputChunks.push(chunk)
        });
        audVid.on('exit', async (code, signal) => {
            if (code !== 0) {
                console.log('Error at AudVid')
                return reject(new Error(`FFmpeg exited with code ${code}, signal ${signal}`));
            }
        });
        audVid.on('close', () => {
            resolve(Buffer.concat(outputChunks))
        });

        const videoStream = bufferToStream(videoBuffer);
        const audioStream = bufferToStream(audioBuffer);

        audVid.stdio[3].on('error', err => {
            if (err.code !== 'EOF') console.error('FFmpeg video stdin error:', err);
        });

        audVid.stdio[4].on('error', err => {
            if (err.code !== 'EOF') console.error('FFmpeg video stdin error:', err);
        });

        videoStream.pipe(audVid.stdio[3]);
        audioStream.pipe(audVid.stdio[4]);

        videoStream.on('end', () => {
            if (audVid.stdio[3] && !audVid.stdio[3].destroyed) {
                audVid.stdio[3].end();
            }
        });

        audioStream.on('end', () => {
            if (audVid.stdio[4] && !audVid.stdio[4].destroyed) {
                audVid.stdio[4].end();
            }
        });
    })
}

function formatTime(time) {
    whole = Math.floor(time);
    percentage = Math.floor(((time - whole) * Math.pow(10, 6)))
    const hours = Math.floor(whole / (60 * 60));
    const minutes = Math.floor(whole / 60);
    const seconds = whole % 60;

    return String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0') + "." + percentage;
}

async function getVideo(timestamp, videoUrl) {
    try {
        // First try direct WebM download
        return await downloadVideo(timestamp, videoUrl, 'bv[ext=webm]');
    } catch (error) {
        console.log('WebM not available, downloading and converting...');
        // Download best available video format
        const videoBuffer = await downloadVideo(timestamp, videoUrl, '');
        // Convert to WebM using FFmpeg
        const webmBuffer = await convertToWebm(videoBuffer)
        console.log('WebM: ', webmBuffer)
        return webmBuffer;
    }
}

function base64ToBlob(base64) {
    const real64 = base64.split(",")[1];
    const byteChars = atob(real64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/webm' });
}

async function createVideo(info) {
    // Get the data from the request
    const { times, audioBlob, videoUrl } = info;
    const actualBlob = base64ToBlob(audioBlob);
    const fixedTimes = JSON.parse(times);

    const audioBuffer = await actualBlob.arrayBuffer();

    // Format the times properly
    const startTime = formatTime(fixedTimes[0]);
    const endTime = formatTime(fixedTimes[1]);
    const timestamp = "*" + startTime + "-" + endTime;

    // Run command
    let videoBuffer;
    await getVideo(timestamp, videoUrl)
        .then((buffer) => {
            // TODO: Audio postprocessing
            videoBuffer = buffer;
            console.log('Video has been downloaded.');
        })
        .catch((error) => console.log(`get_video command error: ${error}`));

    let sendBuffer;
    console.log('Audio/video merging started...')
    await addAudioToVideo(videoBuffer, audioBuffer)
        .then((finalVid) => {
            sendBuffer = finalVid;
            console.log('Final video has been made.');
        })
        .catch((error) => console.log(`addAudio command error: ${error}`));
    
    return sendBuffer;
}

module.exports = createVideo;
