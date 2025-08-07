import { startRecording, stopRecording } from "../utils/recorder";

// Do preprocessing for the video and the start/end times
const video = document.getElementsByTagName("video")[0];
const times = [0, 0];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type == "START") {
    // Get the start time of the video
    video.pause();
    times[0] = video.currentTime;
    // Get the recorder to start recording
    startRecording();
    // For now, going to mute the video when it starts
    // TODO: Figure out a way to not include system audio (radiating from the microphone)
    // One possible solution is to just have a different output vs. input
    video.muted = true;
    video.play();
  } else if (msg.type == "END") {
    video.pause();
    // TODO: Figure out a way to not include system audio (radiating from the microphone)
    video.muted = false;
    times[1] = video.currentTime;
    stopRecording().then((result) => {
      console.log(result);
      sendResponse({ times: times, audioUrl: result });
     });
  }
  return true;
})
