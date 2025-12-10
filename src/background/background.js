// handle enabled state message from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Content script asking for current enabled value
  if (msg.type === "GET_ENABLED") {
    chrome.storage.local.get({ enabled: true }, (items) => {
      sendResponse({ enabled: items.enabled });
    });
    return true; // keep the message channel open for async sendResponse
  }

  // Popup notifying background that value changed (optional)
  if (msg.type === "SET_ENABLED") {
    chrome.storage.local.set({ enabled: msg.enabled });
  }
});
