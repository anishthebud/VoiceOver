let mediaRecorder = null;
let chunks = [];

export async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            sampleRate: 48000,
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }
     });
    mediaRecorder = new MediaRecorder(stream);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data) 
    };

    mediaRecorder.start();
    console.log('Recording started...');
}

export async function stopRecording () {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        return new Promise ((resolve) => {
            mediaRecorder.onstop = () => {
                console.log(chunks);
                const blob = new Blob(chunks, {type: 'audio/webm' })
                const url = URL.createObjectURL(blob);
                resolve(url);
            }
            mediaRecorder.stop();
        })
    } else {
        console.warn('Recorder not running');
    }
}
