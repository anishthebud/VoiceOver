console.log('Background is running.')

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_VO') {
    console.log('Starting voiceover.');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'START' });
    })
  } else if (msg.type == 'END_VO') {
    chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'END'}, (response) => {
        sendResponse(response);
      })
    })
  }
  return true;
})
