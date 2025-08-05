let mediaRecorder = null;
let chunks = [];

export async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {type: 'audio/webm' })
        const url = URL.createObjectURL(blob);

        // Create an element with the audio
        addAudioToPage(url);
    }

    mediaRecorder.start();
    console.log('Recording started...');
}

export function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        console.log('Recording stopped...');
    } else {
        console.warn('Recorder not running');
    }
}

export function addAudioToPage(url) {
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);
}
