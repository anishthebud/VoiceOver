import { startRecording, stopRecording } from "../utils/recorder";

console.log("content script loaded");

chrome.runtime.onMessage.addListener((g) => {
  if (msg.type == 'RECORD') {
    // Get the start time of the video
    const video = document.getElementsByTagName("video");
    console.log(video);
    video.pause();
    const startTime = video.currentTime;
    console.log(startTime);
    // Get the recorder to start recording
    startRecording();
    video.play();
    // Stop the recording and get the final time
    video.pause();
    const endTime = video.currentTime;
    console.log(endTime);
    stopRecording();
  }
})
