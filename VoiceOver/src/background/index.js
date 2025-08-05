console.log('Background is running.')

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'START_VO') {
    console.log('Background received message.');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {type: "RECORD"});
    })
  }
})
