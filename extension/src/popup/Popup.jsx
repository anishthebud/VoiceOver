import { useState, useEffect } from 'react'

import './Popup.css'

export const Popup = () => {
  const [count, setCount] = useState(0);
  const link = 'https://github.com/guocaoyi/create-chrome-ext';
  const [isRecording, setRecording] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const endVO = () => {
    chrome.runtime.sendMessage({ type: 'END_VO' }, async (response) => {
      setRecording(false);
      setProcessing(true);
      const toSend = new FormData();
      toSend.append('times', JSON.stringify(response.times));
      toSend.append('videoUrl', response.videoUrl);
      toSend.append('audioBlob', response.audioBlob);

      await fetch('http://localhost:3000/', {
        method: 'POST',
        body: toSend
      })
        .then(res => {
           res.arrayBuffer()
            .then((result) => {
              console.log(result);
              const videoUrl = URL.createObjectURL(new Blob([result], { type: "video/webm" }));
              // Create a download link for the video
              const a = document.createElement("video");
              a.src = videoUrl;
              a.width = 320;
              // Returning a text file which we should be able to fix somehow someway
              a.controls = true;
              document.body.appendChild(a);
              setProcessing(false);
            })
        });
    

      return true;
    })
  }

  const startVO = async () => {
    // Send message to background to start recording
    chrome.runtime.sendMessage({
      type: 'START_VO'
    })
    setRecording(true);
  }

  return (
    <main>
      <h3>YouTube VoiceOver</h3>
      <div className="calc">
        { isRecording & !isProcessing && (
          <>
            <button onClick={endVO}>
              End VoiceOver
            </button>
            <label>VoiceOver in Progress...</label>
          </>
        )}
        { !isRecording & !isProcessing && (
          <button onClick={startVO}>Start VoiceOver</button>
        )}
        { !isRecording & isProcessing && (
          <label>Creating video...</label>
        )}
      </div>
    </main>
  )
}

export default Popup
