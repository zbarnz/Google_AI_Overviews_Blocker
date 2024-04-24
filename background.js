chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (
    tab.url &&
    tab.url.includes("://www.google.com/search") &&
    changeInfo.status == "loading"
  ) {
    chrome.storage.local.get(["overviewClass"], function (result) {
      if (result.overviewClass) {
        // If an ID is stored, inject CSS to hide the element with that ID
        const classNames = result.overviewClass.split(" ");
        const cssCode = classNames
          .map((className) => `.${className} { display: none !important; }`)
          .join(" ");
        chrome.scripting.insertCSS(
          {
            target: { tabId: tabId },
            css: cssCode,
          },
          () => {
            console.log(`AI Overview class "${result.overviewClass}" hidden`);
          }
        );
      }
    });
  }
});
